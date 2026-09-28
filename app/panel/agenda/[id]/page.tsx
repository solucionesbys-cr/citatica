"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type Cita = {
  id: string;
  business_id: string;
  client_id: string;
  professional_id: string | null;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  source: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  deposit_amount: number;
  customer_notes: string | null;
  internal_notes: string | null;
  created_at: string;
};

type Cliente = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  notes: string | null;
};

type Profesional = {
  id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
};

type ServicioCita = {
  id: string;
  service_id: string | null;
  service_name_snapshot: string;
  price: number;
  duration_minutes: number;
};

type Horario = {
  start_time: string;
  end_time: string;
};

type HistorialCita = {
  id: string;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  created_at: string;
};

const ESTADOS: {
  valor: AppointmentStatus;
  texto: string;
}[] = [
  { valor: "PENDING", texto: "Pendiente" },
  { valor: "CONFIRMED", texto: "Confirmada" },
  { valor: "CHECKED_IN", texto: "Cliente llegó" },
  { valor: "IN_PROGRESS", texto: "En progreso" },
  { valor: "COMPLETED", texto: "Completada" },
  { valor: "CANCELLED", texto: "Cancelada" },
  { valor: "NO_SHOW", texto: "No se presentó" },
];

export default function DetalleCitaPage() {
  const params = useParams();
  const router = useRouter();

  const idParam = params?.id;
  const citaId = Array.isArray(idParam) ? idParam[0] : idParam;

  const [cita, setCita] = useState<Cita | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [profesional, setProfesional] =
    useState<Profesional | null>(null);

  const [servicios, setServicios] = useState<ServicioCita[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [estado, setEstado] =
    useState<AppointmentStatus>("PENDING");

  const [notasInternas, setNotasInternas] = useState("");

  const [mostrarReprogramar, setMostrarReprogramar] =
    useState(false);

  const [nuevaFecha, setNuevaFecha] = useState("");
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>(
    []
  );
  const [nuevaHora, setNuevaHora] = useState("");
  const [cargandoHoras, setCargandoHoras] = useState(false);

  const [historial, setHistorial] = useState<HistorialCita[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    if (!citaId) return;

    cargarCita();
  }, [citaId]);

  async function cargarCita() {
    setCargando(true);
    setError("");
    setMensaje("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    /*
     * Buscar negocios donde el usuario es miembro.
     */
    const { data: membresias, error: membresiasError } =
      await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id);

    if (membresiasError) {
      setError(membresiasError.message);
      setCargando(false);
      return;
    }

    const businessIds = (membresias || []).map(
      (item) => item.business_id
    );

    if (businessIds.length === 0) {
      setError("No se encontró un negocio asociado a su usuario.");
      setCargando(false);
      return;
    }

    /*
     * Buscar cita.
     */
    const { data: citaData, error: citaError } = await supabase
      .from("appointments")
      .select(`
        id,
        business_id,
        client_id,
        professional_id,
        start_at,
        end_at,
        status,
        source,
        subtotal,
        discount,
        tax,
        total,
        deposit_amount,
        customer_notes,
        internal_notes,
        created_at
      `)
      .eq("id", citaId)
      .in("business_id", businessIds)
      .maybeSingle();

    if (citaError) {
      setError(citaError.message);
      setCargando(false);
      return;
    }

    if (!citaData) {
      setError("No se encontró la cita.");
      setCargando(false);
      return;
    }

    setCita(citaData);
    setEstado(citaData.status);
    setNotasInternas(citaData.internal_notes || "");

    /*
     * Cliente.
     */
    const { data: clienteData } = await supabase
      .from("clients")
      .select(`
        id,
        first_name,
        last_name,
        phone,
        whatsapp,
        email,
        notes
      `)
      .eq("id", citaData.client_id)
      .eq("business_id", citaData.business_id)
      .maybeSingle();

    setCliente(clienteData || null);

    /*
     * Profesional.
     */
    if (citaData.professional_id) {
      const { data: profesionalData } = await supabase
        .from("professionals")
        .select(`
          id,
          name,
          specialty,
          phone,
          email
        `)
        .eq("id", citaData.professional_id)
        .eq("business_id", citaData.business_id)
        .maybeSingle();

      setProfesional(profesionalData || null);
    } else {
      setProfesional(null);
    }

    /*
     * Servicios asociados.
     */
    const { data: serviciosData, error: serviciosError } =
      await supabase
        .from("appointment_services")
        .select(`
          id,
          service_id,
          service_name_snapshot,
          price,
          duration_minutes
        `)
        .eq("appointment_id", citaData.id)
        .eq("business_id", citaData.business_id)
        .order("created_at");

    if (serviciosError) {
      console.error(serviciosError.message);
    }

    setServicios(serviciosData || []);

    await cargarHistorial(citaData.id, citaData.business_id);

    setCargando(false);
  }

  async function cargarHistorial(
    appointmentId: string,
    businessId: string
  ) {
    setCargandoHistorial(true);

    const { data, error } = await supabase
      .from("appointment_history")
      .select(`
        id,
        action,
        old_data,
        new_data,
        changed_by,
        created_at
      `)
      .eq("business_id", businessId)
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando historial:", error.message);
      setHistorial([]);
      setCargandoHistorial(false);
      return;
    }

    setHistorial((data || []) as HistorialCita[]);
    setCargandoHistorial(false);
  }

  async function registrarHistorial(
    action: string,
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null
  ) {
    if (!cita) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("appointment_history")
      .insert({
        business_id: cita.business_id,
        appointment_id: cita.id,
        action,
        old_data: oldData,
        new_data: newData,
        changed_by: user?.id || null,
      });

    if (error) {
      console.error("Error registrando historial:", error.message);
      return false;
    }

    await cargarHistorial(cita.id, cita.business_id);
    return true;
  }

  async function guardarCambios() {
    if (!cita) return;

    const notasNuevas = notasInternas.trim() || null;
    const cambioEstado = estado !== cita.status;
    const cambioNotas = notasNuevas !== cita.internal_notes;

    if (!cambioEstado && !cambioNotas) {
      setMensaje("No hay cambios pendientes por guardar.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    const estadoAnterior = cita.status;
    const notasAnteriores = cita.internal_notes;

    const { error } = await supabase
      .from("appointments")
      .update({
        status: estado,
        internal_notes: notasNuevas,
      })
      .eq("id", cita.id)
      .eq("business_id", cita.business_id);

    if (error) {
      setError(error.message);
      setGuardando(false);
      return;
    }

    const citaActualizada = {
      ...cita,
      status: estado,
      internal_notes: notasNuevas,
    };

    setCita(citaActualizada);

    if (cambioEstado) {
      await registrarHistorial(
        "STATUS_CHANGED",
        { status: estadoAnterior },
        { status: estado }
      );
    }

    if (cambioNotas) {
      await registrarHistorial(
        "NOTES_UPDATED",
        { internal_notes: notasAnteriores },
        { internal_notes: notasNuevas }
      );
    }

    setMensaje("Cambios guardados correctamente.");
    setGuardando(false);
  }

  async function cancelarCita() {
    if (!cita) return;

    if (cita.status === "COMPLETED") {
      setError("Una cita completada no puede cancelarse.");
      return;
    }

    const confirmar = window.confirm(
      "¿Está seguro de que desea cancelar esta cita?"
    );

    if (!confirmar) return;

    await cambiarEstadoCita(
      "CANCELLED",
      "La cita fue cancelada."
    );
  }

  async function marcarNoShow() {
    if (!cita) return;

    const confirmar = window.confirm(
      "¿Desea marcar que el cliente no se presentó?"
    );

    if (!confirmar) return;

    await cambiarEstadoCita(
      "NO_SHOW",
      "La cita fue marcada como no presentada."
    );
  }

  async function cambiarEstadoCita(
    nuevoEstado: AppointmentStatus,
    mensajeExito: string
  ) {
    if (!cita || cita.status === nuevoEstado) return;

    const estadoAnterior = cita.status;

    setGuardando(true);
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("appointments")
      .update({
        status: nuevoEstado,
      })
      .eq("id", cita.id)
      .eq("business_id", cita.business_id);

    if (error) {
      setError(error.message);
      setGuardando(false);
      return;
    }

    setEstado(nuevoEstado);
    setCita({
      ...cita,
      status: nuevoEstado,
    });

    const historialOk = await registrarHistorial(
      "STATUS_CHANGED",
      { status: estadoAnterior },
      { status: nuevoEstado }
    );

    setMensaje(
      historialOk
        ? mensajeExito
        : `${mensajeExito} No se pudo registrar la bitácora.`
    );

    setGuardando(false);
  }

  async function abrirReprogramacion() {
    if (!cita) return;

    const fechaActual = obtenerFechaInput(cita.start_at);

    setNuevaFecha(fechaActual);
    setNuevaHora("");
    setHorasDisponibles([]);
    setMostrarReprogramar(true);

    await cargarHorasReprogramacion(fechaActual);
  }

  async function cargarHorasReprogramacion(fechaTexto: string) {
    if (!cita || !cita.professional_id || !fechaTexto) return;

    setCargandoHoras(true);
    setNuevaHora("");
    setHorasDisponibles([]);
    setError("");

    const fechaReferencia = new Date(`${fechaTexto}T12:00:00`);
    const dayOfWeek = fechaReferencia.getDay();

    /*
     * Horario laboral del profesional.
     */
    const { data: workingHours, error: horasError } = await supabase
      .from("working_hours")
      .select(`
        start_time,
        end_time
      `)
      .eq("business_id", cita.business_id)
      .eq("professional_id", cita.professional_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .order("start_time");

    if (horasError) {
      setError(horasError.message);
      setCargandoHoras(false);
      return;
    }

    if (!workingHours || workingHours.length === 0) {
      setHorasDisponibles([]);
      setCargandoHoras(false);
      return;
    }

    const inicioDia = new Date(`${fechaTexto}T00:00:00`);
    const finDia = new Date(`${fechaTexto}T23:59:59.999`);

    /*
     * Otras citas del profesional.
     * Excluimos la cita que estamos editando.
     */
    const { data: citasDia, error: citasError } = await supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        end_at,
        status
      `)
      .eq("business_id", cita.business_id)
      .eq("professional_id", cita.professional_id)
      .gte("start_at", inicioDia.toISOString())
      .lte("start_at", finDia.toISOString())
      .neq("id", cita.id);

    if (citasError) {
      setError(citasError.message);
      setCargandoHoras(false);
      return;
    }

    const citasBloqueantes = (citasDia || []).filter(
      (item) =>
        item.status !== "CANCELLED" &&
        item.status !== "NO_SHOW"
    );

    const { data: bloqueosDia, error: bloqueosError } = await supabase
      .from("blocked_times")
      .select("id, start_at, end_at")
      .eq("business_id", cita.business_id)
      .eq("professional_id", cita.professional_id)
      .lt("start_at", finDia.toISOString())
      .gt("end_at", inicioDia.toISOString());

    if (bloqueosError) {
      setError(bloqueosError.message);
      setCargandoHoras(false);
      return;
    }

    const duracion = duracionTotal;

    const disponibles: string[] = [];

    for (const bloque of workingHours as Horario[]) {
      const inicioMinutos = minutosDesdeHora(
        bloque.start_time.slice(0, 5)
      );

      const finMinutos = minutosDesdeHora(
        bloque.end_time.slice(0, 5)
      );

      for (
        let minuto = inicioMinutos;
        minuto + duracion <= finMinutos;
        minuto += 15
      ) {
        const hora = horaDesdeMinutos(minuto);

        const inicioCandidato = new Date(
          `${fechaTexto}T${hora}:00`
        );

        const finCandidato = new Date(
          inicioCandidato.getTime() + duracion * 60 * 1000
        );

        const existeChoque = citasBloqueantes.some((otraCita) => {
          const inicioOtra = new Date(otraCita.start_at);
          const finOtra = new Date(otraCita.end_at);

          return (
            inicioCandidato < finOtra &&
            finCandidato > inicioOtra
          );
        });

        const existeBloqueo = (bloqueosDia || []).some((bloqueo) => {
          const inicioBloqueo = new Date(bloqueo.start_at);
          const finBloqueo = new Date(bloqueo.end_at);

          return (
            inicioCandidato < finBloqueo &&
            finCandidato > inicioBloqueo
          );
        });

        if (!existeChoque && !existeBloqueo) {
          disponibles.push(hora);
        }
      }
    }

    setHorasDisponibles(disponibles);
    setCargandoHoras(false);
  }

  async function reprogramarCita() {
    if (
      !cita ||
      !cita.professional_id ||
      !nuevaFecha ||
      !nuevaHora
    ) {
      setError("Seleccione una fecha y una hora.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    const inicioNuevo = new Date(
      `${nuevaFecha}T${nuevaHora}:00`
    );

    const finNuevo = new Date(
      inicioNuevo.getTime() + duracionTotal * 60 * 1000
    );

    /*
     * Última comprobación antes de modificar.
     */
    const { data: conflictos, error: conflictoError } =
      await supabase
        .from("appointments")
        .select("id, status")
        .eq("business_id", cita.business_id)
        .eq("professional_id", cita.professional_id)
        .neq("id", cita.id)
        .lt("start_at", finNuevo.toISOString())
        .gt("end_at", inicioNuevo.toISOString());

    if (conflictoError) {
      setError(conflictoError.message);
      setGuardando(false);
      return;
    }

    const ocupado = (conflictos || []).some(
      (item) =>
        item.status !== "CANCELLED" &&
        item.status !== "NO_SHOW"
    );

    if (ocupado) {
      setError(
        "Ese horario acaba de ser ocupado. Seleccione otro horario."
      );

      await cargarHorasReprogramacion(nuevaFecha);

      setGuardando(false);
      return;
    }

    const { data: bloqueos, error: bloqueoError } = await supabase
      .from("blocked_times")
      .select("id")
      .eq("business_id", cita.business_id)
      .eq("professional_id", cita.professional_id)
      .lt("start_at", finNuevo.toISOString())
      .gt("end_at", inicioNuevo.toISOString());

    if (bloqueoError) {
      setError(bloqueoError.message);
      setGuardando(false);
      return;
    }

    if ((bloqueos || []).length > 0) {
      setError(
        "Ese horario coincide con un bloqueo o excepción del profesional."
      );
      await cargarHorasReprogramacion(nuevaFecha);
      setGuardando(false);
      return;
    }

    const inicioAnterior = cita.start_at;
    const finAnterior = cita.end_at;

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        start_at: inicioNuevo.toISOString(),
        end_at: finNuevo.toISOString(),
      })
      .eq("id", cita.id)
      .eq("business_id", cita.business_id);

    if (updateError) {
      setError(updateError.message);
      setGuardando(false);
      return;
    }

    setCita({
      ...cita,
      start_at: inicioNuevo.toISOString(),
      end_at: finNuevo.toISOString(),
    });

    await registrarHistorial(
      "RESCHEDULED",
      {
        start_at: inicioAnterior,
        end_at: finAnterior,
      },
      {
        start_at: inicioNuevo.toISOString(),
        end_at: finNuevo.toISOString(),
      }
    );

    setMostrarReprogramar(false);

    setMensaje("Cita reprogramada correctamente.");

    setGuardando(false);
  }

  const nombreCliente = useMemo(() => {
    if (!cliente) return "Cliente";

    return [cliente.first_name, cliente.last_name]
      .filter(Boolean)
      .join(" ");
  }, [cliente]);

  const duracionTotal = useMemo(() => {
    if (servicios.length > 0) {
      return servicios.reduce(
        (total, servicio) =>
          total + Number(servicio.duration_minutes || 0),
        0
      );
    }

    if (!cita) return 0;

    const inicio = new Date(cita.start_at).getTime();
    const fin = new Date(cita.end_at).getTime();

    return Math.round((fin - inicio) / 60000);
  }, [servicios, cita]);

  const precioServicios = useMemo(() => {
    return servicios.reduce(
      (total, servicio) =>
        total + Number(servicio.price || 0),
      0
    );
  }, [servicios]);

  if (cargando) {
    return (
      <main style={styles.centroPantalla}>
        Cargando cita...
      </main>
    );
  }

  if (error && !cita) {
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

          <div style={styles.error}>
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!cita) return null;

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

        <div style={styles.encabezado}>
          <div>
            <p style={styles.marca}>CitaTica</p>

            <h1 style={styles.titulo}>
              Detalle de la cita
            </h1>

            <p style={styles.subtitulo}>
              Administre la reserva, el estado y la información
              del cliente.
            </p>
          </div>

          <EstadoBadge estado={estado} />
        </div>

        {mensaje && (
          <div style={styles.mensaje}>
            {mensaje}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.gridPrincipal}>
          <div>
            {/* INFORMACIÓN PRINCIPAL */}

            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Información de la cita
              </h2>

              <div style={styles.detalleGrid}>
                <Dato
                  etiqueta="Fecha"
                  valor={formatearFecha(cita.start_at)}
                />

                <Dato
                  etiqueta="Hora"
                  valor={`${formatearHora(
                    cita.start_at
                  )} - ${formatearHora(cita.end_at)}`}
                />

                <Dato
                  etiqueta="Duración"
                  valor={`${duracionTotal} minutos`}
                />

                <Dato
                  etiqueta="Profesional"
                  valor={profesional?.name || "Sin asignar"}
                />

                <Dato
                  etiqueta="Origen"
                  valor={traducirOrigen(cita.source)}
                />

                <Dato
                  etiqueta="Total"
                  valor={formatearColones(
                    Number(cita.total || precioServicios)
                  )}
                />
              </div>

              {servicios.length > 0 && (
                <>
                  <div style={styles.separador} />

                  <h3 style={styles.subtituloSeccion}>
                    Servicios
                  </h3>

                  <div style={styles.listaServicios}>
                    {servicios.map((servicio) => (
                      <div
                        key={servicio.id}
                        style={styles.servicioFila}
                      >
                        <div>
                          <strong>
                            {servicio.service_name_snapshot}
                          </strong>

                          <div style={styles.secundario}>
                            {servicio.duration_minutes} minutos
                          </div>
                        </div>

                        <strong>
                          {formatearColones(
                            Number(servicio.price)
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {cita.customer_notes && (
                <>
                  <div style={styles.separador} />

                  <h3 style={styles.subtituloSeccion}>
                    Notas del cliente
                  </h3>

                  <p style={styles.notaCliente}>
                    {cita.customer_notes}
                  </p>
                </>
              )}
            </section>

            {/* CLIENTE */}

            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Cliente
              </h2>

              <div style={styles.clienteNombre}>
                {nombreCliente}
              </div>

              <div style={styles.detalleGrid}>
                <Dato
                  etiqueta="Teléfono"
                  valor={cliente?.phone || "No indicado"}
                />

                <Dato
                  etiqueta="WhatsApp"
                  valor={cliente?.whatsapp || "No indicado"}
                />

                <Dato
                  etiqueta="Correo"
                  valor={cliente?.email || "No indicado"}
                />
              </div>

              <div style={styles.accionesContacto}>
                {cliente?.phone && (
                  <a
                    href={`tel:${limpiarTelefono(cliente.phone)}`}
                    style={styles.botonSecundario}
                  >
                    ☎ Llamar
                  </a>
                )}

                {(cliente?.whatsapp || cliente?.phone) && (
                  <a
                    href={crearEnlaceWhatsApp(
                      cliente?.whatsapp || cliente?.phone || ""
                    )}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.botonWhatsApp}
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </section>

            {/* NOTAS INTERNAS */}

            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Notas internas
              </h2>

              <p style={styles.secundario}>
                Estas notas son privadas y no las ve el cliente.
              </p>

              <textarea
                value={notasInternas}
                onChange={(e) =>
                  setNotasInternas(e.target.value)
                }
                placeholder="Agregue información interna sobre esta cita..."
                style={styles.textarea}
              />
            </section>

            {/* HISTORIAL */}

            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitulo}>
                    Historial de la cita
                  </h2>

                  <p style={styles.secundario}>
                    Bitácora de cambios de estado, notas y reprogramaciones.
                  </p>
                </div>
              </div>

              {cargandoHistorial ? (
                <div style={styles.vacio}>
                  Cargando historial...
                </div>
              ) : historial.length === 0 ? (
                <div style={styles.vacio}>
                  Todavía no hay movimientos registrados.
                </div>
              ) : (
                <div style={styles.historialLista}>
                  {historial.map((item) => (
                    <div
                      key={item.id}
                      style={styles.historialFila}
                    >
                      <div style={styles.historialPunto} />

                      <div style={{ flex: 1 }}>
                        <div style={styles.historialEncabezado}>
                          <strong>
                            {traducirAccionHistorial(item.action)}
                          </strong>

                          <span style={styles.historialFecha}>
                            {formatearFechaHora(item.created_at)}
                          </span>
                        </div>

                        <div style={styles.historialDetalle}>
                          {describirHistorial(item)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* REPROGRAMACIÓN */}

            {mostrarReprogramar && (
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.cardTitulo}>
                      Reprogramar cita
                    </h2>

                    <p style={styles.secundario}>
                      Seleccione una nueva fecha y un horario
                      disponible.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarReprogramar(false)
                    }
                    style={styles.botonSecundario}
                  >
                    Cerrar
                  </button>
                </div>

                <label style={styles.label}>
                  Nueva fecha
                </label>

                <input
                  type="date"
                  value={nuevaFecha}
                  min={fechaHoyInput()}
                  onChange={async (e) => {
                    const valor = e.target.value;

                    setNuevaFecha(valor);

                    await cargarHorasReprogramacion(valor);
                  }}
                  style={styles.input}
                />

                <div style={{ marginTop: "24px" }}>
                  <label style={styles.label}>
                    Hora disponible
                  </label>

                  {cargandoHoras ? (
                    <div style={styles.vacio}>
                      Calculando disponibilidad...
                    </div>
                  ) : horasDisponibles.length === 0 ? (
                    <div style={styles.vacio}>
                      No hay horarios disponibles para esta fecha.
                    </div>
                  ) : (
                    <div style={styles.horasGrid}>
                      {horasDisponibles.map((hora) => {
                        const seleccionado =
                          nuevaHora === hora;

                        return (
                          <button
                            key={hora}
                            type="button"
                            onClick={() =>
                              setNuevaHora(hora)
                            }
                            style={{
                              ...styles.horaBoton,
                              ...(seleccionado
                                ? styles.horaSeleccionada
                                : {}),
                            }}
                          >
                            {horaAMPM(hora)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {nuevaHora && (
                  <div style={styles.resumenReprogramacion}>
                    Nueva cita:{" "}
                    <strong>
                      {formatearFechaDesdeTexto(nuevaFecha)}
                    </strong>{" "}
                    a las{" "}
                    <strong>{horaAMPM(nuevaHora)}</strong>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!nuevaHora || guardando}
                  onClick={reprogramarCita}
                  style={{
                    ...styles.botonPrincipal,
                    opacity: !nuevaHora || guardando ? 0.6 : 1,
                  }}
                >
                  {guardando
                    ? "Guardando..."
                    : "Confirmar reprogramación"}
                </button>
              </section>
            )}
          </div>

          {/* COLUMNA DERECHA */}

          <aside>
            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Estado
              </h2>

              <EstadoBadge estado={cita.status} />

              <p style={styles.secundario}>
                Use las acciones de abajo para avanzar la cita por su flujo normal.
              </p>

              {!esEstadoFinal(cita.status) && (
                <div style={{ marginTop: "18px" }}>
                  {obtenerSiguienteEstado(cita.status) && (
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => {
                        const siguiente = obtenerSiguienteEstado(cita.status);
                        if (!siguiente) return;

                        cambiarEstadoCita(
                          siguiente.estado,
                          siguiente.mensaje
                        );
                      }}
                      style={styles.botonPrincipal}
                    >
                      {guardando
                        ? "Guardando..."
                        : obtenerSiguienteEstado(cita.status)?.texto}
                    </button>
                  )}
                </div>
              )}

              {esEstadoFinal(cita.status) && (
                <div style={styles.estadoFinalBox}>
                  Esta cita ya se encuentra cerrada.
                </div>
              )}
            </section>

            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Acciones
              </h2>

              <button
                type="button"
                onClick={abrirReprogramacion}
                disabled={esEstadoFinal(cita.status) || guardando}
                style={{
                  ...styles.botonAccion,
                  opacity: esEstadoFinal(cita.status) || guardando ? 0.5 : 1,
                }}
              >
                📅 Reprogramar
              </button>

              <button
                type="button"
                onClick={marcarNoShow}
                disabled={esEstadoFinal(cita.status) || guardando}
                style={{
                  ...styles.botonAccion,
                  opacity: esEstadoFinal(cita.status) || guardando ? 0.5 : 1,
                }}
              >
                Cliente no se presentó
              </button>

              <button
                type="button"
                onClick={cancelarCita}
                disabled={esEstadoFinal(cita.status) || guardando}
                style={{
                  ...styles.botonCancelar,
                  opacity: esEstadoFinal(cita.status) || guardando ? 0.5 : 1,
                }}
              >
                Cancelar cita
              </button>
            </section>

            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Ajuste manual
              </h2>

              <p style={styles.secundario}>
                Úselo solo si necesita corregir un estado o las notas internas manualmente.
              </p>

              <label style={styles.label}>
                Estado de la cita
              </label>

              <select
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value as AppointmentStatus
                  )
                }
                style={styles.input}
              >
                {ESTADOS.map((item) => (
                  <option
                    key={item.valor}
                    value={item.valor}
                  >
                    {item.texto}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={guardarCambios}
                disabled={guardando}
                style={styles.botonPrincipal}
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar ajuste manual"}
              </button>
            </section>

            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Profesional
              </h2>

              <strong>
                {profesional?.name || "Sin asignar"}
              </strong>

              {profesional?.specialty && (
                <p style={styles.secundario}>
                  {profesional.specialty}
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );

}

function obtenerSiguienteEstado(estado: AppointmentStatus) {
  const flujo: Partial<
    Record<
      AppointmentStatus,
      {
        estado: AppointmentStatus;
        texto: string;
        mensaje: string;
      }
    >
  > = {
    PENDING: {
      estado: "CONFIRMED",
      texto: "✓ Confirmar cita",
      mensaje: "Cita confirmada correctamente.",
    },
    CONFIRMED: {
      estado: "CHECKED_IN",
      texto: "Cliente llegó",
      mensaje: "Se registró la llegada del cliente.",
    },
    CHECKED_IN: {
      estado: "IN_PROGRESS",
      texto: "▶ Iniciar atención",
      mensaje: "La cita está ahora en atención.",
    },
    IN_PROGRESS: {
      estado: "COMPLETED",
      texto: "✓ Completar cita",
      mensaje: "Cita completada correctamente.",
    },
  };

  return flujo[estado] || null;
}

function esEstadoFinal(estado: AppointmentStatus) {
  return (
    estado === "COMPLETED" ||
    estado === "CANCELLED" ||
    estado === "NO_SHOW"
  );
}

function traducirAccionHistorial(action: string) {
  const acciones: Record<string, string> = {
    STATUS_CHANGED: "Cambio de estado",
    NOTES_UPDATED: "Notas internas actualizadas",
    RESCHEDULED: "Cita reprogramada",
    CREATED: "Cita creada",
  };

  return acciones[action] || action;
}

function describirHistorial(item: HistorialCita) {
  const anterior = item.old_data || {};
  const nuevo = item.new_data || {};

  if (item.action === "STATUS_CHANGED") {
    const estadoAnterior = String(anterior.status || "");
    const estadoNuevo = String(nuevo.status || "");

    return `${traducirEstado(estadoAnterior)} → ${traducirEstado(estadoNuevo)}`;
  }

  if (item.action === "RESCHEDULED") {
    const inicioAnterior = anterior.start_at
      ? formatearFechaHora(String(anterior.start_at))
      : "Fecha anterior no disponible";

    const inicioNuevo = nuevo.start_at
      ? formatearFechaHora(String(nuevo.start_at))
      : "Fecha nueva no disponible";

    return `${inicioAnterior} → ${inicioNuevo}`;
  }

  if (item.action === "NOTES_UPDATED") {
    return "Se modificaron las notas internas de la cita.";
  }

  return "Movimiento registrado en la cita.";
}

function traducirEstado(estado: string) {
  const estados: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    CHECKED_IN: "Cliente llegó",
    IN_PROGRESS: "En progreso",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    NO_SHOW: "No se presentó",
  };

  return estados[estado] || estado || "Sin estado";
}

function formatearFechaHora(fechaISO: string) {
  return new Date(fechaISO).toLocaleString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function EstadoBadge({
  estado,
}: {
  estado: AppointmentStatus;
}) {
  const configuracion: Record<
    AppointmentStatus,
    {
      texto: string;
      background: string;
      color: string;
    }
  > = {
    PENDING: {
      texto: "Pendiente",
      background: "#f2f4f7",
      color: "#344054",
    },

    CONFIRMED: {
      texto: "Confirmada",
      background: "#ecfdf3",
      color: "#067647",
    },

    CHECKED_IN: {
      texto: "Cliente llegó",
      background: "#eff8ff",
      color: "#175cd3",
    },

    IN_PROGRESS: {
      texto: "En progreso",
      background: "#fff6ed",
      color: "#b54708",
    },

    COMPLETED: {
      texto: "Completada",
      background: "#ecfdf3",
      color: "#067647",
    },

    CANCELLED: {
      texto: "Cancelada",
      background: "#fef3f2",
      color: "#b42318",
    },

    NO_SHOW: {
      texto: "No se presentó",
      background: "#fef3f2",
      color: "#b42318",
    },
  };

  const item = configuracion[estado];

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "8px 13px",
        borderRadius: "999px",
        fontSize: "14px",
        fontWeight: 700,
        background: item.background,
        color: item.color,
      }}
    >
      {item.texto}
    </span>
  );
}

function Dato({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div>
      <div style={styles.datoEtiqueta}>
        {etiqueta}
      </div>

      <div style={styles.datoValor}>
        {valor}
      </div>
    </div>
  );
}

function formatearFecha(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatearFechaDesdeTexto(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString(
    "es-CR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatearHora(fechaISO: string) {
  return new Date(fechaISO).toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function horaAMPM(hora: string) {
  const [h, m] = hora.split(":").map(Number);

  const fecha = new Date();
  fecha.setHours(h, m, 0, 0);

  return fecha.toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function minutosDesdeHora(hora: string) {
  const [horas, minutos] = hora.split(":").map(Number);

  return horas * 60 + minutos;
}

function horaDesdeMinutos(total: number) {
  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  return `${String(horas).padStart(2, "0")}:${String(
    minutos
  ).padStart(2, "0")}`;
}

function fechaHoyInput() {
  const ahora = new Date();

  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function obtenerFechaInput(fechaISO: string) {
  const fecha = new Date(fechaISO);

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearColones(valor: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor);
}

function traducirOrigen(source: string) {
  const origenes: Record<string, string> = {
    PUBLIC_BOOKING: "Reserva en línea",
    STAFF: "Personal",
    ADMIN: "Administración",
    IMPORT: "Importada",
  };

  return origenes[source] || source;
}

function limpiarTelefono(numero: string) {
  return numero.replace(/[^\d+]/g, "");
}

function crearEnlaceWhatsApp(numero: string) {
  let telefono = numero.replace(/\D/g, "");

  if (telefono.length === 8) {
    telefono = `506${telefono}`;
  }

  return `https://wa.me/${telefono}`;
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#667085",
  },

  contenedor: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  volver: {
    border: "none",
    background: "transparent",
    padding: 0,
    marginBottom: "25px",
    color: "#667085",
    fontSize: "15px",
    cursor: "pointer",
  },

  encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "25px",
    marginBottom: "30px",
  },

  marca: {
    margin: "0 0 6px",
    color: "#667085",
    fontSize: "14px",
  },

  titulo: {
    margin: 0,
    fontSize: "36px",
  },

  subtitulo: {
    color: "#667085",
    margin: "10px 0 0",
    lineHeight: 1.5,
  },

  gridPrincipal: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
    gap: "24px",
    alignItems: "start",
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "27px",
    marginBottom: "22px",
    boxShadow: "0 6px 22px rgba(16,24,40,0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
  },

  cardTitulo: {
    margin: "0 0 18px",
    fontSize: "22px",
  },

  subtituloSeccion: {
    margin: "0 0 14px",
    fontSize: "16px",
  },

  detalleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "22px",
  },

  datoEtiqueta: {
    fontSize: "13px",
    color: "#667085",
    marginBottom: "5px",
  },

  datoValor: {
    fontWeight: 700,
    lineHeight: 1.4,
  },

  separador: {
    height: "1px",
    background: "#eaecf0",
    margin: "25px 0",
  },

  listaServicios: {
    display: "grid",
    gap: "10px",
  },

  servicioFila: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "13px 0",
    borderBottom: "1px solid #f2f4f7",
  },

  secundario: {
    color: "#667085",
    fontSize: "14px",
    lineHeight: 1.5,
    marginTop: "5px",
  },

  notaCliente: {
    margin: 0,
    color: "#475467",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },

  clienteNombre: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "22px",
  },

  accionesContacto: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "25px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "14px",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    fontSize: "15px",
    background: "#ffffff",
    marginBottom: "16px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "130px",
    padding: "13px",
    border: "1px solid #d0d5dd",
    borderRadius: "10px",
    fontSize: "15px",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
    marginTop: "16px",
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
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#101828",
    padding: "11px 15px",
    textDecoration: "none",
    fontWeight: 600,
    cursor: "pointer",
  },

  botonWhatsApp: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #abefc6",
    borderRadius: "9px",
    background: "#ecfdf3",
    color: "#067647",
    padding: "11px 15px",
    textDecoration: "none",
    fontWeight: 700,
  },

  botonAccion: {
    width: "100%",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#101828",
    padding: "12px 15px",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "10px",
  },

  botonCancelar: {
    width: "100%",
    border: "1px solid #fecdca",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#b42318",
    padding: "12px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  mensaje: {
    background: "#ecfdf3",
    border: "1px solid #abefc6",
    color: "#067647",
    padding: "14px 17px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  error: {
    background: "#fef3f2",
    border: "1px solid #fecdca",
    color: "#b42318",
    padding: "14px 17px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  horasGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  horaBoton: {
    padding: "11px 15px",
    borderRadius: "9px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#d0d5dd",
    background: "#ffffff",
    color: "#101828",
    cursor: "pointer",
    fontWeight: 600,
  },

  horaSeleccionada: {
    background: "#101828",
    color: "#ffffff",
    borderColor: "#101828",
  },

  vacio: {
    background: "#f9fafb",
    border: "1px dashed #d0d5dd",
    borderRadius: "10px",
    padding: "25px",
    color: "#667085",
    textAlign: "center",
  },

  historialLista: {
    display: "grid",
    gap: "0",
  },

  historialFila: {
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
    padding: "14px 0",
    borderBottom: "1px solid #f2f4f7",
  },

  historialPunto: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#175cd3",
    marginTop: "5px",
    flexShrink: 0,
  },

  historialEncabezado: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    alignItems: "flex-start",
  },

  historialFecha: {
    color: "#98a2b3",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  historialDetalle: {
    color: "#667085",
    fontSize: "13px",
    lineHeight: 1.5,
    marginTop: "5px",
  },

  estadoFinalBox: {
    marginTop: "16px",
    background: "#f9fafb",
    borderRadius: "10px",
    padding: "13px",
    color: "#667085",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  resumenReprogramacion: {
    marginTop: "20px",
    background: "#f9fafb",
    borderRadius: "10px",
    padding: "15px",
    color: "#475467",
  },
};