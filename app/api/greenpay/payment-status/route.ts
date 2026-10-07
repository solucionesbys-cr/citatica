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
    const { searchParams } = new URL(request.url);
    const response = searchParams.get("response");

    if (!response) {
      return NextResponse.json(
        { error: "Falta la respuesta de GreenPay." },
        { status: 400 }
      );
    }

    /*
      En este momento el callback visual nos entrega el parámetro "greenpay",
      pero el pago en Supabase está identificado por provider_order_id.

      Por ahora buscamos el pago más reciente realizado con GreenPay.
      Luego podemos mejorar esto para asociarlo directamente al orderReference.
    */

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        business_id,
        provider_order_id,
        payment_status,
        amount,
        currency_code,
        plan_code,
        billing_cycle,
        paid_at,
        created_at
      `)
      .eq("provider", "GREENPAY")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error consultando pago:", error);

      return NextResponse.json(
        { error: "No pudimos consultar el pago." },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json({
        status: "NOT_FOUND",
      });
    }

    let subscription = null;

    if (payment.business_id) {
      const { data } = await supabaseAdmin
        .from("business_subscriptions")
        .select(`
          plan_code,
          status,
          billing_cycle,
          subscription_started_at,
          subscription_ends_at
        `)
        .eq("business_id", payment.business_id)
        .maybeSingle();

      subscription = data;
    }

    return NextResponse.json({
      status: payment.payment_status,
      payment,
      subscription,
    });
  } catch (error) {
    console.error("Error payment-status:", error);

    return NextResponse.json(
      { error: "Error interno." },
      { status: 500 }
    );
  }
}