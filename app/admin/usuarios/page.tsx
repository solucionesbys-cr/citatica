"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type NegocioUsuario = {
  business_id: string;
  business_name: string;
  business_slug: string | null;
  member_role: string;
  membership_created_at: string | null;
};

type UsuarioFila = {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string;
  businesses: NegocioUsuario[];
  is_superadmin: boolean;
  admin_role: string | null;
  admin_active: boolean;
};

type Resumen = {
  total: number;
  conNegocio: number;
  sinNegocio: number;
  superadmins: number;
  confirmados: number;
};

const resumenInicial: Resumen = {
  total: 0,
  conNegocio: 0,
  sinNegocio: 0,
  superadmins: 0,
  confirmados: 0,
};

export default function AdminUsuariosPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioFila[]>([]);
  const [resumen, setResumen] =
    useState<Resumen>(resumenInicial);

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODOS");

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
    await cargarUsuarios();
    setCargando(false);
  }

  async function cargarUsuarios() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setError("No encontramos una sesión válida.");
      return;
    }

    const respuesta = await fetch("/api/admin/usuarios", {
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
          "No se pudieron cargar los usuarios."
      );
      return;
    }

    setUsuarios(
      (resultado.usuarios || []) as UsuarioFila[]
    );

    setResumen(
      (resultado.resumen || resumenInicial) as Resumen
    );
  }

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const coincideFiltro =
        filtro === "TODOS" ||
        (filtro === "CON_NEGOCIO" &&
          usuario.businesses.length > 0) ||
        (filtro === "SIN_NEGOCIO" &&
          usuario.businesses.length === 0) ||
        (filtro === "SUPERADMIN" &&
          usuario.is_superadmin);

      const coincideBusqueda =
        !termino ||
        usuario.email.toLowerCase().includes(termino) ||
        (usuario.name || "").toLowerCase().includes(termino) ||
        usuario.businesses.some((negocio) =>
          negocio.business_name
            .toLowerCase()
            .includes(termino)
        );

      return coincideFiltro && coincideBusqueda;
    });
  }, [usuarios, busqueda, filtro]);

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <p>Cargando usuarios...</p>
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

            <h1 style={tituloStyle}>Usuarios</h1>

            <p style={descripcionStyle}>
              Usuarios registrados y negocios asociados.
            </p>
          </div>

          <div style={badgeStyle}>SUPERADMIN</div>
        </header>

        <section style={resumenGridStyle}>
          <Resumen
            titulo="Usuarios"
            valor={String(resumen.total)}
          />

          <Resumen
            titulo="Con negocio"
            valor={String(resumen.conNegocio)}
          />

          <Resumen
            titulo="Sin negocio"
            valor={String(resumen.sinNegocio)}
          />

          <Resumen
            titulo="Superadmins"
            valor={String(resumen.superadmins)}
          />

          <Resumen
            titulo="Correos confirmados"
            valor={String(resumen.confirmados)}
          />
        </section>

        <section style={panelStyle}>
          <div style={panelEncabezadoStyle}>
            <div>
              <h2 style={subtituloStyle}>
                Usuarios registrados
              </h2>

              <p style={textoSecundarioStyle}>
                Consulte la cuenta, sus negocios y su último acceso.
              </p>
            </div>

            <div style={filtrosStyle}>
              <input
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Buscar usuario..."
                style={buscadorStyle}
              />

              <select
                value={filtro}
                onChange={(event) =>
                  setFiltro(event.target.value)
                }
                style={selectStyle}
              >
                <option value="TODOS">Todos</option>
                <option value="CON_NEGOCIO">
                  Con negocio
                </option>
                <option value="SIN_NEGOCIO">
                  Sin negocio
                </option>
                <option value="SUPERADMIN">
                  Superadmin
                </option>
              </select>
            </div>
          </div>

          {error ? (
            <div style={errorStyle}>{error}</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div style={vacioStyle}>
              No hay usuarios que coincidan con los filtros.
            </div>
          ) : (
            <div style={tablaScrollStyle}>
              <table style={tablaStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Usuario</th>
                    <th style={thStyle}>Negocio</th>
                    <th style={thStyle}>Rol</th>
                    <th style={thStyle}>Acceso</th>
                    <th style={thStyle}>Registro</th>
                    <th style={thStyle}>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td style={tdStyle}>
                        <strong style={usuarioStyle}>
                          {usuario.name || usuario.email}
                        </strong>

                        {usuario.name ? (
                          <span style={detalleStyle}>
                            {usuario.email}
                          </span>
                        ) : null}

                        <span style={detalleStyle}>
                          {traducirProveedor(usuario.provider)}
                        </span>

                        {usuario.is_superadmin ? (
                          <span style={superadminStyle}>
                            SUPERADMIN
                          </span>
                        ) : null}
                      </td>

                      <td style={tdStyle}>
                        {usuario.businesses.length === 0 ? (
                          <span style={sinNegocioStyle}>
                            Sin negocio
                          </span>
                        ) : (
                          <div style={negociosListaStyle}>
                            {usuario.businesses.map(
                              (negocio) => (
                                <button
                                  key={negocio.business_id}
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/admin/negocios/${negocio.business_id}`
                                    )
                                  }
                                  style={negocioLinkStyle}
                                >
                                  {negocio.business_name}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </td>

                      <td style={tdStyle}>
                        {usuario.businesses.length > 0
                          ? usuario.businesses
                              .map((negocio) =>
                                formatearTexto(
                                  negocio.member_role
                                )
                              )
                              .join(", ")
                          : "—"}
                      </td>

                      <td style={tdStyle}>
                        {usuario.last_sign_in_at
                          ? formatearFechaHora(
                              usuario.last_sign_in_at
                            )
                          : "Sin acceso registrado"}

                        <span style={detalleStyle}>
                          {usuario.email_confirmed_at
                            ? "Correo confirmado"
                            : "Correo sin confirmar"}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {formatearFechaHora(
                          usuario.created_at
                        )}
                      </td>

                      <td style={tdStyle}>
                        {usuario.businesses.length === 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/negocios/${usuario.businesses[0].business_id}`
                              )
                            }
                            style={verStyle}
                          >
                            Ver negocio
                          </button>
                        ) : usuario.businesses.length > 1 ? (
                          <span style={detalleStyle}>
                            Varios negocios
                          </span>
                        ) : (
                          <span style={detalleStyle}>
                            Sin acciones
                          </span>
                        )}
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

function formatearTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) =>
      letra.toUpperCase()
    );
}

function traducirProveedor(valor: string) {
  const proveedores: Record<string, string> = {
    email: "Correo y contraseña",
    google: "Google",
    apple: "Apple",
    azure: "Microsoft",
  };

  return proveedores[valor] || formatearTexto(valor);
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
  maxWidth: "1400px",
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
  minWidth: "1150px",
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

const usuarioStyle: React.CSSProperties = {
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

const superadminStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: "7px",
  background: "#eef4ff",
  color: "#004eeb",
  padding: "4px 7px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: "800",
};

const sinNegocioStyle: React.CSSProperties = {
  color: "#98a2b3",
  fontSize: "12px",
};

const negociosListaStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};

const negocioLinkStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#004eeb",
  fontWeight: "700",
  cursor: "pointer",
  textAlign: "left",
  fontSize: "13px",
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
