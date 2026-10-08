"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Pago = {
  id: string;
  business_id: string;
  business_name: string;
  payment_type: string | null;
  payment_status: string | null;
  provider: string | null;
  amount: number | string | null;
  currency_code: string | null;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  plan_code: string | null;
  billing_cycle: string | null;
  provider_order_id: string | null;
};

type Resumen = {
  total: number;
  pagados: number;
  pendientes: number;
  fallidos: number;
  montoPagadoCRC: number;
};

const resumenInicial: Resumen = {
  total: 0,
  pagados: 0,
  pendientes: 0,
  fallidos: 0,
  montoPagadoCRC: 0,
};

export default function AdminPagosPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [resumen, setResumen] = useState<Resumen>(resumenInicial);
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
    await cargarPagos();
    setCargando(false);
  }

  async function cargarPagos() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setError("No encontramos una sesión válida.");
      return;
    }

    const respuesta = await fetch("/api/admin/pagos", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setError(
        resultado?.error || "No se pudieron cargar los pagos."
      );
      return;
    }

    setPagos((resultado.pagos || []) as Pago[]);
    setResumen(
      (resultado.resumen || resumenInicial) as Resumen
    );
  }

  const pagosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return pagos.filter((pago) => {
      const coincideEstado =
        filtroEstado === "TODOS" ||
        pago.payment_status === filtroEstado;

      const coincideBusqueda =
        !termino ||
        pago.business_name.toLowerCase().includes(termino) ||
        (pago.provider_order_id || "").toLowerCase().includes(termino) ||
        (pago.transaction_reference || "").toLowerCase().includes(termino) ||
        (pago.plan_code || "").toLowerCase().includes(termino);

      return coincideEstado && coincideBusqueda;
    });
  }, [pagos, busqueda, filtroEstado]);

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <p>Cargando pagos...</p>
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
            <h1 style={tituloStyle}>Pagos</h1>
            <p style={descripcionStyle}>
              Historial de transacciones y pagos de la plataforma.
            </p>
          </div>

          <div style={badgeStyle}>SUPERADMIN</div>
        </header>

        <section style={resumenGridStyle}>
          <Resumen titulo="Total" valor={String(resumen.total)} />
          <Resumen titulo="Pagados" valor={String(resumen.pagados)} />
          <Resumen titulo="Pendientes" valor={String(resumen.pendientes)} />
          <Resumen titulo="Fallidos" valor={String(resumen.fallidos)} />
          <Resumen
            titulo="Cobrado CRC"
            valor={formatearColones(resumen.montoPagadoCRC)}
          />
        </section>

        <section style={panelStyle}>
          <div style={panelEncabezadoStyle}>
            <div>
              <h2 style={subtituloStyle}>Historial de pagos</h2>
              <p style={textoSecundarioStyle}>
                Busque por negocio, plan, orden o referencia.
              </p>
            </div>

            <div style={filtrosStyle}>
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar..."
                style={buscadorStyle}
              />

              <select
                value={filtroEstado}
                onChange={(event) => setFiltroEstado(event.target.value)}
                style={selectStyle}
              >
                <option value="TODOS">Todos</option>
                <option value="PAID">Pagados</option>
                <option value="PENDING">Pendientes</option>
                <option value="FAILED">Fallidos</option>
                <option value="REFUNDED">Reembolsados</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>
          </div>

          {error ? (
            <div style={errorStyle}>{error}</div>
          ) : pagosFiltrados.length === 0 ? (
            <div style={vacioStyle}>
              No hay pagos que coincidan con los filtros.
            </div>
          ) : (
            <div style={tablaScrollStyle}>
              <table style={tablaStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Negocio</th>
                    <th style={thStyle}>Plan</th>
                    <th style={thStyle}>Monto</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Proveedor</th>
                    <th style={thStyle}>Orden</th>
                    <th style={thStyle}>Fecha</th>
                  </tr>
                </thead>

                <tbody>
                  {pagosFiltrados.map((pago) => (
                    <tr key={pago.id}>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/admin/negocios/${pago.business_id}`)
                          }
                          style={negocioLinkStyle}
                        >
                          {pago.business_name}
                        </button>

                        <span style={detalleStyle}>
                          {formatearTexto(pago.payment_type || "PAGO")}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {formatearTexto(pago.plan_code || "Sin plan")}
                        </strong>

                        {pago.billing_cycle ? (
                          <span style={detalleStyle}>
                            {traducirCiclo(pago.billing_cycle)}
                          </span>
                        ) : null}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {formatearMonto(
                            pago.amount,
                            pago.currency_code
                          )}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            ...estadoBadgeStyle,
                            ...obtenerEstiloEstado(
                              pago.payment_status || ""
                            ),
                          }}
                        >
                          {traducirEstado(
                            pago.payment_status || ""
                          )}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {pago.provider || "—"}
                      </td>

                      <td style={tdStyle}>
                        <span style={codigoStyle}>
                          {pago.provider_order_id || "—"}
                        </span>

                        {pago.transaction_reference ? (
                          <span style={detalleStyle}>
                            Ref: {pago.transaction_reference}
                          </span>
                        ) : null}
                      </td>

                      <td style={tdStyle}>
                        {formatearFechaHora(pago.created_at)}

                        {pago.paid_at ? (
                          <span style={detalleStyle}>
                            Pagado: {formatearFechaHora(pago.paid_at)}
                          </span>
                        ) : null}
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

function traducirEstado(valor: string) {
  const estados: Record<string, string> = {
    PAID: "Pagado",
    PENDING: "Pendiente",
    FAILED: "Fallido",
    REFUNDED: "Reembolsado",
    CANCELLED: "Cancelado",
  };

  return estados[valor] || formatearTexto(valor || "Sin estado");
}

function traducirCiclo(valor: string) {
  if (valor === "MONTHLY") return "Mensual";
  if (valor === "ANNUAL") return "Anual";
  return formatearTexto(valor);
}

function formatearColones(valor: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

function formatearMonto(
  valor: number | string | null,
  moneda: string | null
) {
  const numero = Number(valor || 0);
  const codigo = moneda || "CRC";

  try {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: codigo,
      maximumFractionDigits: 0,
    }).format(numero);
  } catch {
    return `${codigo} ${numero}`;
  }
}

function formatearFechaHora(valor: string | null) {
  if (!valor) return "—";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obtenerEstiloEstado(
  estado: string
): React.CSSProperties {
  if (estado === "PAID") {
    return {
      background: "#ecfdf3",
      color: "#067647",
    };
  }

  if (estado === "PENDING") {
    return {
      background: "#fffaeb",
      color: "#b54708",
    };
  }

  if (estado === "FAILED") {
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
  minWidth: "1050px",
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
  verticalAlign: "top",
  color: "#344054",
  fontSize: "13px",
};

const negocioLinkStyle: React.CSSProperties = {
  display: "block",
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#004eeb",
  fontWeight: "700",
  cursor: "pointer",
  textAlign: "left",
};

const detalleStyle: React.CSSProperties = {
  display: "block",
  color: "#98a2b3",
  fontSize: "11px",
  marginTop: "5px",
};

const codigoStyle: React.CSSProperties = {
  display: "block",
  maxWidth: "230px",
  overflowWrap: "anywhere",
  color: "#344054",
  fontSize: "12px",
};

const estadoBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
};
