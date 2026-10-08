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
    const action = String(body?.action || "").trim().toUpperCase();

    if (!businessId) {
      return NextResponse.json(
        { error: "Falta el identificador del negocio." },
        { status: 400 }
      );
    }

    if (!["SUSPEND", "REACTIVATE"].includes(action)) {
      return NextResponse.json(
        { error: "La acción solicitada no es válida." },
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

    const { data: suscripcion, error: suscripcionError } =
      await supabaseAdmin
        .from("business_subscriptions")
        .select("business_id, status")
        .eq("business_id", businessId)
        .maybeSingle();

    if (suscripcionError && suscripcionError.code !== "PGRST116") {
      return NextResponse.json(
        {
          error: `No se pudo consultar la suscripción: ${suscripcionError.message}`,
        },
        { status: 500 }
      );
    }

    if (!suscripcion) {
      return NextResponse.json(
        {
          error:
            "El negocio no tiene una suscripción registrada. Asigne un plan antes de suspenderlo.",
        },
        { status: 400 }
      );
    }

    if (action === "SUSPEND") {
      const { error: updateSubscriptionError } = await supabaseAdmin
        .from("business_subscriptions")
        .update({
          status: "SUSPENDED",
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", businessId);

      if (updateSubscriptionError) {
        return NextResponse.json(
          {
            error: `No se pudo suspender la suscripción: ${updateSubscriptionError.message}`,
          },
          { status: 500 }
        );
      }

      const { data: settings } = await supabaseAdmin
        .from("business_settings")
        .select("business_id")
        .eq("business_id", businessId)
        .maybeSingle();

      if (settings) {
        await supabaseAdmin
          .from("business_settings")
          .update({ is_published: false })
          .eq("business_id", businessId);
      }

      return NextResponse.json({
        ok: true,
        businessId,
        businessName: negocio.business_name,
        status: "SUSPENDED",
        isPublished: false,
      });
    }

    const { error: reactivateError } = await supabaseAdmin
      .from("business_subscriptions")
      .update({
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", businessId);

    if (reactivateError) {
      return NextResponse.json(
        {
          error: `No se pudo reactivar la suscripción: ${reactivateError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      businessId,
      businessName: negocio.business_name,
      status: "ACTIVE",
    });
  } catch (error) {
    console.error("ADMIN ESTADO NEGOCIO ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al cambiar el estado del negocio.",
      },
      { status: 500 }
    );
  }
}
