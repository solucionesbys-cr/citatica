"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Bloqueo = {
  id: string;
  business_id: string;
  branch_id: string | null;
  professional_id: string | null;
  start_at: string;
  end_at: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

export default function BloqueosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const professionalId = searchParams.get("professional");

  const [businessId, setBusinessId] = useState("");
  const [nombreProfesional, setNombreProfesional] = useState("");

  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);

  const [fecha, setFecha] = useState(fechaHoyInput());
  const [horaInicio, setHoraInicio] = useState("12:00");
  const [horaFin, setHoraFin] = useState("13:00");
  const [motivo, setMotivo] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [professionalId]);

  async function cargarDatos() {
    setCargando(true);
    setError("");
    setMensaje("");

    if (!professionalId) {
      setError("No se indicó el profesional.");
      setCargando(false);
      return;
    }

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
          "No se encontró un negocio asociado al usuario."
      );
      setCargando(false);
      return;
    }

    setBusinessId(miembro.business_id);

    const { data: profesional, error: profesionalError } =
      await supabase
        .from("professionals")
        .select("id, name")
        .eq("id", professionalId)
        .eq("business_id", miembro.business_id)
        .single();

    if (profesionalError || !profesional) {
      setError(
        profesionalError?.message ||
          "No se encontró el profesional."
      );
      setCargando(false);
      return;
    }

    setNombreProfesional(profesional.name);

    await cargarBloqueos(miembro.business_id, professionalId);

    setCargando(false);
  }

  async function cargarBloqueos(
    idNegocio: string,
    idProfesional: string
  ) {
    const { data, error } = await supabase
      .from("blocked_times")
      .select(`
        id,
        business_id,
        branch_id,
        professional_id,
        start_at,
        end_at,
        reason,
        created_by,
        created_at
      `)
      .eq("business_id", idNegocio)
      .eq("professional_id", idProfesional)
      .order("start_at", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setBloqueos(data || []);
  }

  async function crearBloqueo(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!businessId || !professionalId) {
      setError(
        "No se pudo identificar el negocio o profesional."
      );
      return;
    }

    if (!fecha) {
      setError("Seleccione una fecha.");
      return;
    }

    if (!horaInicio || !horaFin) {
      setError("Indique la hora de inicio y finalización.");
      return;
    }

    if (horaFin <= horaInicio) {
      setError(
        "La hora final debe ser posterior a la hora inicial."
      );
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    const startAt = new Date(`${fecha}T${horaInicio}:00`);
    const endAt = new Date(`${fecha}T${horaFin}:00`);

    if (endAt <= startAt) {
      setError("El rango de fechas y horas no es válido.");
      return;
    }

    setGuardando(true);

    /*
     * Verificamos si ya existe otro bloqueo que se cruce.
     */
    const { data: conflictos, error: conflictoError } =
      await supabase
        .from("blocked_times")
        .select("id, start_at, end_at")
        .eq("business_id", businessId)
        .eq("professional_id", professionalId)
        .lt("start_at", endAt.toISOString())
        .gt("end_at", startAt.toISOString());

    if (conflictoError) {
      setError(conflictoError.message);
      setGuardando(false);
      return;
    }

    if (conflictos && conflictos.length > 0) {
      setError(
        "Ya existe un bloqueo que coincide con ese horario."
      );
      setGuardando(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("blocked_times")
      .insert({
        business_id: businessId,
        branch_id: null,
        professional_id: professionalId,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        reason: motivo.trim() || null,
        created_by: user.id,
      });

    if (insertError) {
      setError(insertError.message);
      setGuardando(false);
      return;
    }

    setMensaje("Bloqueo creado correctamente.");

    setMotivo("");

    await cargarBloqueos(businessId, professionalId);

    setGuardando(false);
  }

  async function eliminarBloqueo(id: string) {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este bloqueo?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("blocked_times")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("professional_id", professionalId);

    if (error) {
      setError(error.message);
      return;
    }

    setMensaje("Bloqueo eliminado correctamente.");

    await cargarBloqueos(businessId, professionalId!);
  }

  function bloquearDiaCompleto() {
    setHoraInicio("00:00");
    setHoraFin("23:59");
  }

  const bloqueosFuturos = useMemo(() => {
    const ahora = new Date();

    return bloqueos.filter(
      (bloqueo) => new Date(bloqueo.end_at) >= ahora
    );
  }, [bloqueos]);

  const bloqueosPasados = useMemo(() => {
    const ahora = new Date();

    return bloqueos
      .filter(
        (bloqueo) => new Date(bloqueo.end_at) < ahora
      )
      .reverse();
  }, [bloqueos]);

  if (cargando) {
    return (
      <main style={styles.centroPantalla}>
        Cargando bloqueos...
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.contenedor}>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/panel/horarios?professional=${professionalId}`
            )
          }
          style={styles.volver}
        >
          ← Volver al horario
        </button>

        <header style={styles.encabezado}>
          <div>
            <p style={styles.marca}>CitaTica</p>

            <h1 style={styles.titulo}>
              Bloqueos y excepciones
            </h1>

            <p style={styles.subtitulo}>
              Administre períodos en los que{" "}
              <strong>{nombreProfesional}</strong> no estará
              disponible para recibir citas.
            </p>
          </div>

          <div style={styles.contador}>
            <strong style={{ fontSize: "23px" }}>
              {bloqueosFuturos.length}
            </strong>

            <span style={{ color: "#667085" }}>
              {bloqueosFuturos.length === 1
                ? "Bloqueo activo"
                : "Bloqueos activos"}
            </span>
          </div>
        </header>

        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {mensaje && (
          <div style={styles.mensaje}>{mensaje}</div>
        )}

        <div style={styles.gridPrincipal}>
          <section style={styles.card}>
            <h2 style={styles.cardTitulo}>
              Nuevo bloqueo
            </h2>

            <p style={styles.secundario}>
              Seleccione la fecha y el rango de tiempo que desea
              bloquear.
            </p>

            <form onSubmit={crearBloqueo}>
              <label style={styles.label}>Fecha</label>

              <input
                type="date"
                value={fecha}
                min={fechaHoyInput()}
                onChange={(e) => setFecha(e.target.value)}
                style={styles.input}
                required
              />

              <div style={styles.horasGrid}>
                <div>
                  <label style={styles.label}>
                    Desde
                  </label>

                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) =>
                      setHoraInicio(e.target.value)
                    }
                    style={styles.input}
                    required
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    Hasta
                  </label>

                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) =>
                      setHoraFin(e.target.value)
                    }
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={bloquearDiaCompleto}
                style={styles.botonSecundario}
              >
                Bloquear todo el día
              </button>

              <div style={{ marginTop: "18px" }}>
                <label style={styles.label}>
                  Motivo
                </label>

                <input
                  type="text"
                  value={motivo}
                  onChange={(e) =>
                    setMotivo(e.target.value)
                  }
                  placeholder="Ej. Vacaciones, almuerzo, cita personal..."
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                style={{
                  ...styles.botonPrincipal,
                  opacity: guardando ? 0.7 : 1,
                }}
              >
                {guardando
                  ? "Guardando..."
                  : "+ Crear bloqueo"}
              </button>
            </form>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitulo}>
              Próximos bloqueos
            </h2>

            <p style={styles.secundario}>
              Períodos que actualmente afectan la disponibilidad
              del profesional.
            </p>

            {bloqueosFuturos.length === 0 ? (
              <div style={styles.vacio}>
                <div style={{ fontSize: "34px" }}>
                  📅
                </div>

                <strong>
                  No hay bloqueos futuros
                </strong>

                <p style={styles.secundario}>
                  El profesional está disponible según su horario
                  semanal y las citas existentes.
                </p>
              </div>
            ) : (
              <div style={styles.lista}>
                {bloqueosFuturos.map((bloqueo) => (
                  <div
                    key={bloqueo.id}
                    style={styles.bloqueoFila}
                  >
                    <div>
                      <div style={styles.fechaBloqueo}>
                        {formatearFecha(bloqueo.start_at)}
                      </div>

                      <div style={styles.horaBloqueo}>
                        {formatearHora(bloqueo.start_at)}
                        {" — "}
                        {formatearHora(bloqueo.end_at)}
                      </div>

                      <div style={styles.motivo}>
                        {bloqueo.reason ||
                          "Sin motivo indicado"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarBloqueo(bloqueo.id)
                      }
                      style={styles.botonEliminar}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {bloqueosPasados.length > 0 && (
          <section style={styles.cardHistorial}>
            <h2 style={styles.cardTitulo}>
              Historial de bloqueos
            </h2>

            <p style={styles.secundario}>
              Bloqueos que ya finalizaron.
            </p>

            <div style={styles.lista}>
              {bloqueosPasados.map((bloqueo) => (
                <div
                  key={bloqueo.id}
                  style={styles.bloqueoFila}
                >
                  <div>
                    <div style={styles.fechaBloqueo}>
                      {formatearFecha(bloqueo.start_at)}
                    </div>

                    <div style={styles.horaBloqueo}>
                      {formatearHora(bloqueo.start_at)}
                      {" — "}
                      {formatearHora(bloqueo.end_at)}
                    </div>

                    <div style={styles.motivo}>
                      {bloqueo.reason ||
                        "Sin motivo indicado"}
                    </div>
                  </div>

                  <span style={styles.finalizado}>
                    Finalizado
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={styles.nota}>
          <strong>
            ¿Cómo afectan estos bloqueos a las reservas?
          </strong>

          <p style={{ marginBottom: 0 }}>
            Los períodos registrados aquí deben excluirse de los
            horarios disponibles junto con las citas existentes y el
            horario semanal del profesional.
          </p>
        </section>
      </div>
    </main>
  );
}

function fechaHoyInput() {
  const fecha = new Date();

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearFecha(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatearHora(fechaISO: string) {
  return new Date(fechaISO).toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#101828",
    padding: "35px 20px 70px",
  },

  centroPantalla: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    color: "#667085",
  },

  contenedor: {
    width: "100%",
    maxWidth: "1150px",
    margin: "0 auto",
  },

  volver: {
    border: "none",
    background: "transparent",
    color: "#667085",
    padding: 0,
    cursor: "pointer",
    marginBottom: "24px",
    fontSize: "15px",
  },

  encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "25px",
    marginBottom: "28px",
  },

  marca: {
    margin: "0 0 7px",
    color: "#667085",
    fontSize: "14px",
  },

  titulo: {
    margin: 0,
    fontSize: "36px",
  },

  subtitulo: {
    color: "#667085",
    lineHeight: 1.5,
    margin: "10px 0 0",
  },

  contador: {
    minWidth: "145px",
    background: "#ffffff",
    border: "1px solid #eaecf0",
    borderRadius: "14px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  gridPrincipal: {
    display: "grid",
    gridTemplateColumns:
      "minmax(300px, 400px) minmax(0, 1fr)",
    gap: "24px",
    alignItems: "start",
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "27px",
    boxShadow: "0 6px 20px rgba(16,24,40,0.05)",
  },

  cardHistorial: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "27px",
    marginTop: "24px",
    boxShadow: "0 6px 20px rgba(16,24,40,0.05)",
  },

  cardTitulo: {
    margin: 0,
    fontSize: "23px",
  },

  secundario: {
    color: "#667085",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "7px 0 22px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontWeight: 600,
    fontSize: "14px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    padding: "12px 13px",
    fontSize: "15px",
    background: "#ffffff",
  },

  horasGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "18px",
    marginBottom: "12px",
  },

  botonPrincipal: {
    width: "100%",
    border: "none",
    borderRadius: "9px",
    background: "#101828",
    color: "#ffffff",
    padding: "13px 17px",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "5px",
  },

  botonSecundario: {
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#101828",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  lista: {
    display: "grid",
  },

  bloqueoFila: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    padding: "18px 0",
    borderBottom: "1px solid #eaecf0",
  },

  fechaBloqueo: {
    fontWeight: 700,
    fontSize: "16px",
    textTransform: "capitalize",
  },

  horaBloqueo: {
    color: "#344054",
    marginTop: "5px",
    fontWeight: 600,
  },

  motivo: {
    color: "#667085",
    marginTop: "5px",
    fontSize: "14px",
  },

  botonEliminar: {
    border: "1px solid #fecdca",
    background: "#ffffff",
    color: "#b42318",
    borderRadius: "8px",
    padding: "9px 13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  finalizado: {
    background: "#f2f4f7",
    color: "#667085",
    borderRadius: "999px",
    padding: "6px 10px",
    fontWeight: 600,
    fontSize: "12px",
  },

  vacio: {
    border: "1px dashed #d0d5dd",
    borderRadius: "13px",
    padding: "45px 20px",
    textAlign: "center",
    color: "#475467",
  },

  error: {
    background: "#fef3f2",
    border: "1px solid #fecdca",
    color: "#b42318",
    padding: "13px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  mensaje: {
    background: "#ecfdf3",
    border: "1px solid #abefc6",
    color: "#067647",
    padding: "13px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  nota: {
    background: "#ffffff",
    border: "1px solid #eaecf0",
    borderRadius: "14px",
    padding: "20px",
    marginTop: "22px",
    color: "#475467",
    fontSize: "14px",
    lineHeight: 1.5,
  },
};