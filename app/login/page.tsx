"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);


  async function iniciarConGoogle() {
    setMensaje("");
    setCargandoGoogle(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        console.error("Error al iniciar con Google:", error);

        setMensaje(
          "No pudimos iniciar sesión con Google. Inténtalo nuevamente."
        );

        setCargandoGoogle(false);
      }
    } catch (error) {
      console.error("Error inesperado con Google:", error);

      setMensaje(
        "Ocurrió un error inesperado al iniciar sesión con Google."
      );

      setCargandoGoogle(false);
    }
  }

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();

    setMensaje("");
    setCargando(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        let texto =
          "No pudimos iniciar sesión. Revisa tu correo y contraseña.";

        if (
          error.message
            .toLowerCase()
            .includes("email not confirmed")
        ) {
          texto =
            "Debes confirmar tu correo electrónico antes de iniciar sesión.";
        }

        setMensaje(texto);
        setCargando(false);
        return;
      }

      if (!data.user || !data.session) {
        setMensaje(
          "No fue posible establecer la sesión."
        );
        setCargando(false);
        return;
      }

      router.replace("/panel");
      router.refresh();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      setMensaje(
        "Ocurrió un error inesperado al iniciar sesión."
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

          <h1
            style={{
              fontSize: "30px",
              margin: "28px 0 8px",
              fontWeight: "800",
              color: "#042A6B",
            }}
          >
            Bienvenido de nuevo
          </h1>

          <p
            style={{
              color: "#667085",
              fontSize: "16px",
              margin: 0,
            }}
          >
            Ingresa a tu cuenta de CitaTica.
          </p>
        </div>


        <button
          type="button"
          onClick={iniciarConGoogle}
          disabled={cargando || cargandoGoogle}
          style={{
            width: "100%",
            minHeight: "52px",
            padding: "13px 16px",
            border: "1px solid #D0D5DD",
            borderRadius: "12px",
            background:
              cargando || cargandoGoogle
                ? "#F2F4F7"
                : "#FFFFFF",
            color: "#344054",
            fontSize: "15px",
            fontWeight: "700",
            cursor:
              cargando || cargandoGoogle
                ? "not-allowed"
                : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "1px solid #EAECF0",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
              color: "#4285F4",
              fontSize: "16px",
              fontWeight: "800",
              fontFamily: "Arial, sans-serif",
              flexShrink: 0,
            }}
          >
            G
          </span>

          {cargandoGoogle
            ? "Conectando con Google..."
            : "Continuar con Google"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            margin: "24px 0 4px",
          }}
        >
          <div
            style={{
              height: "1px",
              background: "#EAECF0",
              flex: 1,
            }}
          />

          <span
            style={{
              color: "#98A2B3",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            o continúa con correo
          </span>

          <div
            style={{
              height: "1px",
              background: "#EAECF0",
              flex: 1,
            }}
          />
        </div>

        <form onSubmit={iniciarSesion}>
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
            disabled={cargando || cargandoGoogle}
            style={inputStyle}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "20px",
              marginBottom: "8px",
              gap: "12px",
            }}
          >
            <label
              style={{
                fontWeight: "700",
                color: "#344054",
                fontSize: "14px",
              }}
            >
              Contraseña
            </label>

            <Link
              href="/recuperar-password"
              style={{
                color: "#0066FF",
                fontWeight: "700",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <input
            type="password"
            required
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            disabled={cargando || cargandoGoogle}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={cargando || cargandoGoogle}
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
              boxShadow: cargando
                ? "none"
                : "0 10px 24px rgba(0,102,255,0.20)",
            }}
          >
            {cargando
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>
        </form>

        {mensaje && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px 16px",
              background: "#FFF1F0",
              border: "1px solid #FECDCA",
              borderRadius: "12px",
              lineHeight: "1.5",
              color: "#B42318",
            }}
          >
            {mensaje}
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: "28px",
            marginBottom: 0,
            color: "#667085",
          }}
        >
          ¿No tienes una cuenta?{" "}
          <Link
            href="/registro"
            style={{
              color: "#0066FF",
              fontWeight: "800",
              textDecoration: "none",
            }}
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "700",
  marginBottom: "8px",
  marginTop: "20px",
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