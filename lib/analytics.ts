import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export type AnalyticsEventName =
  | "page_view"
  | "business_view"
  | "booking_started"
  | "booking_completed"
  | "login"
  | "signup";

type RegistrarEventoOpciones = {
  businessSlug?: string | null;
  pagePath?: string | null;
  referrer?: string | null;
};

const SESSION_KEY = "citatica_session_id";

function obtenerSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  let sessionId = window.localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

function obtenerPagePath() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function obtenerReferrer() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.referrer || null;
}

export async function registrarEvento(
  eventName: AnalyticsEventName,
  opciones: RegistrarEventoOpciones = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  const sessionId = obtenerSessionId();

  if (!sessionId) {
    return;
  }

  const pagePath =
    opciones.pagePath ??
    obtenerPagePath();

  const referrer =
    opciones.referrer ??
    obtenerReferrer();

  const { error } = await supabase.rpc(
    "track_website_event",
    {
      p_event_name: eventName,
      p_page_path: pagePath,
      p_session_id: sessionId,
      p_business_slug:
        opciones.businessSlug || null,
      p_referrer: referrer,
    }
  );

  if (error) {
    console.error(
      "Error registrando evento de analítica:",
      error.message
    );
  }
}

export function registrarPageView(
  opciones: Omit<RegistrarEventoOpciones, "pagePath"> = {}
) {
  return registrarEvento("page_view", opciones);
}

export function registrarVistaNegocio(
  businessSlug: string
) {
  return registrarEvento("business_view", {
    businessSlug,
  });
}

export function registrarInicioReserva(
  businessSlug: string
) {
  return registrarEvento("booking_started", {
    businessSlug,
  });
}

export function registrarReservaCompletada(
  businessSlug: string
) {
  return registrarEvento("booking_completed", {
    businessSlug,
  });
}

export function registrarLogin() {
  return registrarEvento("login");
}

export function registrarSignup() {
  return registrarEvento("signup");
}
