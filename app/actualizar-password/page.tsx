"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] =
    useState("");

  const [cargandoPagina, setCargandoPagina] =
    useState(true);

  const [cargando, setCargando] = useState(false);
  const [sesionValida, setSesionValida] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [actualizada, setActualizada] =
    useState(false);

  useEffect(() => {
    let activo = true;

    async function verificarRecuperacion() {
      try {
        /*
         * Algunos enlaces de Supabase llegan con
         * ?code=...
         *
         * Si existe, intercambiamos ese código por
         * una sesión válida.
         */
        const params = new URLSearchParams(
          window.location.search
        );

        const code = params.get("code");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(
              code
            );

          if (error) {
            console.error(
              "Error intercambiando código:",
              error
            );
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!activo) return;

        if (session) {
          setSesionValida(true);
        }

        setCargandoPagina(false);
      } catch (error) {
        console.error(
          "Error verificando recuperación:",
          error
        );

        if (!activo) return;

        setCargandoPagina(false);
      }
    }

    verificarRecuperacion();

    /*
     * También escuchamos PASSWORD_RECOVERY,
     * que Supabase dispara al abrir un enlace
     * válido de recuperación.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "PASSWORD_RECOVERY" ||
          session
        ) {
          setSesionValida(true);
          setCargandoPagina(false);
        }
      }
    );

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function actualizarPassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMensaje("");

    if (password.length < 8) {
      setMensaje(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (password !== confirmarPassword) {
      setMensaje(
        "Las contraseñas no coinciden."
      );
      return;
    }

    setCargando(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        console.error(
          "Error actualizando contraseña:",
          error
        );

        setMensaje(
          "No fue posible actualizar la contraseña. Solicita un nuevo enlace de recuperación."
        );

        setCargando(false);
        return;
      }

      setActualizada(true);
      setCargando(false);

      /*
       * Cerramos la sesión de recuperación para
       * que el usuario vuelva a ingresar normalmente.
       */
      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error) {
      console.error(error);

      setMensaje(
        "Ocurrió un error inesperado al cambiar la contraseña."
      );

      setCargando(false);
    }
  }

  if (cargandoPagina) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F6F9FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "var(--font-geist-sans), Arial, sans-serif",
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
            width={70}
            height={70}
          />

          <p
            style={{
              color: "#667085",
              marginTop: "18px",
            }}
          >
            Verificando enlace...
          </p>
        </div>
      </main>
    );
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

          {actualizada ? (
            <>
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  background: "#ECFDF3",
                  color: "#067647",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "30px",
                  margin: "26px auto 18px",
                }}
              >
                ✓
              </div>

              <h1
                style={{
                  fontSize: "30px",
                  color: "#042A6B",
                  margin: "0 0 10px",
                }}
              >
                Contraseña actualizada
              </h1>

              <p
                style={{
                  color: "#667085",
                  lineHeight: "1.6",
                }}
              >
                Tu contraseña se cambió
                correctamente. Te llevaremos al
                inicio de sesión.
              </p>
            </>
          ) : (
            <>
              <h1
                style={{
                  fontSize: "30px",
                  margin: "28px 0 10px",
                  fontWeight: "800",
                  color: "#042A6B",
                }}
              >
                Crear nueva contraseña
              </h1>

              <p
                style={{
                  color: "#667085",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                Elige una nueva contraseña para tu
                cuenta de CitaTica.
              </p>
            </>
          )}
        </div>

        {!actualizada && !sesionValida && (
          <>
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#FFF8E8",
                border: "1px solid #F5D785",
                color: "#7A5700",
                lineHeight: "1.6",
              }}
            >
              Este enlace de recuperación no es
              válido o ya venció.
            </div>

            <Link
              href="/recuperar-password"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "20px",
                padding: "15px",
                borderRadius: "12px",
                background: "#0066FF",
                color: "#FFFFFF",
                fontWeight: "800",
                textDecoration: "none",
              }}
            >
              Solicitar un nuevo enlace
            </Link>
          </>
        )}

        {!actualizada && sesionValida && (
          <form onSubmit={actualizarPassword}>
            <label style={labelStyle}>
              Nueva contraseña
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              disabled={cargando}
              style={inputStyle}
            />

            <label style={labelStyle}>
              Confirmar nueva contraseña
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={confirmarPassword}
              onChange={(e) =>
                setConfirmarPassword(e.target.value)
              }
              placeholder="Repita la contraseña"
              autoComplete="new-password"
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
                ? "Actualizando..."
                : "Cambiar contraseña"}
            </button>
          </form>
        )}

        {mensaje && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              background: "#FFF1F0",
              border: "1px solid #FECDCA",
              borderRadius: "12px",
              color: "#B42318",
              lineHeight: "1.5",
            }}
          >
            {mensaje}
          </div>
        )}
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