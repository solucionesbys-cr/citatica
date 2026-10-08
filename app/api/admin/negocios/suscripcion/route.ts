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

const PLANES_VALIDOS = ["FREE", "EMPRENDE", "NEGOCIO", "PRO"];
const ESTADOS_VALIDOS = ["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"];
const CICLOS_VALIDOS = ["MONTHLY", "ANNUAL"];

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const businessId = String(body?.businessId || "").trim();
    const planCode = String(body?.planCode || "").trim().toUpperCase();
    const status = String(body?.status || "").trim().toUpperCase();
    const billingCycle = String(body?.billingCycle || "")
      .trim()
      .toUpperCase();

    if (!businessId) {
      return NextResponse.json(
        { error: "Falta el identificador del negocio." },
        { status: 400 }
      );
    }

    if (!PLANES_VALIDOS.includes(planCode)) {
      return NextResponse.json(
        { error: "El plan seleccionado no es válido." },
        { status: 400 }
      );
    }

    if (!ESTADOS_VALIDOS.includes(status)) {
      return NextResponse.json(
        { error: "El estado seleccionado no es válido." },
        { status: 400 }
      );
    }

    if (!CICLOS_VALIDOS.includes(billingCycle)) {
      return NextResponse.json(
        { error: "El ciclo de facturación no es válido." },
        { status: 400 }
      );
    }

    const { data: negocio, error: negocioError } = await supabaseAdmin
      .from("businesses")
      .select("id, business_name")
      .eq("id", businessId)
      .maybeSingle();

    if (negocioError || !negocio) {
      return NextResponse.json(
        { error: "No se encontró el negocio." },
        { status: 404 }
      );
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("code")
      .eq("code", planCode)
      .maybeSingle();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "El plan seleccionado no existe en la tabla plans." },
        { status: 400 }
      );
    }

    const { data: suscripcionExistente, error: suscripcionError } =
      await supabaseAdmin
        .from("business_subscriptions")
        .select(`
          business_id,
          trial_started_at,
          trial_ends_at,
          subscription_started_at,
          subscription_ends_at
        `)
        .eq("business_id", businessId)
        .maybeSingle();

    if (
      suscripcionError &&
      suscripcionError.code !== "PGRST116"
    ) {
      return NextResponse.json(
        {
          error: `No se pudo consultar la suscripción: ${suscripcionError.message}`,
        },
        { status: 500 }
      );
    }

    const ahora = new Date();

    let trialStartedAt =
      suscripcionExistente?.trial_started_at || null;
    let trialEndsAt =
      suscripcionExistente?.trial_ends_at || null;
    let subscriptionStartedAt =
      suscripcionExistente?.subscription_started_at || null;
    let subscriptionEndsAt =
      suscripcionExistente?.subscription_ends_at || null;

    if (status === "TRIAL") {
      if (!trialStartedAt) {
        trialStartedAt = ahora.toISOString();
      }

      const finActual = trialEndsAt ? new Date(trialEndsAt) : null;

      if (!finActual || Number.isNaN(finActual.getTime()) || finActual <= ahora) {
        const finPrueba = new Date(ahora);
        finPrueba.setDate(finPrueba.getDate() + 14);
        trialEndsAt = finPrueba.toISOString();
      }
    }

    if (status === "ACTIVE") {
      if (!subscriptionStartedAt) {
        subscriptionStartedAt = ahora.toISOString();
      }

      const fin = new Date(ahora);

      if (billingCycle === "ANNUAL") {
        fin.setFullYear(fin.getFullYear() + 1);
      } else {
        fin.setMonth(fin.getMonth() + 1);
      }

      subscriptionEndsAt = fin.toISOString();
    }

    const payload = {
      plan_code: planCode,
      status,
      billing_cycle: billingCycle,
      trial_started_at: trialStartedAt,
      trial_ends_at: trialEndsAt,
      subscription_started_at: subscriptionStartedAt,
      subscription_ends_at: subscriptionEndsAt,
    };

    if (suscripcionExistente) {
      const { error: updateError } = await supabaseAdmin
        .from("business_subscriptions")
        .update(payload)
        .eq("business_id", businessId);

      if (updateError) {
        return NextResponse.json(
          {
            error: `No se pudo actualizar la suscripción: ${updateError.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("business_subscriptions")
        .insert({
          business_id: businessId,
          ...payload,
        });

      if (insertError) {
        return NextResponse.json(
          {
            error: `No se pudo crear la suscripción: ${insertError.message}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      businessId,
      businessName: negocio.business_name,
      planCode,
      status,
      billingCycle,
      trialStartedAt,
      trialEndsAt,
      subscriptionStartedAt,
      subscriptionEndsAt,
    });
  } catch (error) {
    console.error("ADMIN SUSCRIPCION ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al actualizar la suscripción.",
      },
      { status: 500 }
    );
  }
}
