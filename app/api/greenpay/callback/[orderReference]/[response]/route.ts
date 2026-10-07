import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      orderReference: string;
      response: string;
    }>;
  }
) {
  const { orderReference, response } =
    await context.params;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.citatica.com";

  const destino = new URL(
    "/pago/resultado",
    siteUrl
  );

  destino.searchParams.set(
    "orderReference",
    orderReference
  );

  destino.searchParams.set(
    "greenpay",
    response
  );

  return NextResponse.redirect(destino);
}