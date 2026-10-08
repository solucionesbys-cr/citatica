"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Negocio = {
  id: string;
  business_name: string;
  slug: string;
  timezone: string | null;
};

type BusinessSetting = {
  business_id: string;
  is_published: boolean | null;
};

type BusinessSubscription = {
  business_id: string;
  plan_code: string | null;
  status: string | null;
  billing_cycle: string | null;
};

type NegocioFila = Negocio & {
  is_published: boolean;
  plan_code: string;
  subscription_status: string;
  billing_cycle: string;
};

export default function AdminNegociosPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [negocios, setNegocios] = useState<NegocioFila[]>([]);

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
    await cargarNegocios();
    setCargando(false);
  }

  async function cargarNegocios() {
    const { data: negociosData, error: negociosError } = await supabase
      .from("businesses")
      .select("id, business_name, slug, timezone")
      .order("business_name", { ascending: true });

    if (negociosError) {
      setError(`No se pudieron cargar los negocios: ${negociosError.message}`);
      return;
    }

    const listaNegocios = (negociosData || []) as Negocio[];

    if (listaNegocios.length === 0) {
      setNegocios([]);
      return;
    }

    const businessIds = listaNegocios.map((negocio) => negocio.id);

    const [settingsResultado, suscripcionesResultado] = await Promise.all([
      supabase
        .from("business_settings")
        .select("business_id, is_published")
        .in("business_id", businessIds),

      supabase
        .from("business_subscriptions")
        .select("business_id, plan_code, status, billing_cycle")
        .in("business_id", businessIds),
    ]);

    if (settingsResultado.error) {
      console.error(
        "Error cargando publicación de negocios:",
        settingsResultado.error.message
      );
    }

    if (suscripcionesResultado.error) {
      console.error(
        "Error cargando suscripciones:",
        suscripcionesResultado.error.message
      );
    }

    const settings = (settingsResultado.data || []) as BusinessSetting[];
    const suscripciones = (suscripcionesResultado.data ||
      []) as BusinessSubscription[];

    const settingsPorNegocio = new Map(
      settings.map((item) => [item.business_id, item])
    );

    const suscripcionPorNegocio = new Map(
      suscripciones.map((item) => [item.business_id, item])
    );

    const filas: NegocioFila[] = listaNegocios.map((negocio) => {
      const setting = settingsPorNegocio.get(negocio.id);
      const suscripcion = suscripcionPorNegocio.get(negocio.id);

      return {
        ...negocio,
        is_published: Boolean(setting?.is_published),
        plan_code: suscripcion?.plan_code || "SIN PLAN",
        subscription_status: suscripcion?.status || "SIN SUSCRIPCIÓN",
        billing_cycle: suscripcion?.billing_cycle || "",
      };
    });

    setNegocios(filas);
  }

  const negociosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) {
      return negocios;
    }

    return negocios.filter((negocio) => {
      return (
        negocio.business_name.toLowerCase().includes(termino) ||
        negocio.slug.toLowerCase().includes(termino) ||
        negocio.plan_code.toLowerCase().includes(termino) ||
        negocio.subscription_status.toLowerCase().includes(termino)
      );
    });
  }, [busqueda, negocios]);

  const publicados = negocios.filter((negocio) => negocio.is_published).length;
  const ocultos = negocios.length - publicados;

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <p>Cargando negocios...</p>
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

            <h1 style={tituloStyle}>Negocios</h1>

            <p style={descripcionStyle}>
              Consulte los negocios registrados en la plataforma.
            </p>
          </div>

          <div style={badgeStyle}>SUPERADMIN</div>
        </header>

        <section style={resumenGridStyle}>
          <Resumen titulo="Total de negocios" valor={String(negocios.length)} />
          <Resumen titulo="Publicados" valor={String(publicados)} />
          <Resumen titulo="Ocultos" valor={String(ocultos)} />
        </section>

        <section style={panelStyle}>
          <div style={panelEncabezadoStyle}>
            <div>
              <h2 style={subtituloStyle}>Listado de negocios</h2>
              <p style={textoSecundarioStyle}>
                Busque por nombre, slug, plan o estado.
              </p>
            </div>

            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar negocio..."
              style={buscadorStyle}
            />
          </div>

          {error ? (
            <div style={errorStyle}>{error}</div>
          ) : negociosFiltrados.length === 0 ? (
            <div style={vacioStyle}>
              No se encontraron negocios con ese criterio.
            </div>
          ) : (
            <div style={tablaScrollStyle}>
              <table style={tablaStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Negocio</th>
                    <th style={thStyle}>Plan</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Publicado</th>
                    <th style={thStyle}>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {negociosFiltrados.map((negocio) => (
                    <tr key={negocio.id}>
                      <td style={tdStyle}>
                        <strong style={nombreNegocioStyle}>
                          {negocio.business_name}
                        </strong>

                        <span style={slugStyle}>
                          /reservar/{negocio.slug}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <span style={planBadgeStyle}>
                          {formatearTexto(negocio.plan_code)}
                        </span>

                        {negocio.billing_cycle ? (
                          <span style={detallePlanStyle}>
                            {formatearTexto(negocio.billing_cycle)}
                          </span>
                        ) : null}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            ...estadoBadgeStyle,
                            ...obtenerEstiloEstado(
                              negocio.subscription_status
                            ),
                          }}
                        >
                          {formatearTexto(negocio.subscription_status)}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={
                            negocio.is_published
                              ? publicadoStyle
                              : ocultoStyle
                          }
                        >
                          {negocio.is_published ? "Sí" : "No"}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/admin/negocios/${negocio.id}`)
                          }
                          style={verStyle}
                        >
                          Ver negocio
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
      <span style={resumenTituloStyle}>{titulo}</span>
      <strong style={resumenValorStyle}>{valor}</strong>
    </div>
  );
}

function formatearTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

function obtenerEstiloEstado(
  estado: string
): React.CSSProperties {
  const valor = estado.toUpperCase();

  if (valor === "ACTIVE") {
    return {
      background: "#ecfdf3",
      color: "#067647",
    };
  }

  if (valor === "TRIAL") {
    return {
      background: "#eff8ff",
      color: "#175cd3",
    };
  }

  if (valor === "PAST_DUE" || valor === "SUSPENDED") {
    return {
      background: "#fff6ed",
      color: "#c4320a",
    };
  }

  if (valor === "CANCELLED") {
    return {
      background: "#fef3f2",
      color: "#b42318",
    };
  }

  return {
    background: "#f2f4f7",
    color: "#344054",
  };
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
    "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
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
  fontSize: "28px",
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

const buscadorStyle: React.CSSProperties = {
  width: "min(100%, 340px)",
  minWidth: 0,
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  padding: "11px 13px",
  outline: "none",
  fontSize: "14px",
  color: "#101828",
  background: "#ffffff",
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
  minWidth: "780px",
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

const nombreNegocioStyle: React.CSSProperties = {
  display: "block",
  color: "#101828",
  fontSize: "14px",
};

const slugStyle: React.CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#98a2b3",
  fontSize: "12px",
};

const planBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#eef4ff",
  color: "#004eeb",
  padding: "5px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
};

const detallePlanStyle: React.CSSProperties = {
  display: "block",
  marginTop: "5px",
  color: "#98a2b3",
  fontSize: "11px",
};

const estadoBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
};

const publicadoStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#ecfdf3",
  color: "#067647",
  padding: "5px 9px",
  borderRadius: "999px",
  fontWeight: "700",
  fontSize: "11px",
};

const ocultoStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#f2f4f7",
  color: "#475467",
  padding: "5px 9px",
  borderRadius: "999px",
  fontWeight: "700",
  fontSize: "11px",
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
