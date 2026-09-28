import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Plan = {
  code: string;
  name: string;
  monthly_price: number;
  annual_price: number;

  max_clients: number | null;
  max_services: number | null;
  max_professionals: number | null;
  max_monthly_bookings: number | null;
  max_branches: number | null;

  whatsapp_enabled: boolean;
  reminder_24h_enabled: boolean;
  reminder_2h_enabled: boolean;

  analytics_level: string;
  export_data_enabled: boolean;
  custom_branding_enabled: boolean;
  priority_support_enabled: boolean;
};

function limite(valor: number | null, singular?: string) {
  if (valor === null) {
    return "Ilimitado";
  }

  if (singular && valor === 1) {
    return `1 ${singular}`;
  }

  return valor.toLocaleString("es-CR");
}

function nivelEstadisticas(nivel: string) {
  if (nivel === "ADVANCED") return "Avanzadas";
  if (nivel === "COMPLETE") return "Completas";
  return "Básicas";
}

export default async function PlanesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data, error } = await supabase
    .from("plans")
    .select(`
      code,
      name,
      monthly_price,
      annual_price,
      max_clients,
      max_services,
      max_professionals,
      max_monthly_bookings,
      max_branches,
      whatsapp_enabled,
      reminder_24h_enabled,
      reminder_2h_enabled,
      analytics_level,
      export_data_enabled,
      custom_branding_enabled,
      priority_support_enabled
    `)
    .order("monthly_price");

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F6F9FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            padding: "30px",
            borderRadius: "18px",
            maxWidth: "520px",
            width: "100%",
          }}
        >
          <h1 style={{ color: "#042A6B" }}>
            No pudimos cargar los planes
          </h1>

          <p style={{ color: "#667085" }}>
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  const plans = (data || []) as Plan[];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)",
        fontFamily:
          "var(--font-geist-sans), Arial, sans-serif",
        color: "#042A6B",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E6EEF8",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Link href="/">
            <Image
              src="/brand/citatica-logo.png"
              alt="CitaTica"
              width={190}
              height={60}
              priority
              style={{
                width: "165px",
                height: "auto",
              }}
            />
          </Link>

          <Link
            href="/login"
            style={{
              color: "#042A6B",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          padding: "72px 24px 45px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "8px 15px",
            borderRadius: "999px",
            background: "#EEF7FF",
            color: "#0066FF",
            fontSize: "13px",
            fontWeight: "800",
            marginBottom: "18px",
          }}
        >
          15 DÍAS DE EMPRENDE GRATIS
        </div>

        <h1
          style={{
            fontSize: "clamp(38px, 6vw, 58px)",
            lineHeight: "1.05",
            letterSpacing: "-2px",
            margin: "0 0 18px",
          }}
        >
          Un plan para cada etapa de tu negocio
        </h1>

        <p
          style={{
            margin: "0 auto",
            maxWidth: "680px",
            color: "#667085",
            fontSize: "18px",
            lineHeight: "1.7",
          }}
        >
          Empieza con 15 días de CitaTica Emprende
          sin costo, sin tarjeta y sin cobros
          automáticos. Después puedes continuar con
          Gratis o elegir el plan que mejor se adapte
          a tu negocio.
        </p>
      </section>

      {/* PLANES */}
      <section
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "10px 24px 80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "22px",
            alignItems: "stretch",
          }}
        >
          {plans.map((plan) => {
            const recomendado =
              plan.code === "EMPRENDE";

            const descripcion =
              plan.code === "FREE"
                ? "Para probar CitaTica o administrar un negocio pequeño."
                : plan.code === "EMPRENDE"
                ? "Para emprendedores que quieren automatizar y crecer."
                : plan.code === "NEGOCIO"
                ? "Para negocios con más clientes, equipo y volumen."
                : "Para operaciones de mayor escala y máxima capacidad.";

            return (
              <article
                key={plan.code}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  background: "#FFFFFF",
                  borderRadius: "24px",
                  border: recomendado
                    ? "2px solid #0066FF"
                    : "1px solid #D7E9FF",
                  boxShadow: recomendado
                    ? "0 20px 50px rgba(0,102,255,0.13)"
                    : "0 12px 35px rgba(4,42,107,0.06)",
                  padding: "30px",
                }}
              >
                {recomendado && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-14px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#0066FF",
                      color: "#FFFFFF",
                      borderRadius: "999px",
                      padding: "7px 16px",
                      fontSize: "12px",
                      fontWeight: "800",
                      whiteSpace: "nowrap",
                    }}
                  >
                    RECOMENDADO
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      margin: "0 0 8px",
                      fontSize: "27px",
                      color: "#042A6B",
                    }}
                  >
                    {plan.name}
                  </h2>

                  <p
                    style={{
                      minHeight: "52px",
                      color: "#667085",
                      lineHeight: "1.5",
                      fontSize: "14px",
                    }}
                  >
                    {descripcion}
                  </p>

                  <div
                    style={{
                      marginTop: "24px",
                      marginBottom: "5px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "38px",
                        fontWeight: "850",
                        color: "#042A6B",
                      }}
                    >
                      ₡
                      {Number(
                        plan.monthly_price
                      ).toLocaleString("es-CR")}
                    </span>

                    <span
                      style={{
                        color: "#667085",
                        marginLeft: "6px",
                      }}
                    >
                      / mes
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#667085",
                      fontSize: "13px",
                      marginBottom: "24px",
                    }}
                  >
                    Anual:{" "}
                    <strong style={{ color: "#042A6B" }}>
                      ₡
                      {Number(
                        plan.annual_price
                      ).toLocaleString("es-CR")}
                    </strong>
                  </p>

                  <div
                    style={{
                      height: "1px",
                      background: "#E6EEF8",
                      marginBottom: "22px",
                    }}
                  />

                  <Caracteristica
                    texto={`${limite(
                      plan.max_clients
                    )} clientes`}
                  />

                  <Caracteristica
                    texto={`${limite(
                      plan.max_services
                    )} servicios`}
                  />

                  <Caracteristica
                    texto={`${limite(
                      plan.max_professionals
                    )} profesionales`}
                  />

                  <Caracteristica
                    texto={`${limite(
                      plan.max_monthly_bookings
                    )} reservas por mes`}
                  />

                  <Caracteristica
                    texto={
                      plan.max_branches === null
                        ? "Sucursales ilimitadas"
                        : plan.max_branches === 1
                        ? "1 sucursal"
                        : `${plan.max_branches} sucursales`
                    }
                  />

                  <Caracteristica
                    texto="Página pública de reservas"
                  />

                  <Caracteristica
                    texto="Logo y portada personalizados"
                  />

                  <Caracteristica
                    texto="Confirmaciones por WhatsApp"
                    habilitada={plan.whatsapp_enabled}
                  />

                  <Caracteristica
                    texto="Recordatorio 24 horas antes"
                    habilitada={
                      plan.reminder_24h_enabled
                    }
                  />

                  <Caracteristica
                    texto="Recordatorio 2 horas antes"
                    habilitada={
                      plan.reminder_2h_enabled
                    }
                  />

                  <Caracteristica
                    texto={`Estadísticas ${nivelEstadisticas(
                      plan.analytics_level
                    ).toLowerCase()}`}
                  />

                  <Caracteristica
                    texto="Exportación de datos"
                    habilitada={
                      plan.export_data_enabled
                    }
                  />

                  <Caracteristica
                    texto="Personalización avanzada"
                    habilitada={
                      plan.custom_branding_enabled
                    }
                  />

                  <Caracteristica
                    texto="Soporte prioritario"
                    habilitada={
                      plan.priority_support_enabled
                    }
                  />
                </div>

                <Link
                  href={`/onboarding?plan=${encodeURIComponent(
                    plan.code
                  )}`}
                  style={{
                    display: "block",
                    marginTop: "28px",
                    padding: "15px 18px",
                    textAlign: "center",
                    textDecoration: "none",
                    borderRadius: "12px",
                    fontWeight: "800",
                    background: recomendado
                      ? "#0066FF"
                      : "#042A6B",
                    color: "#FFFFFF",
                  }}
                >
                  {plan.code === "FREE"
                    ? "Empezar gratis"
                    : plan.code === "EMPRENDE"
                    ? "Probar 15 días"
                    : "Elegir este plan"}
                </Link>
              </article>
            );
          })}
        </div>

        {/* ACLARACIÓN */}
        <div
          style={{
            marginTop: "42px",
            padding: "22px",
            borderRadius: "18px",
            background: "#EEF7FF",
            border: "1px solid #D7E9FF",
            textAlign: "center",
            color: "#475467",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: "#042A6B" }}>
            Tu negocio no desaparece al terminar la prueba.
          </strong>{" "}
          Si no contratas un plan, CitaTica continuará
          funcionando con las características y límites del
          plan Gratis.
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid #E6EEF8",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "28px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
            color: "#667085",
            fontSize: "13px",
          }}
        >
          <span>
            © {new Date().getFullYear()} CitaTica
          </span>

          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <span>Términos y condiciones</span>
            <span>Política de privacidad</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Caracteristica({
  texto,
  habilitada = true,
}: {
  texto: string;
  habilitada?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        marginBottom: "12px",
        color: habilitada ? "#344054" : "#98A2B3",
        fontSize: "14px",
        lineHeight: "1.45",
      }}
    >
      <span
        style={{
          width: "20px",
          flexShrink: 0,
          fontWeight: "800",
          color: habilitada ? "#12B76A" : "#D0D5DD",
        }}
      >
        {habilitada ? "✓" : "—"}
      </span>

      <span>{texto}</span>
    </div>
  );
}