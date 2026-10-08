"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type SuscripcionFila = {
  business_id: string;
  business_name: string;
  slug: string;
  business_created_at: string | null;
  plan_code: string | null;
  plan_name: string | null;
  status: string | null;
  billing_cycle: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  updated_at: string | null;
};

type Resumen = {
  negocios: number;
  conSuscripcion: number;
  sinSuscripcion: number;
  trial: number;
  active: number;
  suspended: number;
  cancelled: number;
};

const resumenInicial: Resumen = {
  negocios: 0,
  conSuscripcion: 0,
  sinSuscripcion: 0,
  trial: 0,
  active: 0,
  suspended: 0,
  cancelled: 0,
};

export default function AdminSuscripcionesPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");
  const [suscripciones, setSuscripciones] =
    useState<SuscripcionFila[]>([]);
  const [resumen, setResumen] =
    useState<Resumen>(resumenInicial);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

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

    await cargarSuscripciones();

    setCargando(false);
  }

  async function cargarSuscripciones() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setError("No encontramos una sesión válida.");
      return;
    }

    const respuesta = await fetch(
      "/api/admin/suscripciones",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setError(
        resultado?.error ||
          "No se pudieron cargar las suscripciones."
      );
      return;
    }

    setSuscripciones(
      (resultado.suscripciones || []) as SuscripcionFila[]
    );

    setResumen(
      (resultado.resumen || resumenInicial) as Resumen
    );
  }

  const filasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return suscripciones.filter((item) => {
      const estadoReal = item.status || "SIN_SUSCRIPCION";

      const coincideEstado =
        filtroEstado === "TODOS" ||
        estadoReal === filtroEstado;

      const coincideBusqueda =
        !termino ||
        item.business_name.toLowerCase().includes(termino) ||
        item.slug.toLowerCase().includes(termino) ||
        (item.plan_code || "").toLowerCase().includes(termino) ||
        (item.plan_name || "").toLowerCase().includes(termino);

      return coincideEstado && coincideBusqueda;
    });
  }, [suscripciones, busqueda, filtroEstado]);

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <p>Cargando suscripciones...</p>
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
            <button
              type="button"
              onClick={() => router.push("/admin")}
              style={volverStyle}
            >
              ← Volver al panel
            </button>

            <p style={marcaStyle}>CitaTica Admin</p>

            <h1 style={tituloStyle}>Suscripciones</h1>

            <p style={descripcionStyle}>
              Estado de planes y suscripciones de los negocios.
            </p>
          </div>

          <div style={badgeStyle}>SUPERADMIN</div>
        </header>

        <section style={resumenGridStyle}>
          <Resumen
            titulo="Negocios"
            valor={String(resumen.negocios)}
          />

          <Resumen
            titulo="Con suscripción"
            valor={String(resumen.conSuscripcion)}
          />

          <Resumen
            titulo="Sin suscripción"
            valor={String(resumen.sinSuscripcion)}
          />

          <Resumen
            titulo="En prueba"
            valor={String(resumen.trial)}
          />

          <Resumen
            titulo="Activas"
            valor={String(resumen.active)}
          />
        </section>

        <section style={panelStyle}>
          <div style={panelEncabezadoStyle}>
            <div>
              <h2 style={subtituloStyle}>
                Suscripciones por negocio
              </h2>

              <p style={textoSecundarioStyle}>
                Seleccione un negocio para cambiar su plan,
                estado o ciclo de facturación.
              </p>
            </div>

            <div style={filtrosStyle}>
              <input
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Buscar negocio..."
                style={buscadorStyle}
              />

              <select
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(event.target.value)
                }
                style={selectStyle}
              >
                <option value="TODOS">Todos</option>
                <option value="TRIAL">En prueba</option>
                <option value="ACTIVE">Activas</option>
                <option value="SUSPENDED">
                  Suspendidas
                </option>
                <option value="CANCELLED">
                  Canceladas
                </option>
                <option value="SIN_SUSCRIPCION">
                  Sin suscripción
                </option>
              </select>
            </div>
          </div>

          {error ? (
            <div style={errorStyle}>{error}</div>
          ) : filasFiltradas.length === 0 ? (
            <div style={vacioStyle}>
              No hay negocios que coincidan con los filtros.
            </div>
          ) : (
            <div style={tablaScrollStyle}>
              <table style={tablaStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Negocio</th>
                    <th style={thStyle}>Plan</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Ciclo</th>
                    <th style={thStyle}>Vencimiento</th>
                    <th style={thStyle}>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {filasFiltradas.map((item) => (
                    <tr key={item.business_id}>
                      <td style={tdStyle}>
                        <strong style={negocioStyle}>
                          {item.business_name}
                        </strong>

                        <span style={detalleStyle}>
                          /reservar/{item.slug}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <span style={planBadgeStyle}>
                          {item.plan_name ||
                            formatearTexto(
                              item.plan_code || "Sin plan"
                            )}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            ...estadoBadgeStyle,
                            ...obtenerEstiloEstado(
                              item.status
                            ),
                          }}
                        >
                          {traducirEstado(item.status)}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {traducirCiclo(item.billing_cycle)}
                      </td>

                      <td style={tdStyle}>
                        {obtenerVencimiento(item)}
                      </td>

                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/negocios/${item.business_id}`
                            )
                          }
                          style={verStyle}
                        >
                          Administrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Resumen({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div style={resumenStyle}>
      <span style={resumenTituloStyle}>
        {titulo}
      </span>

      <strong style={resumenValorStyle}>
        {valor}
      </strong>
    </div>
  );
}

function traducirEstado(valor: string | null) {
  const estados: Record<string, string> = {
    TRIAL: "Prueba",
    ACTIVE: "Activa",
    SUSPENDED: "Suspendida",
    CANCELLED: "Cancelada",
  };

  if (!valor) return "Sin suscripción";

  return estados[valor] || formatearTexto(valor);
}

function traducirCiclo(valor: string | null) {
  if (!valor) return "—";
  if (valor === "MONTHLY") return "Mensual";
  if (valor === "ANNUAL") return "Anual";
  return formatearTexto(valor);
}

function obtenerVencimiento(item: SuscripcionFila) {
  if (item.status === "TRIAL") {
    return formatearFecha(item.trial_ends_at);
  }

  if (item.status === "ACTIVE") {
    return formatearFecha(item.subscription_ends_at);
  }

  return "—";
}

function formatearTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) =>
      letra.toUpperCase()
    );
}

function formatearFecha(valor: string | null) {
  if (!valor) return "—";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function obtenerEstiloEstado(
  estado: string | null
): React.CSSProperties {
  if (estado === "ACTIVE") {
    return {
      background: "#ecfdf3",
      color: "#067647",
    };
  }

  if (estado === "TRIAL") {
    return {
      background: "#eff8ff",
      color: "#175cd3",
    };
  }

  if (estado === "SUSPENDED") {
    return {
      background: "#fff6ed",
      color: "#c4320a",
    };
  }

  if (estado === "CANCELLED") {
    return {
      background: "#fef3f2",
      color: "#b42318",
    };
  }

  return {
    background: "#f2f4f7",
    color: "#475467",
  };
}

const pantallaCargaStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fb",
  color: "#667085",
  fontFamily: "Arial, sans-serif",
};

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "35px clamp(12px, 4vw, 20px) 70px",
  fontFamily: "Arial, sans-serif",
};

const contenedorStyle: React.CSSProperties = {
  maxWidth: "1350px",
  margin: "0 auto",
};

const encabezadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "28px",
};

const volverStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  marginBottom: "18px",
  color: "#475467",
  cursor: "pointer",
  fontWeight: "600",
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

const resumenGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
  gap: "14px",
  marginBottom: "24px",
};

const resumenStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "15px",
  padding: "20px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
};

const resumenTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "13px",
};

const resumenValorStyle: React.CSSProperties = {
  display: "block",
  marginTop: "8px",
  color: "#101828",
  fontSize: "27px",
};

const panelStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "clamp(18px, 4vw, 26px)",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
};

const panelEncabezadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const subtituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "20px",
};

const textoSecundarioStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#667085",
  fontSize: "13px",
};

const filtrosStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const buscadorStyle: React.CSSProperties = {
  width: "min(100%, 280px)",
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
};

const selectStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  padding: "10px 12px",
  background: "#ffffff",
  color: "#101828",
  fontSize: "13px",
};

const errorStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "10px",
  background: "#fef3f2",
  color: "#b42318",
};

const vacioStyle: React.CSSProperties = {
  padding: "40px 15px",
  textAlign: "center",
  color: "#667085",
  background: "#f9fafb",
  borderRadius: "12px",
};

const tablaScrollStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tablaStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "900px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  color: "#667085",
  fontSize: "12px",
  fontWeight: "700",
  borderBottom: "1px solid #eaecf0",
  background: "#f9fafb",
};

const tdStyle: React.CSSProperties = {
  padding: "15px 14px",
  borderBottom: "1px solid #eaecf0",
  verticalAlign: "middle",
  color: "#344054",
  fontSize: "13px",
};

const negocioStyle: React.CSSProperties = {
  display: "block",
  color: "#101828",
  fontSize: "14px",
};

const detalleStyle: React.CSSProperties = {
  display: "block",
  color: "#98a2b3",
  fontSize: "11px",
  marginTop: "5px",
};

const planBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: "999px",
  background: "#eef4ff",
  color: "#004eeb",
  fontSize: "11px",
  fontWeight: "700",
};

const estadoBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
};

const verStyle: React.CSSProperties = {
  border: "1px solid #c7d7fe",
  background: "#eef4ff",
  color: "#004eeb",
  borderRadius: "9px",
  padding: "8px 11px",
  cursor: "pointer",
  fontWeight: "700",
  whiteSpace: "nowrap",
};
