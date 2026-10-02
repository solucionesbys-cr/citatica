"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PagoResultadoPage() {
  return (
    <Suspense fallback={<PantallaProcesando />}>
      <PagoResultadoContent />
    </Suspense>
  );
}

function PagoResultadoContent() {
  const searchParams = useSearchParams();
  const greenpay = searchParams.get("greenpay");

  const [estado, setEstado] = useState<
    "procesando" | "recibido" | "sin-respuesta"
  >("procesando");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEstado(greenpay ? "recibido" : "sin-respuesta");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [greenpay]);

  if (estado === "procesando") {
    return <PantallaProcesando />;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)",
        fontFamily:
          "var(--font-geist-sans), Arial, sans-serif",
        color: "#042A6B",
        padding: "32px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <Link href="/">
            <Image
              src="/brand/citatica-logo.png"
              alt="CitaTica"
              width={210}
              height={70}
              priority
              style={{
                width: "180px",
                height: "auto",
              }}
            />
          </Link>
        </div>

        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #D7E9FF",
            borderRadius: "26px",
            padding: "clamp(28px, 6vw, 52px)",
            boxShadow:
              "0 18px 50px rgba(4,42,107,0.08)",
            textAlign: "center",
          }}
        >
          {estado === "recibido" ? (
            <>
              <div
                style={{
                  width: "78px",
                  height: "78px",
                  borderRadius: "50%",
                  margin: "0 auto 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ECFDF3",
                  color: "#067647",
                  fontSize: "38px",
                  fontWeight: "900",
                }}
              >
                ✓
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "#EEF7FF",
                  color: "#0066FF",
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.8px",
                  marginBottom: "18px",
                }}
              >
                RESPUESTA RECIBIDA
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(32px, 6vw, 46px)",
                  lineHeight: 1.08,
                  color: "#042A6B",
                }}
              >
                Estamos confirmando tu pago
              </h1>

              <p
                style={{
                  maxWidth: "560px",
                  margin: "18px auto 0",
                  color: "#667085",
                  fontSize: "17px",
                  lineHeight: 1.7,
                }}
              >
                GreenPay ya devolvió la respuesta a CitaTica.
                Estamos verificando la transacción antes de
                activar o actualizar tu plan.
              </p>

              <div
                style={{
                  marginTop: "28px",
                  padding: "18px",
                  borderRadius: "16px",
                  background: "#F8FAFC",
                  border: "1px solid #EAECF0",
                  color: "#475467",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  textAlign: "left",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#042A6B",
                    marginBottom: "5px",
                  }}
                >
                  Importante
                </strong>
                No cierres sesión si deseas continuar
                configurando tu negocio. La activación del plan
                se confirmará cuando CitaTica reciba la
                validación final del pago.
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: "78px",
                  height: "78px",
                  borderRadius: "50%",
                  margin: "0 auto 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#FFF8E8",
                  color: "#B54708",
                  fontSize: "34px",
                  fontWeight: "900",
                }}
              >
                !
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(32px, 6vw, 46px)",
                  lineHeight: 1.08,
                  color: "#042A6B",
                }}
              >
                No encontramos la respuesta del pago
              </h1>

              <p
                style={{
                  maxWidth: "560px",
                  margin: "18px auto 0",
                  color: "#667085",
                  fontSize: "17px",
                  lineHeight: 1.7,
                }}
              >
                Puedes volver a tu panel. Si realizaste un pago,
                CitaTica lo confirmará cuando reciba la
                notificación de GreenPay.
              </p>
            </>
          )}

          <div
            style={{
              marginTop: "32px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            <Link
              href="/panel"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "190px",
                padding: "14px 20px",
                borderRadius: "12px",
                background: "#0066FF",
                color: "#FFFFFF",
                fontWeight: "800",
                textDecoration: "none",
              }}
            >
              Ir a mi panel
            </Link>

            <Link
              href="/planes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "190px",
                padding: "14px 20px",
                borderRadius: "12px",
                background: "#FFFFFF",
                border: "1px solid #D0D5DD",
                color: "#344054",
                fontWeight: "800",
                textDecoration: "none",
              }}
            >
              Ver planes
            </Link>
          </div>
        </section>

        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            color: "#98A2B3",
            fontSize: "13px",
          }}
        >
          Pago procesado mediante GreenPay en el entorno
          correspondiente.
        </p>
      </div>
    </main>
  );
}

function PantallaProcesando() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F6F9FF",
        fontFamily:
          "var(--font-geist-sans), Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          textAlign: "center",
        }}
      >
        <Image
          src="/brand/citatica-icon.png"
          alt="CitaTica"
          width={72}
          height={72}
        />

        <div
          style={{
            width: "34px",
            height: "34px",
            margin: "22px auto 0",
            borderRadius: "50%",
            border: "4px solid #D7E9FF",
            borderTopColor: "#0066FF",
            animation: "spin 0.8s linear infinite",
          }}
        />

        <p
          style={{
            marginTop: "18px",
            color: "#667085",
            fontSize: "15px",
          }}
        >
          Procesando respuesta del pago...
        </p>

        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </main>
  );
}
