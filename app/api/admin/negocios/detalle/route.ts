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

    const businessId =
      request.nextUrl.searchParams.get("businessId")?.trim() || "";

    if (!businessId) {
      return NextResponse.json(
        { error: "Falta businessId." },
        { status: 400 }
      );
    }

    const [
      negocioResultado,
      configuracionResultado,
      suscripcionResultado,
      clientesResultado,
      serviciosResultado,
      profesionalesResultado,
      citasResultado,
      pagosResultado,
    ] = await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("id, business_name, slug, timezone, created_at")
        .eq("id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("business_settings")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("business_subscriptions")
        .select("*")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabaseAdmin
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),

      supabaseAdmin
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),

      supabaseAdmin
        .from("professionals")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),

      supabaseAdmin
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),

      supabaseAdmin
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),
    ]);

    if (negocioResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudo cargar el negocio: ${negocioResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    if (!negocioResultado.data) {
      return NextResponse.json(
        { error: "No se encontró el negocio solicitado." },
        { status: 404 }
      );
    }

    const errores = [
      configuracionResultado.error,
      suscripcionResultado.error,
      clientesResultado.error,
      serviciosResultado.error,
      profesionalesResultado.error,
      citasResultado.error,
      pagosResultado.error,
    ].filter(Boolean);

    if (errores.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se pudo completar el resumen administrativo del negocio.",
          details: errores.map((item) => item?.message),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      negocio: negocioResultado.data,
      configuracion: configuracionResultado.data || null,
      suscripcion: suscripcionResultado.data || null,
      resumen: {
        clientes: clientesResultado.count || 0,
        servicios: serviciosResultado.count || 0,
        profesionales: profesionalesResultado.count || 0,
        citas: citasResultado.count || 0,
        pagos: pagosResultado.count || 0,
      },
    });
  } catch (error) {
    console.error("ADMIN NEGOCIO DETALLE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al cargar el detalle del negocio.",
      },
      { status: 500 }
    );
  }
}
