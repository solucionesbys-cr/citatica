"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RegistroPage() {
  const supabase = useMemo(() => createClient(), []);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [aceptaLegal, setAceptaLegal] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"error" | "success" | "">("");
  const [cargando, setCargando] = useState(false);

  async function registrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensaje("");
    setTipoMensaje("");

    if (!nombre.trim()) {
      setMensaje("Ingrese su nombre.");
      setTipoMensaje("error");
      return;
    }

    if (!email.trim()) {
      setMensaje("Ingrese su correo electrónico.");
      setTipoMensaje("error");
      return;
    }

    if (password.length < 8) {
      setMensaje("La contraseña debe tener al menos 8 caracteres.");
      setTipoMensaje("error");
      return;
    }

    if (password !== confirmarPassword) {
      setMensaje("Las contraseñas no coinciden.");
      setTipoMensaje("error");
      return;
    }

    if (!aceptaLegal) {
      setMensaje(
        "Debe aceptar los Términos y Condiciones, la Política de Privacidad y conocer la Política de Cancelaciones y Devoluciones."
      );
      setTipoMensaje("error");
      return;
    }

    setCargando(true);

    try {
      const fechaAceptacion = new Date().toISOString();

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            legal_accepted: true,
            legal_accepted_at: fechaAceptacion,
            terms_version: "2026-09-28",
            privacy_version: "2026-09-28",
            cancellations_version: "2026-09-28",
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        console.error("Error creando cuenta:", error);
        let texto = "No pudimos crear la cuenta.";
        const mensajeError = error.message.toLowerCase();

        if (mensajeError.includes("user already registered")) {
          texto = "Ya existe una cuenta registrada con este correo electrónico.";
        } else if (mensajeError.includes("password")) {
          texto = "La contraseña no cumple los requisitos de seguridad.";
        } else {
          texto = "No pudimos crear la cuenta: " + error.message;
        }

        setMensaje(texto);
        setTipoMensaje("error");
        setCargando(false);
        return;
      }

      setMensaje("¡Cuenta creada! Revise su correo electrónico para confirmar su cuenta.");
      setTipoMensaje("success");
      setNombre("");
      setEmail("");
      setPassword("");
      setConfirmarPassword("");
      setAceptaLegal(false);
      setCargando(false);
    } catch (error) {
      console.error("Error inesperado registrando usuario:", error);
      setMensaje("Ocurrió un error inesperado al crear la cuenta. Inténtelo nuevamente.");
      setTipoMensaje("error");
      setCargando(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "var(--font-geist-sans), Arial, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "500px" }}>
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <Link href="/">
            <Image
              src="/brand/citatica-logo.png"
              alt="CitaTica"
              width={210}
              height={70}
              priority
              style={{ width: "180px", height: "auto" }}
            />
          </Link>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "clamp(26px, 5vw, 42px)",
            border: "1px solid #D7E9FF",
            boxShadow: "0 18px 50px rgba(4,42,107,0.08)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1
              style={{
                fontSize: "32px",
                margin: "0 0 10px",
                color: "#042A6B",
                fontWeight: "800",
              }}
            >
              Crea tu cuenta
            </h1>
            <p style={{ color: "#667085", margin: 0, fontSize: "16px", lineHeight: "1.6" }}>
              Empieza a organizar tu negocio con CitaTica.
            </p>
          </div>

          <form onSubmit={registrar}>
            <label style={labelStyle}>Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Bryan Bermúdez"
              required
              disabled={cargando}
              autoComplete="name"
              style={inputStyle}
            />

            <label style={labelStyle}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              disabled={cargando}
              autoComplete="email"
              style={inputStyle}
            />

            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              disabled={cargando}
              autoComplete="new-password"
              style={inputStyle}
            />

            <label style={labelStyle}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repita su contraseña"
              required
              minLength={8}
              disabled={cargando}
              autoComplete="new-password"
              style={inputStyle}
            />

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginTop: "24px",
                padding: "16px",
                background: "#F8FAFC",
                border: "1px solid #E4E7EC",
                borderRadius: "12px",
              }}
            >
              <input
                id="aceptaLegal"
                type="checkbox"
                checked={aceptaLegal}
                onChange={(e) => setAceptaLegal(e.target.checked)}
                disabled={cargando}
                required
                style={{
                  width: "18px",
                  height: "18px",
                  marginTop: "2px",
                  flexShrink: 0,
                  accentColor: "#0066FF",
                  cursor: "pointer",
                }}
              />

              <label
                htmlFor="aceptaLegal"
                style={{
                  color: "#475467",
                  fontSize: "13px",
                  lineHeight: "1.65",
                  cursor: "pointer",
                }}
              >
                He leído y acepto los{" "}
                <Link href="/terminos" target="_blank" style={legalLinkStyle}>
                  Términos y Condiciones
                </Link>
                , la{" "}
                <Link href="/privacidad" target="_blank" style={legalLinkStyle}>
                  Política de Privacidad
                </Link>{" "}
                y declaro conocer la{" "}
                <Link
                  href="/cancelaciones-y-devoluciones"
                  target="_blank"
                  style={legalLinkStyle}
                >
                  Política de Cancelaciones y Devoluciones
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={cargando}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "24px",
                border: "none",
                borderRadius: "12px",
                background: cargando ? "#98A2B3" : "#0066FF",
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: "800",
                cursor: cargando ? "not-allowed" : "pointer",
                boxShadow: cargando ? "none" : "0 10px 24px rgba(0,102,255,0.20)",
              }}
            >
              {cargando ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          {mensaje && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                borderRadius: "12px",
                lineHeight: "1.5",
                fontSize: "14px",
                background: tipoMensaje === "success" ? "#ECFDF3" : "#FFF1F0",
                color: tipoMensaje === "success" ? "#067647" : "#B42318",
                border:
                  tipoMensaje === "success"
                    ? "1px solid #ABEFC6"
                    : "1px solid #FECDCA",
              }}
            >
              {mensaje}
            </div>
          )}

          <p
            style={{
              textAlign: "center",
              marginTop: "26px",
              marginBottom: 0,
              color: "#667085",
              fontSize: "14px",
            }}
          >
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              style={{ color: "#0066FF", fontWeight: "800", textDecoration: "none" }}
            >
              Iniciar sesión
            </Link>
          </p>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "#98A2B3",
            fontSize: "12px",
            lineHeight: "1.6",
            marginTop: "20px",
          }}
        >
          CitaTica · Costa Rica
        </p>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  marginTop: "18px",
  fontWeight: "700",
  fontSize: "14px",
  color: "#344054",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 15px",
  border: "1px solid #D0D5DD",
  borderRadius: "11px",
  fontSize: "15px",
  outline: "none",
  background: "#FFFFFF",
  color: "#101828",
};

const legalLinkStyle: React.CSSProperties = {
  color: "#0066FF",
  fontWeight: "700",
  textDecoration: "none",
};
