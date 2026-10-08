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
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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

    const { data: pagos, error: pagosError } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        business_id,
        payment_type,
        payment_status,
        provider,
        amount,
        currency_code,
        transaction_reference,
        paid_at,
        created_at,
        updated_at,
        plan_code,
        billing_cycle,
        provider_order_id
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (pagosError) {
      return NextResponse.json(
        { error: `No se pudieron cargar los pagos: ${pagosError.message}` },
        { status: 500 }
      );
    }

    const listaPagos = pagos || [];
    const businessIds = Array.from(
      new Set(listaPagos.map((pago) => pago.business_id).filter(Boolean))
    );

    let nombresNegocios: Record<string, string> = {};

    if (businessIds.length > 0) {
      const { data: negocios } = await supabaseAdmin
        .from("businesses")
        .select("id, business_name")
        .in("id", businessIds);

      if (negocios) {
        nombresNegocios = Object.fromEntries(
          negocios.map((negocio) => [negocio.id, negocio.business_name])
        );
      }
    }

    const pagosConNegocio = listaPagos.map((pago) => ({
      ...pago,
      business_name:
        nombresNegocios[pago.business_id] || "Negocio no disponible",
    }));

    const resumen = {
      total: pagosConNegocio.length,
      pagados: pagosConNegocio.filter(
        (pago) => pago.payment_status === "PAID"
      ).length,
      pendientes: pagosConNegocio.filter(
        (pago) => pago.payment_status === "PENDING"
      ).length,
      fallidos: pagosConNegocio.filter(
        (pago) => pago.payment_status === "FAILED"
      ).length,
      montoPagadoCRC: pagosConNegocio
        .filter(
          (pago) =>
            pago.payment_status === "PAID" &&
            pago.currency_code === "CRC"
        )
        .reduce((total, pago) => total + Number(pago.amount || 0), 0),
    };

    return NextResponse.json({
      ok: true,
      pagos: pagosConNegocio,
      resumen,
    });
  } catch (error) {
    console.error("ADMIN PAGOS ERROR:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado al cargar los pagos." },
      { status: 500 }
    );
  }
}
