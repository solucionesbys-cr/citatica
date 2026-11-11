"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [actualizando, setActualizando] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
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
    setUltimaActualizacion(new Date());
  }

  async function actualizarPanel() {
    setActualizando(true);
    setError("");

    try {
      await cargarResumen();
    } finally {
      setActualizando(false);
    }
  }

  async function cerrarSesion() {
    const confirmar = window.confirm(
      "¿Desea cerrar la sesión administrativa?"
    );

    if (!confirmar) return;

    setCerrandoSesion(true);
    setError("");

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError("No se pudo cerrar la sesión. Intente nuevamente.");
      setCerrandoSesion(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  const salud = useMemo(() => {
    if (resumen.pagosFallidos > 0) {
      return {
        etiqueta: "REQUIERE ATENCIÓN",
        titulo: "Hay movimientos que conviene revisar",
        descripcion: `${resumen.pagosFallidos} ${
          resumen.pagosFallidos === 1 ? "pago fallido" : "pagos fallidos"
        } registrado${resumen.pagosFallidos === 1 ? "" : "s"}.`,
        tipo: "alerta" as const,
      };
    }

    return {
      etiqueta: "OPERACIÓN NORMAL",
      titulo: "La plataforma no reporta alertas críticas",
      descripcion:
        "Los indicadores principales se encuentran disponibles para revisión.",
      tipo: "normal" as const,
    };
  }, [resumen.pagosFallidos]);

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <div style={cargaContenidoStyle}>
          <div style={logoCargaStyle}>C</div>
          <p style={{ margin: 0 }}>Cargando CitaTica Admin...</p>
        </div>
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
              Control general de negocios, suscripciones, pagos y usuarios de la plataforma.
            </p>

            {ultimaActualizacion && (
              <p style={actualizacionTextoStyle}>
                Última actualización:{" "}
                {ultimaActualizacion.toLocaleTimeString("es-CR", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            )}
          </div>

          <div style={accionesHeaderStyle}>
            <div style={badgeStyle}>SUPERADMIN</div>

            <button
              type="button"
              onClick={actualizarPanel}
              disabled={actualizando}
              style={{
                ...botonActualizarStyle,
                opacity: actualizando ? 0.65 : 1,
                cursor: actualizando ? "not-allowed" : "pointer",
              }}
            >
              {actualizando ? "Actualizando..." : "↻ Actualizar"}
            </button>

            <button
              type="button"
              onClick={cerrarSesion}
              disabled={cerrandoSesion}
              style={{
                ...botonCerrarSesionStyle,
                opacity: cerrandoSesion ? 0.65 : 1,
                cursor: cerrandoSesion ? "not-allowed" : "pointer",
              }}
            >
              {cerrandoSesion ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </header>

        {error ? (
          <div style={errorStyle}>
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <section style={bienvenidaPanelStyle}>
          <div style={bienvenidaContenidoStyle}>
            <div>
              <p style={seccionEtiquetaStyle}>CENTRO DE CONTROL</p>
              <h2 style={bienvenidaTituloStyle}>
                Resumen general de CitaTica
              </h2>
              <p style={bienvenidaTextoStyle}>
                Consulte los principales indicadores y acceda a los módulos administrativos.
              </p>
            </div>

            <div
              style={{
                ...saludBadgeStyle,
                ...(salud.tipo === "alerta"
                  ? saludBadgeAlertaStyle
                  : saludBadgeNormalStyle),
              }}
            >
              {salud.etiqueta}
            </div>
          </div>
        </section>

        <section style={gridStyle}>
          <Tarjeta
            titulo="Negocios"
            valor={String(resumen.negocios)}
            descripcion="Administrar negocios"
            detalle="Empresas registradas"
            onClick={() => router.push("/admin/negocios")}
          />

          <Tarjeta
            titulo="Suscripciones"
            valor={String(resumen.suscripciones)}
            descripcion="Ver planes y estados"
            detalle={`${resumen.activas} activas · ${resumen.trials} en prueba`}
            onClick={() =>
              router.push("/admin/suscripciones")
            }
          />

          <Tarjeta
            titulo="Pagos"
            valor={String(resumen.pagos)}
            descripcion="Ver historial de pagos"
            detalle={`${resumen.pagosPagados} completados · ${resumen.pagosFallidos} fallidos`}
            onClick={() => router.push("/admin/pagos")}
          />

          <Tarjeta
            titulo="Usuarios"
            valor={String(resumen.usuarios)}
            descripcion="Ver usuarios registrados"
            detalle="Cuentas de la plataforma"
            onClick={() => router.push("/admin/usuarios")}
          />
        </section>

        <section
          style={{
            ...panelStyle,
            border:
              salud.tipo === "alerta"
                ? "1px solid #fecdca"
                : "1px solid #d1fadf",
          }}
        >
          <div style={panelEncabezadoConAccionStyle}>
            <div>
              <p
                style={{
                  ...seccionEtiquetaStyle,
                  color:
                    salud.tipo === "alerta"
                      ? "#b42318"
                      : "#067647",
                }}
              >
                {salud.etiqueta}
              </p>

              <h2 style={subtituloStyle}>
                {salud.titulo}
              </h2>

              <p style={textoSinMargenStyle}>
                {salud.descripcion}
              </p>
            </div>

            {salud.tipo === "alerta" && (
              <button
                type="button"
                onClick={() => router.push("/admin/pagos")}
                style={botonRevisarStyle}
              >
                Revisar pagos →
              </button>
            )}
          </div>
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
                Indicadores administrativos obtenidos directamente desde el servidor.
              </p>
            </div>
          </div>

          <div style={estadoGridStyle}>
            <Estado
              titulo="Negocios en prueba"
              valor={String(resumen.trials)}
              descripcion="Períodos trial"
              tipo="azul"
            />

            <Estado
              titulo="Suscripciones activas"
              valor={String(resumen.activas)}
              descripcion="Planes vigentes"
              tipo="verde"
            />

            <Estado
              titulo="Pagos completados"
              valor={String(resumen.pagosPagados)}
              descripcion="Transacciones exitosas"
              tipo="verde"
            />

            <Estado
              titulo="Pagos fallidos"
              valor={String(resumen.pagosFallidos)}
              descripcion="Requieren revisión"
              tipo="rojo"
            />
          </div>
        </section>

        <section style={panelStyle}>
          <p style={seccionEtiquetaStyle}>
            ADMINISTRACIÓN
          </p>

          <h2 style={subtituloStyle}>
            Módulos principales
          </h2>

          <p style={textoStyle}>
            Acceda a las áreas de gestión de la plataforma.
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

        <footer style={footerStyle}>
          <div>
            <strong style={footerMarcaStyle}>CitaTica Admin</strong>
            <span style={footerTextoStyle}>
              Administración interna de la plataforma
            </span>
          </div>

          <button
            type="button"
            onClick={actualizarPanel}
            disabled={actualizando}
            style={footerBotonStyle}
          >
            Actualizar datos
          </button>
        </footer>
      </div>
    </main>
  );
}

function Tarjeta({
  titulo,
  valor,
  descripcion,
  detalle,
  onClick,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  detalle: string;
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

      <span style={tarjetaDetalleStyle}>
        {detalle}
      </span>

      <span style={tarjetaDescripcionStyle}>
        {descripcion} →
      </span>
    </button>
  );
}

function Estado({
  titulo,
  valor,
  descripcion,
  tipo,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
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

      <span style={estadoDescripcionStyle}>
        {descripcion}
      </span>
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

      <span style={{ minWidth: 0 }}>
        <strong style={accesoTituloStyle}>
          {titulo}
        </strong>

        <span style={accesoDescripcionStyle}>
          {descripcion}
        </span>
      </span>

      <span style={accesoFlechaStyle}>→</span>
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

const cargaContenidoStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "14px",
};

const logoCargaStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "#0066ff",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "21px",
};

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "35px clamp(12px, 4vw, 20px) 45px",
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
  gap: "24px",
  flexWrap: "wrap",
  marginBottom: "26px",
};

const accionesHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

const marcaStyle: React.CSSProperties = {
  margin: 0,
  color: "#0066ff",
  fontWeight: "800",
  fontSize: "14px",
};

const tituloStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#101828",
  fontSize: "clamp(30px, 5vw, 38px)",
  letterSpacing: "-0.8px",
};

const descripcionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  fontSize: "15px",
  lineHeight: 1.5,
  maxWidth: "680px",
};

const actualizacionTextoStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#98a2b3",
  fontSize: "12px",
};

const badgeStyle: React.CSSProperties = {
  background: "#eef4ff",
  color: "#004eeb",
  border: "1px solid #c7d7fe",
  padding: "9px 13px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "800",
  whiteSpace: "nowrap",
};

const botonActualizarStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const botonCerrarSesionStyle: React.CSSProperties = {
  border: "1px solid #fecdca",
  background: "#ffffff",
  color: "#b42318",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const errorStyle: React.CSSProperties = {
  marginBottom: "20px",
  padding: "14px 16px",
  borderRadius: "11px",
  border: "1px solid #fecdca",
  background: "#fef3f2",
  color: "#b42318",
};

const bienvenidaPanelStyle: React.CSSProperties = {
  background:
    "linear-gradient(135deg, #eef5ff 0%, #ffffff 55%, #f1fffa 100%)",
  border: "1px solid #d7e5ff",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "22px",
  boxShadow: "0 8px 26px rgba(16,24,40,0.04)",
};

const bienvenidaContenidoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
};

const bienvenidaTituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "22px",
};

const bienvenidaTextoStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  lineHeight: 1.5,
  fontSize: "14px",
};

const saludBadgeStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "9px 13px",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
};

const saludBadgeNormalStyle: React.CSSProperties = {
  background: "#ecfdf3",
  color: "#067647",
  border: "1px solid #abefc6",
};

const saludBadgeAlertaStyle: React.CSSProperties = {
  background: "#fef3f2",
  color: "#b42318",
  border: "1px solid #fecdca",
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
  border: "1px solid #eaecf0",
  background: "#ffffff",
  borderRadius: "16px",
  padding: "22px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
  width: "100%",
  cursor: "pointer",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

const tarjetaTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "14px",
  fontWeight: "600",
};

const tarjetaValorStyle: React.CSSProperties = {
  display: "block",
  marginTop: "10px",
  fontSize: "32px",
  color: "#101828",
};

const tarjetaDetalleStyle: React.CSSProperties = {
  display: "block",
  marginTop: "5px",
  color: "#98a2b3",
  fontSize: "12px",
  minHeight: "16px",
};

const tarjetaDescripcionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "12px",
  color: "#0066ff",
  fontSize: "12px",
  fontWeight: "700",
};

const panelStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
  marginBottom: "24px",
  border: "1px solid #eaecf0",
};

