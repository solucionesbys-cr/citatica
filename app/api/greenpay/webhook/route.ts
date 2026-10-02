import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      status,
      orderId,
      authorization,
      amount,
      currency,
      transactionId,
      errors,
      last4,
      brand,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId requerido" },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentLookupError } =
      await supabaseAdmin
        .from("payments")
        .select(`
          id,
          business_id,
          plan_code,
          billing_cycle,
          amount,
          currency_code
        `)
        .eq("provider_order_id", orderId)
        .maybeSingle();

    if (paymentLookupError || !payment) {
      console.error(
        "No se encontró payment para GreenPay:",
        orderId,
        paymentLookupError
      );

      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    const pagoExitoso = Number(status) === 200;

    const { error: paymentUpdateError } =
      await supabaseAdmin
        .from("payments")
        .update({
          payment_status: pagoExitoso ? "PAID" : "FAILED",
          transaction_reference: transactionId || null,
          authorization_code: authorization || null,
          card_brand: brand || null,
          card_last4: last4 || null,
          paid_at: pagoExitoso
            ? new Date().toISOString()
            : null,
          metadata: {
            greenpay_status: status,
            greenpay_errors: errors || [],
            greenpay_amount: amount,
            greenpay_currency: currency,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

    if (paymentUpdateError) {
      console.error(
        "Error actualizando payment:",
        paymentUpdateError
      );

      return NextResponse.json(
        { error: "No se pudo actualizar el pago" },
        { status: 500 }
      );
    }

    if (pagoExitoso) {
      const inicio = new Date();
      const fin = new Date(inicio);

      if (payment.billing_cycle === "ANNUAL") {
        fin.setFullYear(fin.getFullYear() + 1);
      } else {
        fin.setMonth(fin.getMonth() + 1);
      }

      const { error: subscriptionError } =
        await supabaseAdmin
          .from("business_subscriptions")
          .update({
            plan_code: payment.plan_code,
            status: "ACTIVE",
            billing_cycle: payment.billing_cycle,
            subscription_started_at:
              inicio.toISOString(),
            subscription_ends_at:
              fin.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("business_id", payment.business_id);

      if (subscriptionError) {
        console.error(
          "Pago aprobado pero error activando suscripción:",
          subscriptionError
        );

        return NextResponse.json(
          {
            error:
              "Pago actualizado, pero no se pudo activar la suscripción",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      paymentStatus: pagoExitoso ? "PAID" : "FAILED",
    });
  } catch (error) {
    console.error("Error webhook GreenPay:", error);

    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}