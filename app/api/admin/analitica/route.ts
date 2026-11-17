import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

type Evento = {
  event_name: string;
  page_path: string | null;
  business_slug: string | null;
  session_id: string;
  referrer: string | null;
  created_at: string;
};

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

function fechaCostaRica(fecha: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

function origenDesdeReferrer(referrer: string | null) {
  if (!referrer) return "Directo";

  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Otro";
  }
}

async function cargarEventos(desdeISO: string): Promise<Evento[]> {
  const eventos: Evento[] = [];

  for (let pagina = 0; pagina < MAX_PAGES; pagina += 1) {
    const desde = pagina * PAGE_SIZE;
    const hasta = desde + PAGE_SIZE - 1;

    const { data, error } = await supabaseAdmin
      .from("website_events")
      .select(`
        event_name,
        page_path,
        business_slug,
        session_id,
        referrer,
        created_at
      `)
      .gte("created_at", desdeISO)
      .order("created_at", { ascending: false })
      .range(desde, hasta);

    if (error) {
      throw new Error(error.message);
    }

    const lote = (data || []) as Evento[];
    eventos.push(...lote);

    if (lote.length < PAGE_SIZE) {
      break;
    }
  }

  return eventos;
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida o vencida." },
        { status: 401 }
      );
    }

    const { data: admin, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("role", "SUPERADMIN")
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: "No tiene permisos de SUPERADMIN." },
        { status: 403 }
      );
    }

    const diasSolicitados = Number(
      request.nextUrl.searchParams.get("dias") || "30"
    );

    const diasPermitidos = [1, 7, 30, 90];
    const dias = diasPermitidos.includes(diasSolicitados)
      ? diasSolicitados
      : 30;

    const ahora = new Date();
    const desde = new Date(
      ahora.getTime() - (dias - 1) * 24 * 60 * 60 * 1000
    );

    desde.setUTCHours(6, 0, 0, 0);

    const eventos = await cargarEventos(desde.toISOString());

    const visitantes = new Set(
      eventos
        .map((evento) => evento.session_id)
        .filter(Boolean)
    ).size;

    const paginasVistas = eventos.filter(
      (evento) => evento.event_name === "page_view"
    ).length;

    const negociosVistos = eventos.filter(
      (evento) => evento.event_name === "business_view"
    ).length;

    const reservasIniciadas = eventos.filter(
      (evento) => evento.event_name === "booking_started"
    ).length;

    const reservasCompletadas = eventos.filter(
      (evento) => evento.event_name === "booking_completed"
    ).length;

    const conversion =
      reservasIniciadas > 0
        ? Number(
            ((reservasCompletadas / reservasIniciadas) * 100).toFixed(1)
          )
        : 0;

    const serieMap = new Map<
      string,
      {
        fecha: string;
        visitantes: Set<string>;
        vistas: number;
        reservas: number;
      }
    >();

    for (let i = 0; i < dias; i += 1) {
      const fecha = new Date(
        ahora.getTime() - (dias - 1 - i) * 24 * 60 * 60 * 1000
      );
      const clave = fechaCostaRica(fecha);

      serieMap.set(clave, {
        fecha: clave,
        visitantes: new Set<string>(),
        vistas: 0,
        reservas: 0,
      });
    }

    for (const evento of eventos) {
      const clave = fechaCostaRica(new Date(evento.created_at));
      const dia = serieMap.get(clave);

      if (!dia) continue;

      if (evento.session_id) {
        dia.visitantes.add(evento.session_id);
      }

      if (evento.event_name === "page_view") {
        dia.vistas += 1;
      }

      if (evento.event_name === "booking_completed") {
        dia.reservas += 1;
      }
    }

    const serie = Array.from(serieMap.values()).map((item) => ({
      fecha: item.fecha,
      visitantes: item.visitantes.size,
      vistas: item.vistas,
      reservas: item.reservas,
    }));

    const negociosMap = new Map<string, number>();

    for (const evento of eventos) {
      if (
        evento.event_name === "business_view" &&
        evento.business_slug
      ) {
        negociosMap.set(
          evento.business_slug,
          (negociosMap.get(evento.business_slug) || 0) + 1
        );
      }
    }

    const slugs = Array.from(negociosMap.keys());

    let nombresNegocios = new Map<string, string>();

    if (slugs.length > 0) {
      const { data: negocios, error: negociosError } =
        await supabaseAdmin
          .from("businesses")
          .select("slug, business_name")
          .in("slug", slugs);

      if (!negociosError) {
        nombresNegocios = new Map(
          (negocios || []).map((negocio) => [
            negocio.slug,
            negocio.business_name,
          ])
        );
      }
    }

    const topNegocios = Array.from(negociosMap.entries())
      .map(([slug, vistas]) => ({
        slug,
        nombre: nombresNegocios.get(slug) || slug,
        vistas,
      }))
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 10);

    const origenesMap = new Map<string, number>();

    for (const evento of eventos) {
      if (evento.event_name !== "page_view") continue;

      const origen = origenDesdeReferrer(evento.referrer);

      origenesMap.set(
        origen,
        (origenesMap.get(origen) || 0) + 1
      );
    }

    const origenes = Array.from(origenesMap.entries())
      .map(([origen, vistas]) => ({
        origen,
        vistas,
      }))
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 8);

    const recientes = eventos.slice(0, 25).map((evento) => ({
      event_name: evento.event_name,
      page_path: evento.page_path,
      business_slug: evento.business_slug,
      created_at: evento.created_at,
    }));

    return NextResponse.json({
      ok: true,
      periodo: {
        dias,
        desde: desde.toISOString(),
        hasta: ahora.toISOString(),
      },
      resumen: {
        visitantes,
        paginasVistas,
        negociosVistos,
        reservasIniciadas,
        reservasCompletadas,
        conversion,
      },
      serie,
      topNegocios,
      origenes,
      recientes,
      limiteAlcanzado: eventos.length >= PAGE_SIZE * MAX_PAGES,
    });
  } catch (error) {
    console.error("ADMIN ANALITICA ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado al cargar la analítica.",
      },
      { status: 500 }
    );
  }
}
