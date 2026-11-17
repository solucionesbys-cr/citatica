"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Resumen = {
  visitantes: number;
  paginasVistas: number;
  negociosVistos: number;
  reservasIniciadas: number;
  reservasCompletadas: number;
  conversion: number;
};

type PuntoSerie = {
  fecha: string;
  visitantes: number;
  vistas: number;
  reservas: number;
};

type NegocioTop = {
  slug: string;
  nombre: string;
  vistas: number;
};

type Origen = {
  origen: string;
  vistas: number;
};

type EventoReciente = {
  event_name: string;
  page_path: string | null;
  business_slug: string | null;
  created_at: string;
};

type RespuestaAnalitica = {
  periodo: {
    dias: number;
    desde: string;
    hasta: string;
  };
  resumen: Resumen;
  serie: PuntoSerie[];
  topNegocios: NegocioTop[];
  origenes: Origen[];
  recientes: EventoReciente[];
  limiteAlcanzado?: boolean;
};

const resumenInicial: Resumen = {
  visitantes: 0,
  paginasVistas: 0,
  negociosVistos: 0,
  reservasIniciadas: 0,
  reservasCompletadas: 0,
  conversion: 0,
};

export default function AdminAnaliticaPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState<RespuestaAnalitica>({
    periodo: {
      dias: 30,
      desde: "",
      hasta: "",
    },
    resumen: resumenInicial,
    serie: [],
    topNegocios: [],
    origenes: [],
    recientes: [],
  });

  useEffect(() => {
    verificarAcceso();
  }, []);

  useEffect(() => {
    if (!autorizado) return;

    void cargarAnalitica(dias);
  }, [dias, autorizado]);

  async function verificarAcceso() {
    setCargando(true);

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
      .eq("role", "SUPERADMIN")
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !admin) {
      router.replace("/panel");
      return;
    }

    setAutorizado(true);
  }

  async function cargarAnalitica(periodo: number) {
    setActualizando(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("No encontramos una sesión válida.");
      }

      const respuesta = await fetch(
        `/api/admin/analitica?dias=${periodo}`,
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
        throw new Error(
          resultado?.error ||
            "No se pudo cargar la analítica."
        );
      }

      setDatos(resultado as RespuestaAnalitica);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la analítica."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }

  const maxGrafica = useMemo(() => {
    return Math.max(
      1,
      ...datos.serie.map((item) =>
        Math.max(item.visitantes, item.reservas)
      )
    );
  }, [datos.serie]);

  if (cargando) {
    return (
      <main style={styles.centro}>
        <div>
          <strong>CitaTica</strong>
          <p>Cargando analítica...</p>
        </div>
      </main>
    );
  }

  if (!autorizado) return null;

  return (
    <main style={styles.main}>
      <div style={styles.contenedor}>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          style={styles.volver}
        >
          ← Volver a administración
        </button>

        <header style={styles.header}>
          <div>
            <p style={styles.marca}>CitaTica Admin</p>
            <h1 style={styles.titulo}>Analítica</h1>
            <p style={styles.subtitulo}>
              Visitantes, interacción y conversiones de la plataforma.
            </p>
          </div>

          <div style={styles.headerAcciones}>
            <div style={styles.periodos}>
              {[1, 7, 30, 90].map((periodo) => (
                <button
                  key={periodo}
                  type="button"
                  onClick={() => setDias(periodo)}
                  style={{
                    ...styles.periodoBoton,
                    ...(dias === periodo
                      ? styles.periodoActivo
                      : {}),
                  }}
                >
                  {periodo === 1 ? "Hoy" : `${periodo} días`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => cargarAnalitica(dias)}
              disabled={actualizando}
              style={styles.actualizar}
            >
              {actualizando ? "Actualizando..." : "↻ Actualizar"}
            </button>
          </div>
        </header>

        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {datos.limiteAlcanzado && (
          <div style={styles.aviso}>
            El período contiene más de 20.000 eventos. El reporte muestra
            los eventos más recientes dentro de ese límite.
          </div>
        )}

        <section style={styles.metricasGrid}>
          <Metrica
            titulo="Visitantes únicos"
            valor={datos.resumen.visitantes}
            detalle="Sesiones únicas"
          />
          <Metrica
            titulo="Páginas vistas"
            valor={datos.resumen.paginasVistas}
            detalle="Entradas registradas"
          />
          <Metrica
            titulo="Perfiles vistos"
            valor={datos.resumen.negociosVistos}
            detalle="Visitas a negocios"
          />
          <Metrica
            titulo="Reservas iniciadas"
            valor={datos.resumen.reservasIniciadas}
            detalle="Procesos comenzados"
          />
          <Metrica
            titulo="Reservas completadas"
            valor={datos.resumen.reservasCompletadas}
            detalle="Citas creadas"
          />
          <Metrica
            titulo="Conversión"
            valor={`${datos.resumen.conversion}%`}
            detalle="Completadas / iniciadas"
            destacada
          />
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <p style={styles.etiqueta}>TENDENCIA</p>
              <h2 style={styles.cardTitulo}>
                Visitantes y reservas
              </h2>
              <p style={styles.secundario}>
                Evolución diaria para el período seleccionado.
              </p>
            </div>

            <div style={styles.leyenda}>
              <span>● Visitantes</span>
              <span>◆ Reservas</span>
            </div>
          </div>

          {datos.serie.length === 0 ? (
            <Vacio texto="Todavía no hay datos para este período." />
          ) : (
            <div style={styles.graficaWrap}>
              {datos.serie.map((item) => {
                const altoVisitantes = Math.max(
                  4,
                  (item.visitantes / maxGrafica) * 150
                );
                const altoReservas = Math.max(
                  item.reservas > 0 ? 4 : 0,
                  (item.reservas / maxGrafica) * 150
                );

                return (
                  <div key={item.fecha} style={styles.graficaColumna}>
                    <div style={styles.barras}>
                      <div
                        title={`${item.visitantes} visitantes`}
                        style={{
                          ...styles.barraVisitantes,
                          height: `${altoVisitantes}px`,
                        }}
                      />
                      <div
                        title={`${item.reservas} reservas`}
                        style={{
                          ...styles.barraReservas,
                          height: `${altoReservas}px`,
                        }}
                      />
                    </div>

                    <span style={styles.fechaGrafica}>
                      {formatearFechaCorta(item.fecha)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={styles.dosColumnas}>
          <div style={styles.card}>
            <p style={styles.etiqueta}>CONVERSIÓN</p>
            <h2 style={styles.cardTitulo}>Embudo de reservas</h2>
            <p style={styles.secundario}>
              Cómo avanzan los visitantes hacia una reserva.
            </p>

            <Embudo
              titulo="Visitantes"
              valor={datos.resumen.visitantes}
              total={Math.max(datos.resumen.visitantes, 1)}
            />
            <Embudo
              titulo="Perfiles vistos"
              valor={datos.resumen.negociosVistos}
              total={Math.max(datos.resumen.visitantes, 1)}
            />
            <Embudo
              titulo="Reservas iniciadas"
              valor={datos.resumen.reservasIniciadas}
              total={Math.max(datos.resumen.visitantes, 1)}
            />
            <Embudo
              titulo="Reservas completadas"
              valor={datos.resumen.reservasCompletadas}
              total={Math.max(datos.resumen.visitantes, 1)}
            />
          </div>

          <div style={styles.card}>
            <p style={styles.etiqueta}>TRÁFICO</p>
            <h2 style={styles.cardTitulo}>Origen de las visitas</h2>
            <p style={styles.secundario}>
              Principales sitios que enviaron tráfico a CitaTica.
            </p>

            {datos.origenes.length === 0 ? (
              <Vacio texto="Todavía no hay fuentes de tráfico registradas." />
            ) : (
              <div style={styles.lista}>
                {datos.origenes.map((item, index) => (
                  <div key={item.origen} style={styles.listaFila}>
                    <span>
                      <strong style={styles.ranking}>{index + 1}</strong>
                      {item.origen}
                    </span>
                    <strong>{item.vistas}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section style={styles.card}>
          <p style={styles.etiqueta}>NEGOCIOS</p>
          <h2 style={styles.cardTitulo}>
            Negocios más visitados
          </h2>
          <p style={styles.secundario}>
            Perfiles públicos con mayor cantidad de visualizaciones.
          </p>

          {datos.topNegocios.length === 0 ? (
            <Vacio texto="Todavía no hay visitas a negocios registradas." />
          ) : (
            <div style={styles.tabla}>
              <div style={styles.tablaHeader}>
                <span>Negocio</span>
                <span>Vistas</span>
              </div>

              {datos.topNegocios.map((item, index) => (
                <div key={item.slug} style={styles.tablaFila}>
                  <span>
                    <strong style={styles.posicion}>
                      {index + 1}
                    </strong>
                    <span>
                      <strong>{item.nombre}</strong>
                      <small style={styles.slug}>/{item.slug}</small>
                    </span>
                  </span>
                  <strong>{item.vistas}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <p style={styles.etiqueta}>ACTIVIDAD</p>
          <h2 style={styles.cardTitulo}>
            Actividad reciente
          </h2>
          <p style={styles.secundario}>
            Últimos eventos registrados en el sitio público.
          </p>

          {datos.recientes.length === 0 ? (
            <Vacio texto="Todavía no hay actividad registrada." />
          ) : (
            <div style={styles.actividadLista}>
              {datos.recientes.map((item, index) => (
                <div
                  key={`${item.created_at}-${index}`}
                  style={styles.actividadFila}
                >
                  <span style={styles.eventoBadge}>
                    {traducirEvento(item.event_name)}
                  </span>

                  <span style={styles.actividadRuta}>
                    {item.business_slug
                      ? item.business_slug
                      : item.page_path || "CitaTica"}
                  </span>

                  <time style={styles.actividadFecha}>
                    {new Date(item.created_at).toLocaleString("es-CR", {
                      day: "2-digit",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metrica({
  titulo,
  valor,
  detalle,
  destacada = false,
}: {
  titulo: string;
  valor: number | string;
  detalle: string;
  destacada?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.metrica,
        ...(destacada ? styles.metricaDestacada : {}),
      }}
    >
      <span style={styles.metricaTitulo}>{titulo}</span>
      <strong style={styles.metricaValor}>{valor}</strong>
      <span style={styles.metricaDetalle}>{detalle}</span>
    </div>
  );
}

function Embudo({
  titulo,
  valor,
  total,
}: {
  titulo: string;
  valor: number;
  total: number;
}) {
  const porcentaje = Math.min(100, (valor / total) * 100);

  return (
    <div style={styles.embudoItem}>
      <div style={styles.embudoCabecera}>
        <span>{titulo}</span>
        <strong>{valor}</strong>
      </div>
      <div style={styles.embudoFondo}>
        <div
          style={{
            ...styles.embudoBarra,
            width: `${porcentaje}%`,
          }}
        />
      </div>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <div style={styles.vacio}>{texto}</div>;
}

function traducirEvento(evento: string) {
  const eventos: Record<string, string> = {
    page_view: "Página vista",
    business_view: "Negocio visto",
    booking_started: "Reserva iniciada",
    booking_completed: "Reserva completada",
    login: "Inicio de sesión",
    signup: "Registro",
  };

  return eventos[evento] || evento;
}

function formatearFechaCorta(fecha: string) {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "32px clamp(14px, 4vw, 22px) 70px",
    fontFamily: "Arial, sans-serif",
    color: "#101828",
  },
  centro: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    color: "#667085",
  },
  contenedor: {
    maxWidth: "1250px",
    margin: "0 auto",
  },
  volver: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#667085",
    cursor: "pointer",
    marginBottom: "22px",
    fontWeight: 600,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "22px",
    flexWrap: "wrap",
    marginBottom: "26px",
  },
  marca: {
    margin: 0,
    color: "#0066ff",
    fontWeight: 800,
    fontSize: "13px",
  },
  titulo: {
    margin: "5px 0 0",
    fontSize: "clamp(31px, 5vw, 40px)",
    letterSpacing: "-0.8px",
  },
  subtitulo: {
    margin: "8px 0 0",
    color: "#667085",
    lineHeight: 1.5,
  },
  headerAcciones: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  periodos: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    border: "1px solid #eaecf0",
    background: "#ffffff",
    borderRadius: "11px",
  },
  periodoBoton: {
    border: "none",
    background: "transparent",
    color: "#667085",
    borderRadius: "8px",
    padding: "8px 11px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  periodoActivo: {
    background: "#101828",
    color: "#ffffff",
  },
  actualizar: {
    border: "1px solid #d0d5dd",
    background: "#ffffff",
    color: "#344054",
    padding: "10px 13px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: {
    background: "#fef3f2",
    border: "1px solid #fecdca",
    color: "#b42318",
    padding: "14px 16px",
    borderRadius: "11px",
    marginBottom: "20px",
  },
  aviso: {
    background: "#fffaeb",
    border: "1px solid #fedf89",
    color: "#93370d",
    padding: "14px 16px",
    borderRadius: "11px",
    marginBottom: "20px",
  },
  metricasGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },
  metrica: {
    background: "#ffffff",
    border: "1px solid #eaecf0",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 6px 20px rgba(16,24,40,0.04)",
  },
  metricaDestacada: {
    background: "#eef4ff",
    border: "1px solid #c7d7fe",
  },
  metricaTitulo: {
    display: "block",
    color: "#667085",
    fontSize: "13px",
    fontWeight: 700,
  },
  metricaValor: {
    display: "block",
    marginTop: "8px",
    fontSize: "29px",
  },
  metricaDetalle: {
    display: "block",
    color: "#98a2b3",
    fontSize: "11px",
    marginTop: "5px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #eaecf0",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "22px",
    boxShadow: "0 6px 20px rgba(16,24,40,0.04)",
    minWidth: 0,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    flexWrap: "wrap",
  },
  etiqueta: {
    margin: "0 0 6px",
    color: "#0066ff",
    fontSize: "11px",
    letterSpacing: "0.8px",
    fontWeight: 800,
  },
  cardTitulo: {
    margin: 0,
    fontSize: "21px",
  },
  secundario: {
    color: "#667085",
    fontSize: "13px",
    lineHeight: 1.5,
    margin: "7px 0 18px",
  },
  leyenda: {
    display: "flex",
    gap: "14px",
    color: "#667085",
    fontSize: "11px",
    flexWrap: "wrap",
  },
  graficaWrap: {
    height: "215px",
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
    overflowX: "auto",
    paddingTop: "20px",
    borderBottom: "1px solid #eaecf0",
  },
  graficaColumna: {
    minWidth: "30px",
    flex: 1,
    height: "190px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "7px",
  },
  barras: {
    height: "155px",
    display: "flex",
    alignItems: "flex-end",
    gap: "3px",
  },
  barraVisitantes: {
    width: "8px",
    background: "#0066ff",
    borderRadius: "5px 5px 0 0",
  },
  barraReservas: {
    width: "8px",
    background: "#12b76a",
    borderRadius: "5px 5px 0 0",
  },
  fechaGrafica: {
    color: "#98a2b3",
    fontSize: "9px",
    transform: "rotate(-45deg)",
    whiteSpace: "nowrap",
    marginBottom: "5px",
  },
  dosColumnas: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 430px), 1fr))",
    gap: "22px",
  },
  embudoItem: {
    marginTop: "16px",
  },
  embudoCabecera: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    fontSize: "13px",
    marginBottom: "7px",
  },
  embudoFondo: {
    height: "10px",
    background: "#f2f4f7",
    borderRadius: "999px",
    overflow: "hidden",
  },
  embudoBarra: {
    height: "100%",
    background: "#0066ff",
    borderRadius: "999px",
    minWidth: "2px",
  },
  lista: {
    display: "grid",
  },
  listaFila: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "12px 0",
    borderBottom: "1px solid #f2f4f7",
    fontSize: "13px",
  },
  ranking: {
    display: "inline-flex",
    width: "24px",
    color: "#98a2b3",
  },
  tabla: {
    display: "grid",
  },
  tablaHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 90px",
    gap: "15px",
    color: "#98a2b3",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    padding: "10px 0",
    borderBottom: "1px solid #eaecf0",
  },
  tablaFila: {
    display: "grid",
    gridTemplateColumns: "1fr 90px",
    gap: "15px",
    alignItems: "center",
    padding: "13px 0",
    borderBottom: "1px solid #f2f4f7",
  },
  posicion: {
    display: "inline-flex",
    width: "30px",
    color: "#98a2b3",
  },
  slug: {
    display: "block",
    color: "#98a2b3",
    fontSize: "11px",
    marginTop: "3px",
    marginLeft: "30px",
  },
  actividadLista: {
    display: "grid",
  },
  actividadFila: {
    display: "grid",
    gridTemplateColumns: "150px 1fr auto",
    gap: "12px",
    alignItems: "center",
    padding: "11px 0",
    borderBottom: "1px solid #f2f4f7",
  },
  eventoBadge: {
    display: "inline-flex",
    width: "fit-content",
    background: "#f2f4f7",
    color: "#475467",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: 700,
  },
  actividadRuta: {
    color: "#475467",
    fontSize: "12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actividadFecha: {
    color: "#98a2b3",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },
  vacio: {
    background: "#f9fafb",
    border: "1px dashed #d0d5dd",
    borderRadius: "12px",
    padding: "28px",
    color: "#667085",
    textAlign: "center",
    fontSize: "13px",
  },
};
