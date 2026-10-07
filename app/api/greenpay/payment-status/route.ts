import {
  NextRequest,
  NextResponse,
} from "next/server";

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

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const orderReference =
      searchParams.get("orderReference");

    if (!orderReference) {
      return NextResponse.json(
        {
          error:
            "Falta la referencia de la orden.",
        },
        { status: 400 }
      );
    }

    const {
      data: payment,
      error: paymentError,
    } = await supabaseAdmin
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
        transaction_reference,
        authorization_code,
        paid_at,
        created_at
      `)
      .eq(
        "provider_order_id",
        orderReference
      )
      .eq("provider", "GREENPAY")
      .maybeSingle();

    if (paymentError) {
      console.error(
        "Error consultando pago:",
        paymentError
      );

      return NextResponse.json(
        {
          error:
            "No pudimos consultar el pago.",
        },
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
      const {
        data,
        error: subscriptionError,
      } = await supabaseAdmin
        .from("business_subscriptions")
        .select(`
          plan_code,
          status,
          billing_cycle,
          subscription_started_at,
          subscription_ends_at
        `)
        .eq(
          "business_id",
          payment.business_id
        )
        .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Error consultando suscripción:",
          subscriptionError
        );
      }

      subscription = data;
    }

    return NextResponse.json({
      status: payment.payment_status,
      payment,
      subscription,
    });
  } catch (error) {
    console.error(
      "Error payment-status:",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno.",
      },
      { status: 500 }
    );
  }
}