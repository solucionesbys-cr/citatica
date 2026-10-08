"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type ResumenAdmin = {
  negocios: number;
  suscripciones: number;
  pagos: number;
  usuarios: number;
  trials: number;
  activas: number;
  pagosPagados: number;
  pagosFallidos: number;
};

const resumenInicial: ResumenAdmin = {
  negocios: 0,
  suscripciones: 0,
  pagos: 0,
  usuarios: 0,
  trials: 0,
  activas: 0,
  pagosPagados: 0,
  pagosFallidos: 0,
};

export default function AdminPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");
  const [resumen, setResumen] =
    useState<ResumenAdmin>(resumenInicial);

  useEffect(() => {
    verificarAccesoYCargar();
  }, []);

  async function verificarAccesoYCargar() {
    setCargando(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !admin) {
      router.replace("/panel");
      return;
    }

    setAutorizado(true);

    await cargarResumen();

    setCargando(false);
  }

  async function cargarResumen() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setError("No encontramos una sesión válida.");
      return;
    }

    const respuesta = await fetch("/api/admin/resumen", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setError(
        resultado?.error ||
          "No se pudo cargar el resumen administrativo."
      );
      return;
    }

    setResumen(
      (resultado.resumen || resumenInicial) as ResumenAdmin
    );
  }

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <p>Cargando CitaTica Admin...</p>
      </main>
    );
  }

  if (!autorizado) {
    return null;
  }

  return (
    <main style={mainStyle}>
      <div style={contenedorStyle}>
        <header style={encabezadoStyle}>
          <div>
            <p style={marcaStyle}>CitaTica</p>

            <h1 style={tituloStyle}>
              Panel de administración
            </h1>

            <p style={descripcionStyle}>
              Administración general de la plataforma.
            </p>
          </div>

          <div style={badgeStyle}>SUPERADMIN</div>
        </header>

        {error ? (
          <div style={errorStyle}>{error}</div>
        ) : null}

        <section style={gridStyle}>
          <Tarjeta
            titulo="Negocios"
            valor={String(resumen.negocios)}
            descripcion="Administrar negocios"
            onClick={() => router.push("/admin/negocios")}
          />

          <Tarjeta
            titulo="Suscripciones"
            valor={String(resumen.suscripciones)}
            descripcion="Ver planes y estados"
            onClick={() =>
              router.push("/admin/suscripciones")
            }
          />

          <Tarjeta
            titulo="Pagos"
            valor={String(resumen.pagos)}
            descripcion="Ver historial de pagos"
            onClick={() => router.push("/admin/pagos")}
          />

          <Tarjeta
            titulo="Usuarios"
            valor={String(resumen.usuarios)}
            descripcion="Ver usuarios registrados"
            onClick={() => router.push("/admin/usuarios")}
          />
        </section>

        <section style={panelStyle}>
          <div style={panelEncabezadoStyle}>
            <div>
              <p style={seccionEtiquetaStyle}>
                RESUMEN OPERATIVO
              </p>

              <h2 style={subtituloStyle}>
                Estado actual de CitaTica
              </h2>

              <p style={textoStyle}>
                Datos administrativos obtenidos directamente desde el servidor.
              </p>
            </div>
          </div>

          <div style={estadoGridStyle}>
            <Estado
              titulo="Negocios en prueba"
              valor={String(resumen.trials)}
              tipo="azul"
            />

            <Estado
              titulo="Suscripciones activas"
              valor={String(resumen.activas)}
              tipo="verde"
            />

            <Estado
              titulo="Pagos completados"
              valor={String(resumen.pagosPagados)}
              tipo="verde"
            />

            <Estado
              titulo="Pagos fallidos"
              valor={String(resumen.pagosFallidos)}
              tipo="rojo"
            />
          </div>
        </section>

        <section style={panelStyle}>
          <p style={seccionEtiquetaStyle}>
            ACCESOS RÁPIDOS
          </p>

          <h2 style={subtituloStyle}>
            Administración de CitaTica
          </h2>

          <p style={textoStyle}>
            Gestione los módulos principales de la plataforma.
          </p>

          <div style={accesosGridStyle}>
            <Acceso
              icono="🏢"
              titulo="Negocios"
              descripcion="Publicación, planes, estado y detalle."
              onClick={() => router.push("/admin/negocios")}
            />

            <Acceso
              icono="📋"
              titulo="Suscripciones"
              descripcion="Planes, pruebas, estados y vencimientos."
              onClick={() =>
                router.push("/admin/suscripciones")
              }
            />

            <Acceso
              icono="💳"
              titulo="Pagos"
              descripcion="Pagos, pendientes y transacciones fallidas."
              onClick={() => router.push("/admin/pagos")}
            />

            <Acceso
              icono="👥"
              titulo="Usuarios"
              descripcion="Cuentas, negocios asociados y accesos."
              onClick={() => router.push("/admin/usuarios")}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Tarjeta({
  titulo,
  valor,
  descripcion,
  onClick,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={tarjetaStyle}
    >
      <span style={tarjetaTituloStyle}>
        {titulo}
      </span>

      <strong style={tarjetaValorStyle}>
        {valor}
      </strong>

      <span style={tarjetaDescripcionStyle}>
        {descripcion} →
      </span>
    </button>
  );
}

function Estado({
  titulo,
  valor,
  tipo,
}: {
  titulo: string;
  valor: string;
  tipo: "azul" | "verde" | "rojo";
}) {
  const estilos = {
    azul: {
      background: "#eff8ff",
      color: "#175cd3",
    },
    verde: {
      background: "#ecfdf3",
      color: "#067647",
    },
    rojo: {
      background: "#fef3f2",
      color: "#b42318",
    },
  }[tipo];

  return (
    <div
      style={{
        ...estadoStyle,
        background: estilos.background,
        color: estilos.color,
      }}
    >
      <span style={estadoTituloStyle}>
        {titulo}
      </span>

      <strong style={estadoValorStyle}>
        {valor}
      </strong>
    </div>
  );
}

function Acceso({
  icono,
  titulo,
  descripcion,
  onClick,
}: {
  icono: string;
  titulo: string;
  descripcion: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={accesoStyle}
    >
      <span style={accesoIconoStyle}>
        {icono}
      </span>

      <span>
        <strong style={accesoTituloStyle}>
          {titulo}
        </strong>

        <span style={accesoDescripcionStyle}>
          {descripcion}
        </span>
      </span>
    </button>
  );
}

const pantallaCargaStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  color: "#667085",
};

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "35px clamp(12px, 4vw, 20px) 70px",
  fontFamily: "Arial, sans-serif",
};