const panelEncabezadoStyle: React.CSSProperties = {
  marginBottom: "18px",
};

const panelEncabezadoConAccionStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
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

const textoSinMargenStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  lineHeight: 1.5,
  fontSize: "14px",
};

const botonRevisarStyle: React.CSSProperties = {
  border: "none",
  background: "#b42318",
  color: "#ffffff",
  padding: "10px 14px",
  borderRadius: "9px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap",
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
  minHeight: "95px",
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

const estadoDescripcionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "5px",
  fontSize: "11px",
  opacity: 0.78,
};

const accesosGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "12px",
};

const accesoStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "flex-start",
  gap: "13px",
  textAlign: "left",
  border: "1px solid #dbe6ff",
  background: "#f8fbff",
  borderRadius: "13px",
  padding: "16px",
  cursor: "pointer",
  minWidth: 0,
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

const accesoFlechaStyle: React.CSSProperties = {
  color: "#0066ff",
  fontWeight: "800",
  fontSize: "17px",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap",
  padding: "4px 2px 0",
  color: "#98a2b3",
};

const footerMarcaStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "13px",
  marginRight: "10px",
};

const footerTextoStyle: React.CSSProperties = {
  fontSize: "12px",
};

const footerBotonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#0066ff",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "12px",
};
