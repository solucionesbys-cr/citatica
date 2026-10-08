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

    const [
      negociosResultado,
      suscripcionesResultado,
      pagosResultado,
      usuariosResultado,
      trialsResultado,
      activasResultado,
      pagadosResultado,
      fallidosResultado,
    ] = await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("business_subscriptions")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("payments")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      }),

      supabaseAdmin
        .from("business_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "TRIAL"),

      supabaseAdmin
        .from("business_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE"),

      supabaseAdmin
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "PAID"),

      supabaseAdmin
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "FAILED"),
    ]);

    if (negociosResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudieron contar los negocios: ${negociosResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    if (suscripcionesResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudieron contar las suscripciones: ${suscripcionesResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    if (pagosResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudieron contar los pagos: ${pagosResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    if (usuariosResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudieron contar los usuarios: ${usuariosResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    const resumen = {
      negocios: negociosResultado.count || 0,
      suscripciones: suscripcionesResultado.count || 0,
      pagos: pagosResultado.count || 0,
      usuarios: usuariosResultado.data.users.length,
      trials: trialsResultado.count || 0,
      activas: activasResultado.count || 0,
      pagosPagados: pagadosResultado.count || 0,
      pagosFallidos: fallidosResultado.count || 0,
    };

    return NextResponse.json({
      ok: true,
      resumen,
    });
  } catch (error) {
    console.error("ADMIN RESUMEN ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al cargar el resumen administrativo.",
      },
      { status: 500 }
    );
  }
}