const contenedorStyle: React.CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto",
};

const encabezadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "30px",
};

const marcaStyle: React.CSSProperties = {
  margin: 0,
  color: "#0066ff",
  fontWeight: "700",
  fontSize: "14px",
};

const tituloStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#101828",
  fontSize: "34px",
};

const descripcionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  fontSize: "15px",
};

const badgeStyle: React.CSSProperties = {
  background: "#eef4ff",
  color: "#004eeb",
  border: "1px solid #c7d7fe",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "800",
};

const errorStyle: React.CSSProperties = {
  marginBottom: "20px",
  padding: "14px",
  borderRadius: "10px",
  background: "#fef3f2",
  color: "#b42318",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const tarjetaStyle: React.CSSProperties = {
  textAlign: "left",
  border: "none",
  background: "#ffffff",
  borderRadius: "16px",
  padding: "22px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  width: "100%",
  cursor: "pointer",
};

const tarjetaTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "14px",
};

const tarjetaValorStyle: React.CSSProperties = {
  display: "block",
  marginTop: "10px",
  fontSize: "30px",
  color: "#101828",
};

const tarjetaDescripcionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "10px",
  color: "#0066ff",
  fontSize: "12px",
  fontWeight: "700",
};

const panelStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  marginBottom: "24px",
};

const panelEncabezadoStyle: React.CSSProperties = {
  marginBottom: "18px",
};

const seccionEtiquetaStyle: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#0066ff",
  fontWeight: "800",
  fontSize: "11px",
  letterSpacing: "0.8px",
};

const subtituloStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  color: "#101828",
};

const textoStyle: React.CSSProperties = {
  margin: "8px 0 18px",
  color: "#667085",
  lineHeight: 1.6,
};

const estadoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
  gap: "12px",
};

const estadoStyle: React.CSSProperties = {
  borderRadius: "13px",
  padding: "16px",
};

const estadoTituloStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: "700",
};

const estadoValorStyle: React.CSSProperties = {
  display: "block",
  marginTop: "7px",
  fontSize: "25px",
};

const accesosGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "12px",
};

const accesoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "13px",
  textAlign: "left",
  border: "1px solid #dbe6ff",
  background: "#f8fbff",
  borderRadius: "13px",
  padding: "16px",
  cursor: "pointer",
};

const accesoIconoStyle: React.CSSProperties = {
  fontSize: "21px",
  lineHeight: 1,
};

const accesoTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#101828",
  fontSize: "14px",
};

const accesoDescripcionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "5px",
  color: "#667085",
  fontSize: "12px",
  lineHeight: 1.45,
};
