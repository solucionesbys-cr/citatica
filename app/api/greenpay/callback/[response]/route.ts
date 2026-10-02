import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      response: string;
    }>;
  }
) {
  const { response } = await context.params;

  const url = new URL(request.url);

  const destino = new URL("/pago/resultado", url.origin);
  destino.searchParams.set("greenpay", response);

  return NextResponse.redirect(destino);
}
