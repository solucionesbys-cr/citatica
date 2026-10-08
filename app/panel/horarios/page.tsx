"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type DiaHorario = {
  day_of_week: number;
  nombre: string;
  activo: boolean;
  inicio: string;
  fin: string;
};

const HORARIO_INICIAL: DiaHorario[] = [
  {
    day_of_week: 1,
    nombre: "Lunes",
    activo: true,
    inicio: "08:00",
    fin: "17:00",
  },
  {
    day_of_week: 2,
    nombre: "Martes",
    activo: true,
    inicio: "08:00",
    fin: "17:00",
  },
  {
    day_of_week: 3,
    nombre: "Miércoles",
    activo: true,
    inicio: "08:00",
    fin: "17:00",
  },
  {
    day_of_week: 4,
    nombre: "Jueves",
    activo: true,
    inicio: "08:00",
    fin: "17:00",
  },
  {
    day_of_week: 5,
    nombre: "Viernes",
    activo: true,
    inicio: "08:00",
    fin: "17:00",
  },
  {
    day_of_week: 6,
    nombre: "Sábado",
    activo: true,
    inicio: "08:00",
    fin: "12:00",
  },
  {
    day_of_week: 0,
    nombre: "Domingo",
    activo: false,
    inicio: "08:00",
    fin: "17:00",
  },
];

export default function HorariosPage() {
  return (
    <Suspense fallback={<PantallaCarga />}>
      <HorariosContent />
    </Suspense>
  );
}

function HorariosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const professionalId = searchParams.get("professional");

  const [businessId, setBusinessId] = useState("");
  const [nombreProfesional, setNombreProfesional] = useState("");
  const [horarios, setHorarios] =
    useState<DiaHorario[]>(HORARIO_INICIAL);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (miembroError || !miembro) {
      setError(
        miembroError?.message ||
          "No se encontró un negocio asociado al usuario."
      );
      setCargando(false);
      return;
    }

    const idNegocio = miembro.business_id;
    setBusinessId(idNegocio);

    const {
      data: relacionProfesional,
      error: relacionError,
    } = await supabase
      .from("professional_businesses")
      .select(`
        professional_id,
        business_id,
        is_active,
        professionals (
          id,
          name
        )
      `)
      .eq("business_id", idNegocio)
      .eq("professional_id", professionalId)
      .eq("is_active", true)
      .maybeSingle();

    if (relacionError) {
      setError(relacionError.message);
      setCargando(false);
      return;
    }

    if (!relacionProfesional) {
      setError("Este profesional no está vinculado a este negocio.");
      setCargando(false);
      return;
    }

    const profesional = Array.isArray(
      relacionProfesional.professionals
    )
      ? relacionProfesional.professionals[0]
      : relacionProfesional.professionals;

    if (!profesional) {
      setError("No se encontró el profesional.");
      setCargando(false);
      return;
    }

    setNombreProfesional(profesional.name);

    const { data: horariosBD, error: horariosError } = await supabase
      .from("working_hours")
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        is_active
      `)
      .eq("business_id", idNegocio)
      .eq("professional_id", professionalId)
      .order("day_of_week", { ascending: true });

    if (horariosError) {
      setError(horariosError.message);
      setCargando(false);
      return;
    }

    const nuevosHorarios = HORARIO_INICIAL.map((dia) => {
      const registro = (horariosBD || []).find(
        (item) => item.day_of_week === dia.day_of_week
      );

      if (!registro) {
        return {
          ...dia,
          activo: false,
        };
      }

      return {
        ...dia,
        activo: registro.is_active,
        inicio: registro.start_time.slice(0, 5),
        fin: registro.end_time.slice(0, 5),
      };
    });

    setHorarios(nuevosHorarios);
    setCargando(false);
  }

  function cambiarActivo(day: number) {
    setHorarios((actuales) =>
      actuales.map((dia) =>
        dia.day_of_week === day
          ? {
              ...dia,
              activo: !dia.activo,
            }
          : dia
      )
    );
  }

  function cambiarHora(
    day: number,
    campo: "inicio" | "fin",
    valor: string
  ) {
    setHorarios((actuales) =>
      actuales.map((dia) =>
        dia.day_of_week === day
          ? {
              ...dia,
              [campo]: valor,
            }
          : dia
      )
    );
  }

  async function guardarHorario() {
    setMensaje("");
    setError("");

    if (!businessId || !professionalId) {
      setError("No se pudo identificar el profesional o negocio.");
      return;
    }

    const diasActivos = horarios.filter((dia) => dia.activo);

    for (const dia of diasActivos) {
      if (!dia.inicio || !dia.fin) {
        setError(
          `Debe indicar hora de inicio y fin para ${dia.nombre}.`
        );
        return;
      }

      if (dia.fin <= dia.inicio) {
        setError(
          `La hora de cierre debe ser posterior a la hora de apertura en ${dia.nombre}.`
        );
        return;
      }
    }

    setGuardando(true);

    const { error: borrarError } = await supabase
      .from("working_hours")
      .delete()
      .eq("business_id", businessId)
      .eq("professional_id", professionalId);

    if (borrarError) {
      setError(borrarError.message);
      setGuardando(false);
      return;
    }

    if (diasActivos.length > 0) {
      const registros = diasActivos.map((dia) => ({
        business_id: businessId,
        branch_id: null,
        professional_id: professionalId,
        day_of_week: dia.day_of_week,
        start_time: dia.inicio,
        end_time: dia.fin,
        is_active: true,
      }));

      const { error: insertarError } = await supabase
        .from("working_hours")
        .insert(registros);

      if (insertarError) {
        setError(insertarError.message);
        setGuardando(false);
        return;
      }
    }

    setMensaje("Horario guardado correctamente.");
    setGuardando(false);
  }

  if (cargando) {
    return (
      <main style={pantallaCargando}>
        <p>Cargando horario...</p>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={contenedorStyle}>
        <button
          onClick={() => router.push("/panel/profesionales")}
          style={volverStyle}
        >
          ← Volver a profesionales
        </button>

        <div style={encabezadoStyle}>
          <div>
            <h1 style={tituloStyle}>Horario de trabajo</h1>

            <p style={subtituloStyle}>
              Configure la disponibilidad semanal de{" "}
              <strong>{nombreProfesional}</strong>.
            </p>
          </div>
        </div>

        {error && (
          <div style={errorStyle}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {mensaje && (
          <div style={mensajeStyle}>{mensaje}</div>
        )}

        <section style={tarjetaStyle}>
          <div style={cabeceraHorarioStyle}>
            <div>
              <h2 style={seccionTituloStyle}>
                Horario semanal
              </h2>

              <p style={textoAyudaStyle}>
                Active los días de atención e indique la hora de
                inicio y finalización.
              </p>
            </div>
          </div>

          <div>
            {horarios.map((dia) => (
              <div
                key={dia.day_of_week}
                style={filaDiaStyle}
              >
                <div style={diaNombreStyle}>
                  <label style={switchContainerStyle}>
                    <input
                      type="checkbox"
                      checked={dia.activo}
                      onChange={() =>
                        cambiarActivo(dia.day_of_week)
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                      }}
                    />

                    <strong>{dia.nombre}</strong>
                  </label>
                </div>

                {dia.activo ? (
                  <div style={horasStyle}>
                    <div>
                      <label style={horaLabelStyle}>
                        Desde
                      </label>

                      <input
                        type="time"
                        value={dia.inicio}
                        onChange={(e) =>
                          cambiarHora(
                            dia.day_of_week,
                            "inicio",
                            e.target.value
                          )
                        }
                        style={horaInputStyle}
                      />
                    </div>

                    <div
                      style={{
                        paddingTop: "28px",
                        color: "#98a2b3",
                      }}
                    >
                      —
                    </div>

                    <div>
                      <label style={horaLabelStyle}>
                        Hasta
                      </label>

                      <input
                        type="time"
                        value={dia.fin}
                        onChange={(e) =>
                          cambiarHora(
                            dia.day_of_week,
                            "fin",
                            e.target.value
                          )
                        }
                        style={horaInputStyle}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={cerradoStyle}>
                    Cerrado
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={pieStyle}>
            <button
              type="button"
              onClick={() =>
                router.push("/panel/profesionales")
              }
              style={botonCancelarStyle}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={guardarHorario}
              disabled={guardando}
              style={{
                ...botonGuardarStyle,
                opacity: guardando ? 0.7 : 1,
                cursor: guardando
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {guardando
                ? "Guardando..."
                : "Guardar horario"}
            </button>
          </div>
        </section>

        <section style={notaStyle}>
          <strong>¿Cómo se utilizará este horario?</strong>

          <p style={{ marginBottom: 0 }}>
            CitaTica combinará este horario con la duración de los
            servicios y las citas existentes para determinar los
            espacios disponibles para reservar.
          </p>
        </section>
      </div>
    </main>
  );
}

function PantallaCarga() {
  return (
    <main style={pantallaCargando}>
      <p>Cargando horario...</p>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  padding: "35px 20px",
};

const pantallaCargando: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
  color: "#667085",
};

const contenedorStyle: React.CSSProperties = {
  maxWidth: "1000px",
  margin: "0 auto",
};

const volverStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  marginBottom: "16px",
  color: "#667085",
  cursor: "pointer",
  fontSize: "14px",
};

const encabezadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "28px",
};

const tituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "36px",
};

const subtituloStyle: React.CSSProperties = {
  color: "#667085",
  margin: "8px 0 0",
  fontSize: "16px",
};

const tarjetaStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "30px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
};

const cabeceraHorarioStyle: React.CSSProperties = {
  borderBottom: "1px solid #eaecf0",
  marginBottom: "5px",
};

const seccionTituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "22px",
};

const textoAyudaStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "14px",
  margin: "7px 0 22px",
};

const filaDiaStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  alignItems: "center",
  minHeight: "88px",
  borderBottom: "1px solid #eaecf0",
  gap: "20px",
};

const diaNombreStyle: React.CSSProperties = {
  color: "#101828",
};

const switchContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  cursor: "pointer",
};

const horasStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  alignItems: "flex-start",
};

const horaLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "12px",
  marginBottom: "5px",
};

const horaInputStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "15px",
  background: "#ffffff",
};

const cerradoStyle: React.CSSProperties = {
  color: "#98a2b3",
  fontSize: "14px",
};

const pieStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  paddingTop: "25px",
};

const botonCancelarStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  borderRadius: "9px",
  padding: "11px 18px",
  cursor: "pointer",
  fontWeight: "600",
};

const botonGuardarStyle: React.CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "9px",
  padding: "11px 22px",
  fontWeight: "700",
};

const errorStyle: React.CSSProperties = {
  background: "#fef3f2",
  border: "1px solid #fecdca",
  color: "#b42318",
  padding: "13px 16px",
  borderRadius: "10px",
  marginBottom: "20px",
};

const mensajeStyle: React.CSSProperties = {
  background: "#ecfdf3",
  border: "1px solid #abefc6",
  color: "#067647",
  padding: "13px 16px",
  borderRadius: "10px",
  marginBottom: "20px",
};

const notaStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "14px",
  padding: "20px",
  marginTop: "20px",
  color: "#475467",
  fontSize: "14px",
  lineHeight: 1.5,
};