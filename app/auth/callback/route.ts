import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription =
    requestUrl.searchParams.get("error_description");

  if (error) {
    console.error(
      "OAuth provider error:",
      error,
      errorDescription
    );

    return NextResponse.redirect(
      new URL(
        "/login?error=google_oauth",
        requestUrl.origin
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?error=missing_oauth_code",
        requestUrl.origin
      )
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      "Error exchangeCodeForSession:",
      exchangeError
    );

    return NextResponse.redirect(
      new URL(
        "/login?error=oauth_exchange",
        requestUrl.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL("/panel", requestUrl.origin)
  );
}
