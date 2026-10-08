import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      businessId,
      planCode,
      billingCycle,
      customer,
    } = body;

    if (!businessId || !planCode || !billingCycle) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    if (!["MONTHLY", "ANNUAL"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "Ciclo de facturación inválido." },
        { status: 400 }
      );
    }

   const { data: plan, error: planError } = await supabaseAdmin
  .from("plans")
      .select(`
        code,
        name,
        monthly_price,
        annual_price,
        currency_code
      `)
      .eq("code", planCode)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "No se encontró el plan seleccionado." },
        { status: 404 }
      );
    }

    if (plan.code === "FREE") {
      return NextResponse.json(
        { error: "El plan gratuito no requiere pago." },
        { status: 400 }
      );
    }

    const amount =
      billingCycle === "ANNUAL"
        ? Number(plan.annual_price)
        : Number(plan.monthly_price);

    const currency = plan.currency_code || "CRC";

    const terminal =
      currency === "USD"
        ? process.env.GREENPAY_TERMINAL_USD
        : process.env.GREENPAY_TERMINAL_CRC;

    if (
      !process.env.GREENPAY_SECRET ||
      !process.env.GREENPAY_MERCHANT_ID ||
      !terminal
    ) {
      return NextResponse.json(
        { error: "La configuración de GreenPay está incompleta." },
        { status: 500 }
      );
    }

    const orderReference = `CT-${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}`;

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const callback =
  `${origin}/api/greenpay/callback/order/${orderReference}`;

   const greenPayBody = {
  secret: process.env.GREENPAY_SECRET,
  merchantId: process.env.GREENPAY_MERCHANT_ID,
  terminal,
  amount,
  currency,
  description: `CitaTica - Plan ${plan.name}`,
  orderReference,
  callback,

  additional: {
    customer: {
      name: "Cliente Prueba",
      email: "prueba@citatica.com",
      identification: "123456789",

      billingAddress: {
        country: "CR",
        province: "Guanacaste",
        city: "Hojancha",
        street1: "Hojancha Centro",
        street2: "",
        zip: "51101",
      },

      shippingAddress: {
        country: "CR",
        province: "Guanacaste",
        city: "Hojancha",
        street1: "Hojancha Centro",
        street2: "",
        zip: "51101",
      },
    },
  },
};

    const endpoint =
      process.env.GREENPAY_ENV === "production"
        ? "https://checkoutv2.greenpay.me/createOrder"
        : "https://checkoutv2.greenpaysbx.me/createOrder";

console.log(
  "GREENPAY REQUEST JSON:",
  JSON.stringify(
    {
      ...greenPayBody,
      secret: "***OCULTO***",
    },
    null,
    2
  )
);
console.log("GREENPAY ENDPOINT:", endpoint);
console.log("GREENPAY TERMINAL:", terminal);
console.log("GREENPAY CURRENCY:", currency);
console.log("GREENPAY AMOUNT:", amount);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(greenPayBody),
    });

    const greenPayResponse = await response.json();

    if (!response.ok) {
      console.error("GreenPay createOrder error:", greenPayResponse);

return NextResponse.json(
  {
    error: "GreenPay rechazó la creación de la orden.",
    details: greenPayResponse,
    debug: {
      endpoint,
      env: process.env.GREENPAY_ENV,
      hasSecret: Boolean(process.env.GREENPAY_SECRET),
      secretLength: process.env.GREENPAY_SECRET?.length || 0,
      hasMerchantId: Boolean(process.env.GREENPAY_MERCHANT_ID),
      merchantIdLength: process.env.GREENPAY_MERCHANT_ID?.length || 0,
      hasTerminal: Boolean(terminal),
      terminalLength: terminal?.length || 0,
      amount,
      amountType: typeof amount,
      currency,
      description: greenPayBody.description,
      orderReference: greenPayBody.orderReference,
      callback: greenPayBody.callback,
      hasCustomer: Boolean(greenPayBody.additional?.customer),
      hasBillingAddress: Boolean(
        greenPayBody.additional?.customer?.billingAddress
      ),
      hasShippingAddress: Boolean(
        greenPayBody.additional?.customer?.shippingAddress
      ),
      },
  },
  { status: 400 }
      );
    }

    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        business_id: businessId,
        appointment_id: null,
        payment_type: "SUBSCRIPTION",
        payment_status: "PENDING",
        provider: "GREENPAY",
        amount,
        currency_code: currency,
        plan_code: plan.code,
        billing_cycle: billingCycle,
        provider_order_id: orderReference,
        metadata: {
          greenpay_session: greenPayResponse.session,
          greenpay_token: greenPayResponse.token,
        },
      });

    if (paymentError) {
      console.error("Error guardando payment:", paymentError);

      return NextResponse.json(
        {
          error:
            "GreenPay creó la orden, pero no se pudo registrar el pago.",
        },
        { status: 500 }
      );
    }
const checkoutBase =
  process.env.GREENPAY_ENV === "production"
    ? "https://checkout-form.greenpay.me"
    : "https://sandbox-checkoutform.greenpay.me";

const checkoutUrl =
  `${checkoutBase}/${greenPayResponse.session}`;

    return NextResponse.json({
      ok: true,
      orderReference,
      session: greenPayResponse.session,
      token: greenPayResponse.token,
      checkoutUrl,
      amount,
      currency,
      plan: plan.code,
      billingCycle,
    });
  } catch (error) {
    console.error("Error creando orden GreenPay:", error);

    return NextResponse.json(
      { error: "Error interno al crear la orden." },
      { status: 500 }
    );
  }
}