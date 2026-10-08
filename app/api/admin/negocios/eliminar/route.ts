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

async function validarSuperadmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      ),
    };
  }

  const accessToken = authorization.replace("Bearer ", "").trim();

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Sesión inválida o vencida." },
        { status: 401 }
      ),
    };
  }

  const { data: admin, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("role, is_active")
    .eq("user_id", user.id)
    .eq("role", "SUPERADMIN")
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !admin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No tiene permisos de SUPERADMIN." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const };
}

async function contar(tabla: string, businessId: string) {
  const { count, error } = await supabaseAdmin
    .from(tabla)
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (error) {
    console.error(`Error contando ${tabla}:`, error.message);
    return 0;
  }

  return count || 0;
}

export async function POST(request: NextRequest) {
  try {
    const acceso = await validarSuperadmin(request);

    if (!acceso.ok) {
      return acceso.response;
    }

    const body = await request.json();
    const businessId = String(body?.businessId || "").trim();
    const action = String(body?.action || "").trim().toUpperCase();
    const confirmName = String(body?.confirmName || "").trim();

    if (!businessId) {
      return NextResponse.json(
        { error: "Falta el identificador del negocio." },
        { status: 400 }
      );
    }

    if (!["PREVIEW", "DELETE"].includes(action)) {
      return NextResponse.json(
        { error: "La acción solicitada no es válida." },
        { status: 400 }
      );
    }

    const { data: negocio, error: negocioError } = await supabaseAdmin
      .from("businesses")
      .select("id, business_name, slug, created_at")
      .eq("id", businessId)
      .maybeSingle();

    if (negocioError || !negocio) {
      return NextResponse.json(
        { error: "No se encontró el negocio." },
        { status: 404 }
      );
    }

    if (action === "PREVIEW") {
      const [
        miembros,
        clientes,
        servicios,
        profesionales,
        citas,
        pagos,
        suscripciones,
        configuraciones,
      ] = await Promise.all([
        contar("business_members", businessId),
        contar("clients", businessId),
        contar("services", businessId),
        contar("professionals", businessId),
        contar("appointments", businessId),
        contar("payments", businessId),
        contar("business_subscriptions", businessId),
        contar("business_settings", businessId),
      ]);

      return NextResponse.json({
        ok: true,
        preview: {
          businessId: negocio.id,
          businessName: negocio.business_name,
          slug: negocio.slug,
          createdAt: negocio.created_at,
          counts: {
            miembros,
            clientes,
            servicios,
            profesionales,
            citas,
            pagos,
            suscripciones,
            configuraciones,
          },
        },
      });
    }

    if (confirmName !== negocio.business_name) {
      return NextResponse.json(
        {
          error:
            "El nombre escrito no coincide exactamente con el nombre del negocio.",
        },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("businesses")
      .delete()
      .eq("id", businessId);

    if (deleteError) {
      return NextResponse.json(
        {
          error:
            `No se pudo eliminar el negocio. La base de datos protegió una relación asociada: ${deleteError.message}`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      deletedBusinessId: businessId,
      deletedBusinessName: negocio.business_name,
    });
  } catch (error) {
    console.error("ADMIN ELIMINAR NEGOCIO ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al intentar eliminar el negocio.",
      },
      { status: 500 }
    );
  }
}
