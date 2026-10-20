import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function destinoSeguro(valor: string | null) {
  if (!valor) return "";

  if (!valor.startsWith("/") || valor.startsWith("//")) {
    return "";
  }

  return valor;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription =
    requestUrl.searchParams.get("error_description");

  const next = destinoSeguro(
    requestUrl.searchParams.get("next")
  );

  function irALogin(tipoError: string) {
    const loginUrl = new URL(
      "/login",
      requestUrl.origin
    );

    loginUrl.searchParams.set(
      "error",
      tipoError
    );

    if (next) {
      loginUrl.searchParams.set(
        "next",
        next
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  if (error) {
    console.error(
      "OAuth provider error:",
      error,
      errorDescription
    );

    return irALogin("google_oauth");
  }

  if (!code) {
    return irALogin("missing_oauth_code");
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(
      code
    );

  if (exchangeError) {
    console.error(
      "Error exchangeCodeForSession:",
      exchangeError
    );

    return irALogin("oauth_exchange");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "Usuario OAuth no disponible:",
      userError
    );

    return irALogin("oauth_user");
  }

  const {
    data: membresia,
    error: membresiaError,
  } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membresiaError) {
    console.error(
      "Error consultando business_members:",
      membresiaError
    );
  }

  // Si el usuario ya tiene negocio, siempre entra al panel.
  if (membresia?.business_id) {
    return NextResponse.redirect(
      new URL("/panel", requestUrl.origin)
    );
  }

  // Si venía de elegir un plan, regresa al onboarding
  // conservando el plan seleccionado.
  if (next) {
    return NextResponse.redirect(
      new URL(next, requestUrl.origin)
    );
  }

  // Usuario nuevo que llegó directamente al login.
  return NextResponse.redirect(
    new URL("/planes", requestUrl.origin)
  );
}
