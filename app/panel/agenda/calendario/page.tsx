"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type VistaCalendario = "dia" | "semana";

type Cita = {
  id: string;
  business_id: string;
  client_id: string;
  professional_id: string | null;
  start_at: string;
  end_at: string;
  status: string;
  total: number;
};

type Cliente = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
};

type Profesional = {
  id: string;
  name: string;
};

type ServicioCita = {
  id: string;
  appointment_id: string;
  service_name_snapshot: string;
  duration_minutes: number;
  price: number;
};

type Bloqueo = {
  id: string;
  professional_id: string | null;
  start_at: string;
  end_at: string;
  reason: string | null;
};

type EventoCalendario =
  | {
      tipo: "cita";
      id: string;
      start_at: string;
      end_at: string;
      status: string;
      cliente: string;
      telefono: string | null;
      profesional: string;
      servicio: string;
      total: number;
    }
  | {
      tipo: "bloqueo";
      id: string;
      start_at: string;
      end_at: string;
      profesional: string;
      motivo: string;
    };

export default function CalendarioPage() {
  const router = useRouter();

  const [vista, setVista] = useState<VistaCalendario>("semana");
  const [fechaReferencia, setFechaReferencia] = useState(new Date());

  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [servicios, setServicios] = useState<ServicioCita[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarCalendario();
  }, [fechaReferencia, vista]);

  async function cargarCalendario() {
    setCargando(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    const { data: miembro, error: miembroError } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (miembroError || !miembro) {
      setError(
        miembroError?.message ||
          "No se encontró el negocio asociado al usuario."
      );
      setCargando(false);
      return;
    }

    const idNegocio = miembro.business_id;
    const rango = obtenerRangoConsulta(fechaReferencia, vista);

    const inicioIso = rango.inicio.toISOString();
    const finIso = rango.fin.toISOString();

    const [
      resultadoCitas,
      resultadoClientes,
      resultadoProfesionales,
      resultadoBloqueos,
    ] = await Promise.all([
      supabase
        .from("appointments")
        .select(`
          id,
          business_id,
          client_id,
          professional_id,
          start_at,
          end_at,
          status,
          total
        `)
        .eq("business_id", idNegocio)
        .gte("start_at", inicioIso)
        .lt("start_at", finIso)
        .order("start_at", { ascending: true }),

      supabase
        .from("clients")
        .select(`
          id,
          first_name,
          last_name,
          phone
        `)
        .eq("business_id", idNegocio),

      supabase
        .from("professionals")
        .select(`
          id,
          name
        `)
        .eq("business_id", idNegocio),

      supabase
        .from("blocked_times")
        .select(`
          id,
          professional_id,
          start_at,
          end_at,
          reason
        `)
        .eq("business_id", idNegocio)
        .lt("start_at", finIso)
        .gt("end_at", inicioIso)
        .order("start_at", { ascending: true }),
    ]);

    if (resultadoCitas.error) {
      setError(resultadoCitas.error.message);
      setCargando(false);
      return;
    }

    if (resultadoClientes.error) {
      setError(resultadoClientes.error.message);
      setCargando(false);
      return;
    }

    if (resultadoProfesionales.error) {
      setError(resultadoProfesionales.error.message);
      setCargando(false);
      return;
    }

    if (resultadoBloqueos.error) {
      setError(resultadoBloqueos.error.message);
      setCargando(false);
      return;
    }

    const citasData = resultadoCitas.data || [];

    setCitas(citasData);
    setClientes(resultadoClientes.data || []);
    setProfesionales(resultadoProfesionales.data || []);
    setBloqueos(resultadoBloqueos.data || []);

    const appointmentIds = citasData.map((cita) => cita.id);

    if (appointmentIds.length === 0) {
      setServicios([]);
      setCargando(false);
      return;
    }

    const { data: serviciosData, error: serviciosError } = await supabase
      .from("appointment_services")
      .select(`
        id,
        appointment_id,
        service_name_snapshot,
        duration_minutes,
        price
      `)
      .in("appointment_id", appointmentIds);

    if (serviciosError) {
      console.error(serviciosError.message);
      setServicios([]);
    } else {
      setServicios(serviciosData || []);
    }

    setCargando(false);
  }

  const eventos = useMemo<EventoCalendario[]>(() => {
    const eventosCitas: EventoCalendario[] = citas.map((cita) => {
      const cliente = clientes.find((item) => item.id === cita.client_id);

      const profesional = profesionales.find(
        (item) => item.id === cita.professional_id
      );

      const serviciosCita = servicios.filter(
        (item) => item.appointment_id === cita.id
      );

      const nombreServicio =
        serviciosCita
          .map((item) => item.service_name_snapshot)
          .join(", ") || "Servicio";

      return {
        tipo: "cita",
        id: cita.id,
        start_at: cita.start_at,
        end_at: cita.end_at,
        status: cita.status,
        cliente: cliente
          ? [cliente.first_name, cliente.last_name].filter(Boolean).join(" ")
          : "Cliente",
        telefono: cliente?.phone || null,
        profesional: profesional?.name || "Sin profesional",
        servicio: nombreServicio,
        total: Number(cita.total || 0),
      };
    });

    const eventosBloqueos: EventoCalendario[] = bloqueos.map((bloqueo) => {
      const profesional = profesionales.find(
        (item) => item.id === bloqueo.professional_id
      );

      return {
        tipo: "bloqueo",
        id: bloqueo.id,
        start_at: bloqueo.start_at,
        end_at: bloqueo.end_at,
        profesional: profesional?.name || "Profesional",
        motivo: bloqueo.reason || "Tiempo no disponible",
      };
    });

    return [...eventosCitas, ...eventosBloqueos].sort(
      (a, b) =>
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
  }, [citas, clientes, profesionales, servicios, bloqueos]);

  const dias = useMemo(() => {
    if (vista === "dia") {
      return [inicioDia(fechaReferencia)];
    }

    return obtenerDiasSemana(fechaReferencia);
  }, [fechaReferencia, vista]);

  function cambiarPeriodo(direccion: number) {
    const nueva = new Date(fechaReferencia);

    if (vista === "dia") {
      nueva.setDate(nueva.getDate() + direccion);
    } else {
      nueva.setDate(nueva.getDate() + direccion * 7);
    }

    setFechaReferencia(nueva);
  }

  function irHoy() {
    setFechaReferencia(new Date());
  }

  function eventosDelDia(dia: Date) {
    return eventos.filter((evento) =>
      mismaFecha(new Date(evento.start_at), dia)
    );
  }

  if (cargando) {
    return (
      <main style={styles.cargando}>
        <div>
          <strong>CitaTica</strong>
          <p style={{ color: "#667085" }}>Cargando calendario...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.contenedor}>
        <button
          type="button"
          onClick={() => router.push("/panel/agenda")}
          style={styles.volver}
        >
          ← Volver a la agenda
        </button>

        <header style={styles.header}>
          <div>
            <p style={styles.marca}>CitaTica</p>

            <h1 style={styles.titulo}>Calendario</h1>

            <p style={styles.subtitulo}>
              Visualice citas, horarios ocupados y bloqueos de su negocio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/panel/agenda")}
            style={styles.botonPrincipal}
          >
            + Nueva cita
          </button>
        </header>

        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <section style={styles.barra}>
          <div style={styles.navegacion}>
            <button
              type="button"
              onClick={() => cambiarPeriodo(-1)}
              style={styles.botonIcono}
            >
              ←
            </button>

            <button
              type="button"
              onClick={irHoy}
              style={styles.botonSecundario}
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() => cambiarPeriodo(1)}
              style={styles.botonIcono}
            >
              →
            </button>
          </div>

          <div style={styles.periodoTitulo}>
            {vista === "dia"
              ? formatearFechaCompleta(fechaReferencia)
              : formatearSemana(fechaReferencia)}
          </div>

          <div style={styles.selectorVista}>
            <button
              type="button"
              onClick={() => setVista("dia")}
              style={{
                ...styles.botonVista,
                ...(vista === "dia" ? styles.botonVistaActivo : {}),
              }}
            >
              Día
            </button>

            <button
              type="button"
              onClick={() => setVista("semana")}
              style={{
                ...styles.botonVista,
                ...(vista === "semana" ? styles.botonVistaActivo : {}),
              }}
            >
              Semana
            </button>
          </div>
        </section>

        <section style={styles.resumen}>
          <Resumen
            titulo="Citas"
            valor={
              eventos.filter(
                (item) => item.tipo === "cita" && item.status !== "CANCELLED"
              ).length
            }
          />

          <Resumen
            titulo="Canceladas"
            valor={
              eventos.filter(
                (item) => item.tipo === "cita" && item.status === "CANCELLED"
              ).length
            }
          />

          <Resumen
            titulo="Bloqueos"
            valor={eventos.filter((item) => item.tipo === "bloqueo").length}
          />
        </section>

        <div
          style={{
            ...styles.calendario,
            gridTemplateColumns:
              vista === "semana"
                ? "repeat(7, minmax(180px, 1fr))"
                : "1fr",
          }}
        >
          {dias.map((dia) => {
            const eventosDia = eventosDelDia(dia);
            const esHoy = mismaFecha(dia, new Date());

            return (
              <div key={dia.toISOString()} style={styles.columnaDia}>
                <div
                  style={{
                    ...styles.encabezadoDia,
                    ...(esHoy ? styles.encabezadoHoy : {}),
                  }}
                >
                  <div style={styles.nombreDia}>
                    {dia
                      .toLocaleDateString("es-CR", {
                        weekday: "short",
                      })
                      .replace(".", "")}
                  </div>

                  <div
                    style={{
                      ...styles.numeroDia,
                      ...(esHoy ? styles.numeroDiaHoy : {}),
                    }}
                  >
                    {dia.getDate()}
                  </div>

                  <div style={styles.mesDia}>
                    {dia.toLocaleDateString("es-CR", {
                      month: "short",
                    })}
                  </div>
                </div>

                <div style={styles.eventosDia}>
                  {eventosDia.length === 0 ? (
                    <div style={styles.sinEventos}>Sin eventos</div>
                  ) : (
                    eventosDia.map((evento) => {
                      if (evento.tipo === "bloqueo") {
                        return (
                          <div
                            key={`bloqueo-${evento.id}`}
                            style={styles.tarjetaBloqueo}
                          >
                            <div style={styles.horaEvento}>
                              {formatearHora(evento.start_at)}
                              {" – "}
                              {formatearHora(evento.end_at)}
                            </div>

                            <div style={styles.tituloEvento}>
                              ⛔ {evento.motivo}
                            </div>

                            <div style={styles.detalleEvento}>
                              {evento.profesional}
                            </div>

                            <span style={styles.badgeBloqueo}>Bloqueado</span>
                          </div>
                        );
                      }

                      const cancelada = evento.status === "CANCELLED";

                      return (
                        <button
                          key={`cita-${evento.id}`}
                          type="button"
                          onClick={() =>
                            router.push(`/panel/agenda/${evento.id}`)
                          }
                          style={{
                            ...styles.tarjetaCita,
                            ...(cancelada ? styles.tarjetaCancelada : {}),
                          }}
                        >
                          <div style={styles.horaEvento}>
                            {formatearHora(evento.start_at)}
                            {" – "}
                            {formatearHora(evento.end_at)}
                          </div>

                          <div style={styles.tituloEvento}>
                            {evento.cliente}
                          </div>

                          <div style={styles.servicioEvento}>
                            {evento.servicio}
                          </div>

                          <div style={styles.detalleEvento}>
                            👤 {evento.profesional}
                          </div>

                          <div style={styles.pieEvento}>
                            <EstadoBadge estado={evento.status} />

                            <span>{formatearColones(evento.total)}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <section style={styles.leyenda}>
          <strong>Leyenda</strong>

          <div style={styles.leyendaItems}>
            <span>🗓️ Cita</span>
            <span>⛔ Bloqueo / excepción</span>
            <span>Las citas canceladas se muestran atenuadas.</span>
          </div>
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
  valor: number;
}) {
  return (
    <div style={styles.resumenItem}>
      <span style={styles.resumenTitulo}>{titulo}</span>
      <strong style={styles.resumenNumero}>{valor}</strong>
    </div>
  );
}

function EstadoBadge({
  estado,
}: {
  estado: string;
}) {
  const mapa: Record<
    string,
    {
      texto: string;
      fondo: string;
      color: string;
    }
  > = {
    PENDING: {
      texto: "Pendiente",
      fondo: "#f2f4f7",
      color: "#344054",
    },

    CONFIRMED: {
      texto: "Confirmada",
      fondo: "#ecfdf3",
      color: "#067647",
    },

    CHECKED_IN: {
      texto: "Llegó",
      fondo: "#eff8ff",
      color: "#175cd3",
    },

    IN_PROGRESS: {
      texto: "En progreso",
      fondo: "#fff6ed",
      color: "#b54708",
    },

    COMPLETED: {
      texto: "Completada",
      fondo: "#ecfdf3",
      color: "#067647",
    },

    CANCELLED: {
      texto: "Cancelada",
      fondo: "#fef3f2",
      color: "#b42318",
    },

    NO_SHOW: {
      texto: "No asistió",
      fondo: "#fef3f2",
      color: "#b42318",
    },
  };

  const item =
    mapa[estado] || {
      texto: estado,
      fondo: "#f2f4f7",
      color: "#344054",
    };

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "999px",
        background: item.fondo,
        color: item.color,
        fontSize: "11px",
        fontWeight: 700,
      }}
    >
      {item.texto}
    </span>
  );
}

function obtenerRangoConsulta(
  fecha: Date,
  vista: VistaCalendario
) {
  if (vista === "dia") {
    const inicio = inicioDia(fecha);
    const fin = new Date(inicio);

    fin.setDate(fin.getDate() + 1);

    return {
      inicio,
      fin,
    };
  }

  const dias = obtenerDiasSemana(fecha);
  const inicio = inicioDia(dias[0]);
  const fin = new Date(inicioDia(dias[6]));

  fin.setDate(fin.getDate() + 1);

  return {
    inicio,
    fin,
  };
}

function obtenerDiasSemana(fecha: Date) {
  const base = inicioDia(fecha);
  const diaSemana = base.getDay();

  const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(base);

  lunes.setDate(lunes.getDate() + diferencia);

  return Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date(lunes);

    dia.setDate(lunes.getDate() + indice);

    return dia;
  });
}

function inicioDia(fecha: Date) {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
    0,
    0,
    0,
    0
  );
}

function mismaFecha(fecha1: Date, fecha2: Date) {
  return (
    fecha1.getFullYear() === fecha2.getFullYear() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getDate() === fecha2.getDate()
  );
}

function formatearHora(fechaISO: string) {
  return new Date(fechaISO).toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatearFechaCompleta(fecha: Date) {
  const texto = fecha.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return capitalizar(texto);
}

function formatearSemana(fecha: Date) {
  const dias = obtenerDiasSemana(fecha);

  const inicio = dias[0];
  const fin = dias[6];

  if (
    inicio.getMonth() === fin.getMonth() &&
    inicio.getFullYear() === fin.getFullYear()
  ) {
    return `${inicio.getDate()} – ${fin.getDate()} de ${capitalizar(
      inicio.toLocaleDateString("es-CR", {
        month: "long",
      })
    )} de ${inicio.getFullYear()}`;
  }

  return `${inicio.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
  })} – ${fin.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function formatearColones(valor: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor);
}

function capitalizar(texto: string) {
  if (!texto) return texto;

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#101828",
    padding: "35px 20px 70px",
  },

  cargando: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  },

  contenedor: {
    maxWidth: "1500px",
    margin: "0 auto",
  },

  volver: {
    border: "none",
    background: "transparent",
    padding: 0,
    marginBottom: "24px",
    color: "#667085",
    fontSize: "15px",
    cursor: "pointer",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "28px",
  },

  marca: {
    margin: "0 0 7px",
    color: "#667085",
    fontSize: "14px",
  },

  titulo: {
    margin: 0,
    fontSize: "38px",
  },

  subtitulo: {
    margin: "10px 0 0",
    color: "#667085",
    lineHeight: 1.5,
  },

  botonPrincipal: {
    border: "none",
    borderRadius: "9px",
    background: "#101828",
    color: "#ffffff",
    padding: "13px 18px",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },

  botonSecundario: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#d0d5dd",
    background: "#ffffff",
    color: "#101828",
    borderRadius: "8px",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  barra: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "16px 18px",
    display: "grid",
    gridTemplateColumns: "minmax(200px, 1fr) auto minmax(200px, 1fr)",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 5px 18px rgba(16,24,40,0.04)",
    marginBottom: "18px",
  },

  navegacion: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  botonIcono: {
    width: "42px",
    height: "42px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#d0d5dd",
    borderRadius: "8px",
    background: "#ffffff",
    fontSize: "18px",
    cursor: "pointer",
  },

  periodoTitulo: {
    fontWeight: 700,
    fontSize: "17px",
    textAlign: "center",
  },

  selectorVista: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "4px",
  },

  botonVista: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#d0d5dd",
    background: "#ffffff",
    color: "#101828",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },

  botonVistaActivo: {
    background: "#101828",
    color: "#ffffff",
    borderColor: "#101828",
  },

  resumen: {
    display: "flex",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  resumenItem: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "12px 16px",
    minWidth: "120px",
    boxShadow: "0 4px 14px rgba(16,24,40,0.04)",
  },

  resumenTitulo: {
    display: "block",
    color: "#667085",
    fontSize: "12px",
    marginBottom: "5px",
  },

  resumenNumero: {
    fontSize: "21px",
  },

  calendario: {
    display: "grid",
    gap: "10px",
    overflowX: "auto",
  },

  columnaDia: {
    minWidth: "180px",
    background: "#ffffff",
    borderRadius: "15px",
    overflow: "hidden",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#eaecf0",
  },

  encabezadoDia: {
    padding: "15px",
    textAlign: "center",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "#eaecf0",
    background: "#ffffff",
  },

  encabezadoHoy: {
    background: "#eff8ff",
  },

  nombreDia: {
    fontSize: "12px",
    color: "#667085",
    fontWeight: 700,
    textTransform: "uppercase",
  },

  numeroDia: {
    fontSize: "25px",
    fontWeight: 700,
    marginTop: "4px",
  },

  numeroDiaHoy: {
    color: "#175cd3",
  },

  mesDia: {
    color: "#667085",
    fontSize: "12px",
    marginTop: "2px",
  },

  eventosDia: {
    padding: "10px",
    minHeight: "430px",
  },

  sinEventos: {
    color: "#98a2b3",
    fontSize: "13px",
    textAlign: "center",
    padding: "30px 5px",
  },

  tarjetaCita: {
    width: "100%",
    textAlign: "left",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#d0d5dd",
    borderRadius: "10px",
    background: "#ffffff",
    padding: "11px",
    cursor: "pointer",
    marginBottom: "9px",
    color: "#101828",
  },

  tarjetaCancelada: {
    opacity: 0.55,
    background: "#f9fafb",
  },

  tarjetaBloqueo: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#fecdca",
    borderRadius: "10px",
    background: "#fff7f6",
    padding: "11px",
    marginBottom: "9px",
  },

  horaEvento: {
    color: "#667085",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "6px",
  },

  tituloEvento: {
    fontWeight: 700,
    lineHeight: 1.35,
  },

  servicioEvento: {
    color: "#344054",
    fontSize: "13px",
    marginTop: "4px",
  },

  detalleEvento: {
    color: "#667085",
    fontSize: "12px",
    marginTop: "6px",
  },

  pieEvento: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "6px",
    marginTop: "9px",
    fontSize: "12px",
    fontWeight: 600,
  },

  badgeBloqueo: {
    display: "inline-block",
    marginTop: "8px",
    padding: "4px 8px",
    background: "#fef3f2",
    color: "#b42318",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
  },

  leyenda: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    marginTop: "18px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#eaecf0",
  },

  leyendaItems: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "10px",
    color: "#667085",
    fontSize: "13px",
  },

  error: {
    background: "#fef3f2",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#fecdca",
    color: "#b42318",
    borderRadius: "10px",
    padding: "14px 17px",
    marginBottom: "20px",
  },
};
