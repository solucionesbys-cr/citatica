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
      planesResultado,
    ] = await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("id, business_name, slug, created_at")
        .order("business_name", { ascending: true }),

      supabaseAdmin
        .from("business_subscriptions")
        .select(`
          business_id,
          plan_code,
          status,
          billing_cycle,
          trial_started_at,
          trial_ends_at,
          subscription_started_at,
          subscription_ends_at,
          updated_at
        `),

      supabaseAdmin
        .from("plans")
        .select("code, name"),
    ]);

    if (negociosResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudieron cargar los negocios: ${negociosResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    if (suscripcionesResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudieron cargar las suscripciones: ${suscripcionesResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    const negocios = negociosResultado.data || [];
    const suscripciones = suscripcionesResultado.data || [];
    const planes = planesResultado.data || [];

    const suscripcionPorNegocio = new Map(
      suscripciones.map((item) => [item.business_id, item])
    );

    const nombrePlanPorCodigo = new Map(
      planes.map((plan) => [plan.code, plan.name])
    );

    const filas = negocios.map((negocio) => {
      const suscripcion = suscripcionPorNegocio.get(negocio.id);

      return {
        business_id: negocio.id,
        business_name: negocio.business_name,
        slug: negocio.slug,
        business_created_at: negocio.created_at,
        plan_code: suscripcion?.plan_code || null,
        plan_name:
          (suscripcion?.plan_code
            ? nombrePlanPorCodigo.get(suscripcion.plan_code)
            : null) || null,
        status: suscripcion?.status || null,
        billing_cycle: suscripcion?.billing_cycle || null,
        trial_started_at: suscripcion?.trial_started_at || null,
        trial_ends_at: suscripcion?.trial_ends_at || null,
        subscription_started_at:
          suscripcion?.subscription_started_at || null,
        subscription_ends_at:
          suscripcion?.subscription_ends_at || null,
        updated_at: suscripcion?.updated_at || null,
      };
    });

    const resumen = {
      negocios: filas.length,
      conSuscripcion: filas.filter((item) => item.plan_code).length,
      sinSuscripcion: filas.filter((item) => !item.plan_code).length,
      trial: filas.filter((item) => item.status === "TRIAL").length,
      active: filas.filter((item) => item.status === "ACTIVE").length,
      suspended: filas.filter((item) => item.status === "SUSPENDED").length,
      cancelled: filas.filter((item) => item.status === "CANCELLED").length,
    };

    return NextResponse.json({
      ok: true,
      suscripciones: filas,
      resumen,
    });
  } catch (error) {
    console.error("ADMIN SUSCRIPCIONES LIST ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al cargar las suscripciones.",
      },
      { status: 500 }
    );
  }
}
