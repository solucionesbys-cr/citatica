"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RecuperarPasswordPage() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function recuperarPassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMensaje("");
    setCargando(true);

    const correo = email.trim().toLowerCase();

    if (!correo) {
      setMensaje(
        "Ingresa tu correo electrónico."
      );
      setCargando(false);
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/actualizar-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          correo,
          {
            redirectTo,
          }
        );

      if (error) {
        console.error(
          "Error al recuperar contraseña:",
          error
        );

        setMensaje(
          "No fue posible enviar el correo de recuperación. Inténtalo nuevamente."
        );

        setCargando(false);
        return;
      }

      setEnviado(true);
      setCargando(false);
    } catch (error) {
      console.error(error);

      setMensaje(
        "Ocurrió un error inesperado. Inténtalo nuevamente."
      );

      setCargando(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px 20px",
        fontFamily:
          "var(--font-geist-sans), Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "470px",
          background: "#FFFFFF",
          padding: "42px",
          borderRadius: "24px",
          border: "1px solid #D7E9FF",
          boxShadow:
            "0 18px 50px rgba(4,42,107,0.08)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
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

          {!enviado ? (
            <>
              <h1
                style={{
                  fontSize: "30px",
                  margin: "28px 0 10px",
                  fontWeight: "800",
                  color: "#042A6B",
                }}
              >
                Recuperar contraseña
              </h1>

              <p
                style={{
                  color: "#667085",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                Ingresa el correo asociado a tu
                cuenta y te enviaremos un enlace
                para crear una nueva contraseña.
              </p>
            </>
          ) : (
            <>
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  background: "#ECFDF3",
                  color: "#067647",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  margin: "26px auto 18px",
                }}
              >
                ✓
              </div>

              <h1
                style={{
                  fontSize: "30px",
                  margin: "0 0 10px",
                  fontWeight: "800",
                  color: "#042A6B",
                }}
              >
                Revisa tu correo
              </h1>

              <p
                style={{
                  color: "#667085",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                Si existe una cuenta asociada a{" "}
                <strong>{email}</strong>, recibirás
                un enlace para cambiar tu
                contraseña.
              </p>
            </>
          )}
        </div>

        {!enviado ? (
          <form onSubmit={recuperarPassword}>
            <label style={labelStyle}>
              Correo electrónico
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              disabled={cargando}
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={cargando}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "24px",
                border: "none",
                borderRadius: "12px",
                background: cargando
                  ? "#98A2B3"
                  : "#0066FF",
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: "800",
                cursor: cargando
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {cargando
                ? "Enviando..."
                : "Enviar enlace de recuperación"}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEnviado(false);
              setMensaje("");
            }}
            style={{
              width: "100%",
              padding: "15px",
              border: "1px solid #D7E9FF",
              borderRadius: "12px",
              background: "#FFFFFF",
              color: "#0066FF",
              fontSize: "15px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Enviar nuevamente
          </button>
        )}

        {mensaje && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "12px",
              background: "#FFF1F0",
              border: "1px solid #FECDCA",
              color: "#B42318",
              lineHeight: "1.5",
            }}
          >
            {mensaje}
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "26px",
          }}
        >
          <Link
            href="/login"
            style={{
              color: "#0066FF",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            ← Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "700",
  marginBottom: "8px",
  color: "#344054",
  fontSize: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  border: "1px solid #D0D5DD",
  borderRadius: "11px",
  fontSize: "16px",
  boxSizing: "border-box",
  background: "#FFFFFF",
  color: "#101828",
  outline: "none",
};