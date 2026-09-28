"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Cliente = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
};

type Profesional = {
  id: string;
  name: string;
  specialty: string | null;
  booking_enabled: boolean;
  is_active: boolean;
};

type ServicioProfesional = {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number;
  custom_price: number | null;
  custom_duration_minutes: number | null;
};

type CitaServicio = {
  id: string;
  service_name_snapshot: string;
  price: number;
  duration_minutes: number;
};

type Cita = {
  id: string;
  client_id: string;
  professional_id: string | null;
  start_at: string;
  end_at: string;
  status: string;
  source: string;
  total: number;
  customer_notes: string | null;

  clients:
    | {
        id: string;
        first_name: string;
        last_name: string | null;
        phone: string | null;
      }
    | {
        id: string;
        first_name: string;
        last_name: string | null;
        phone: string | null;
      }[]
    | null;

  professionals:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;

  appointment_services?: CitaServicio[];
};

type HorarioDisponible = {
  hora: string;
  etiqueta: string;
};

function fechaHoyLocal() {
  const ahora = new Date();

  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fechaLocalDesdeDate(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function horaAMPM(fecha: Date) {
  return fecha.toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function horaAMPMDesdeTexto(hora: string) {
  const [horas, minutos] = hora.split(":").map(Number);

  const fecha = new Date();
  fecha.setHours(horas, minutos, 0, 0);

  return horaAMPM(fecha);
}

function moneda(valor: number | null | undefined) {
  return `₡${Number(valor || 0).toLocaleString("es-CR")}`;
}

function minutosDesdeHora(hora: string) {
  const [h, m] = hora.split(":").map(Number);

  return h * 60 + m;
}

function horaDesdeMinutos(total: number) {
  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  return `${String(horas).padStart(2, "0")}:${String(
    minutos
  ).padStart(2, "0")}`;
}

export default function AgendaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clienteParametro = searchParams.get("cliente");

  const [businessId, setBusinessId] = useState("");

  const [fecha, setFecha] = useState(fechaHoyLocal());

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [modoCliente, setModoCliente] =
    useState<"existente" | "nuevo">("existente");

  const [clienteId, setClienteId] = useState("");

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoApellido, setNuevoApellido] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoWhatsapp, setNuevoWhatsapp] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");

  const [professionalId, setProfessionalId] = useState("");
  const [serviciosProfesional, setServiciosProfesional] = useState<
    ServicioProfesional[]
  >([]);

  const [serviceId, setServiceId] = useState("");

  const [horariosDisponibles, setHorariosDisponibles] = useState<
    HorarioDisponible[]
  >([]);

  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [notas, setNotas] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [cargandoDisponibilidad, setCargandoDisponibilidad] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const servicioSeleccionado =
    serviciosProfesional.find(
      (servicio) => servicio.id === serviceId
    ) || null;

  const precioServicio = servicioSeleccionado
    ? servicioSeleccionado.custom_price ??
      servicioSeleccionado.price ??
      0
    : 0;

  const duracionServicio = servicioSeleccionado
    ? servicioSeleccionado.custom_duration_minutes ??
      servicioSeleccionado.duration_minutes
    : 0;

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (!businessId) return;

    cargarCitasDelDia();
  }, [businessId, fecha]);

  useEffect(() => {
    setServiceId("");
    setHoraSeleccionada("");
    setHorariosDisponibles([]);

    if (!businessId || !professionalId) {
      setServiciosProfesional([]);
      return;
    }

    cargarServiciosProfesional();
  }, [businessId, professionalId]);

  useEffect(() => {
    setHoraSeleccionada("");
    setHorariosDisponibles([]);

    if (
      !businessId ||
      !professionalId ||
      !serviceId ||
      duracionServicio <= 0
    ) {
      return;
    }

    cargarDisponibilidad();
  }, [
    businessId,
    professionalId,
    serviceId,
    fecha,
    duracionServicio,
  ]);

  async function cargarBase() {
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
          "No se encontró un negocio asociado al usuario."
      );

      setCargando(false);
      return;
    }

    const idNegocio = miembro.business_id;

    setBusinessId(idNegocio);

    const [listaClientes] = await Promise.all([
      cargarClientes(idNegocio),
      cargarProfesionales(idNegocio),
    ]);

    /*
      Si llegamos desde Clientes con:
      /panel/agenda?cliente=UUID

      abrimos automáticamente el formulario
      y seleccionamos ese cliente.
    */
    if (clienteParametro) {
      const clienteEncontrado = listaClientes.find(
        (cliente) => cliente.id === clienteParametro
      );

      if (clienteEncontrado) {
        setModoCliente("existente");
        setClienteId(clienteEncontrado.id);
        setMostrarFormulario(true);
      } else {
        setError(
          "El cliente indicado no pertenece a este negocio o ya no existe."
        );
      }
    } else if (listaClientes.length === 0) {
      /*
        Si el negocio todavía no tiene clientes,
        dejamos preparado el formulario para crear uno nuevo.
      */
      setModoCliente("nuevo");
    }

    setCargando(false);
  }

  async function cargarClientes(
    idNegocio: string
  ): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        id,
        first_name,
        last_name,
        phone,
        whatsapp,
        email
      `)
      .eq("business_id", idNegocio)
      .order("first_name", { ascending: true });

    if (error) {
      setError(error.message);
      return [];
    }

    const lista = data || [];

    setClientes(lista);

    return lista;
  }

  async function cargarProfesionales(idNegocio: string) {
    const { data, error } = await supabase
      .from("professionals")
      .select(`
        id,
        name,
        specialty,
        booking_enabled,
        is_active
      `)
      .eq("business_id", idNegocio)
      .eq("is_active", true)
      .eq("booking_enabled", true)
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setProfesionales(data || []);
  }

  async function cargarCitasDelDia() {
    if (!businessId) return;

    const inicio = new Date(`${fecha}T00:00:00`);
    const fin = new Date(`${fecha}T23:59:59.999`);

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        client_id,
        professional_id,
        start_at,
        end_at,
        status,
        source,
        total,
        customer_notes,
        clients (
          id,
          first_name,
          last_name,
          phone
        ),
        professionals (
          id,
          name
        ),
        appointment_services (
          id,
          service_name_snapshot,
          price,
          duration_minutes
        )
      `)
      .eq("business_id", businessId)
      .gte("start_at", inicio.toISOString())
      .lte("start_at", fin.toISOString())
      .order("start_at", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setCitas((data || []) as Cita[]);
  }

  async function cargarServiciosProfesional() {
    const { data, error } = await supabase
      .from("professional_services")
      .select(`
        service_id,
        custom_price,
        custom_duration_minutes,
        services (
          id,
          name,
          price,
          duration_minutes,
          is_active
        )
      `)
      .eq("business_id", businessId)
      .eq("professional_id", professionalId)
      .eq("is_active", true);

    if (error) {
      setError(error.message);
      return;
    }

    const lista: ServicioProfesional[] = [];

    for (const relacion of data || []) {
      const raw = relacion.services;

      const servicio = Array.isArray(raw)
        ? raw[0]
        : raw;

      if (!servicio || !servicio.is_active) continue;

      lista.push({
        id: servicio.id,
        name: servicio.name,
        price: servicio.price,
        duration_minutes: servicio.duration_minutes,
        custom_price: relacion.custom_price,
        custom_duration_minutes:
          relacion.custom_duration_minutes,
      });
    }

    lista.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setServiciosProfesional(lista);
  }

  async function cargarDisponibilidad() {
    if (
      !professionalId ||
      !serviceId ||
      !businessId ||
      duracionServicio <= 0
    ) {
      return;
    }

    setCargandoDisponibilidad(true);
    setError("");

    const fechaReferencia = new Date(`${fecha}T12:00:00`);
    const dayOfWeek = fechaReferencia.getDay();

    const { data: horarios, error: horarioError } =
      await supabase
        .from("working_hours")
        .select(`
          start_time,
          end_time,
          is_active
        `)
        .eq("business_id", businessId)
        .eq("professional_id", professionalId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .order("start_time", { ascending: true });

    if (horarioError) {
      setError(horarioError.message);
      setCargandoDisponibilidad(false);
      return;
    }

    if (!horarios || horarios.length === 0) {
      setHorariosDisponibles([]);
      setCargandoDisponibilidad(false);
      return;
    }

    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(`${fecha}T23:59:59.999`);

    const { data: citasProfesional, error: citasError } =
      await supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          end_at,
          status
        `)
        .eq("business_id", businessId)
        .eq("professional_id", professionalId)
        .gte("start_at", inicioDia.toISOString())
        .lte("start_at", finDia.toISOString());

    if (citasError) {
      setError(citasError.message);
      setCargandoDisponibilidad(false);
      return;
    }

    const citasQueBloquean = (citasProfesional || []).filter(
      (cita) =>
        cita.status !== "CANCELLED" &&
        cita.status !== "NO_SHOW"
    );

    const slots: HorarioDisponible[] = [];

    for (const horario of horarios) {
      const inicioMinutos = minutosDesdeHora(
        horario.start_time.slice(0, 5)
      );

      const finMinutos = minutosDesdeHora(
        horario.end_time.slice(0, 5)
      );

      /*
        CitaTica ofrece intervalos cada 15 minutos.
      */
      for (
        let minuto = inicioMinutos;
        minuto + duracionServicio <= finMinutos;
        minuto += 15
      ) {
        const horaTexto = horaDesdeMinutos(minuto);

        const inicioCandidato = new Date(
          `${fecha}T${horaTexto}:00`
        );

        const finCandidato = new Date(
          inicioCandidato.getTime() +
            duracionServicio * 60 * 1000
        );

        /*
          Si estamos viendo hoy, no mostramos
          horas que ya pasaron.
        */
        if (inicioCandidato.getTime() <= Date.now()) {
          continue;
        }

        const tieneChoque = citasQueBloquean.some(
          (cita) => {
            const inicioExistente = new Date(
              cita.start_at
            );

            const finExistente = new Date(
              cita.end_at
            );

            return (
              inicioCandidato < finExistente &&
              finCandidato > inicioExistente
            );
          }
        );

        if (!tieneChoque) {
          slots.push({
            hora: horaTexto,
            etiqueta:
              horaAMPMDesdeTexto(horaTexto),
          });
        }
      }
    }

    setHorariosDisponibles(slots);
    setCargandoDisponibilidad(false);
  }

  async function crearClienteNuevo() {
    if (!nuevoNombre.trim()) {
      throw new Error(
        "Ingrese el nombre del cliente."
      );
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        business_id: businessId,
        first_name: nuevoNombre.trim(),
        last_name: nuevoApellido.trim() || null,
        phone: nuevoTelefono.trim() || null,
        whatsapp: nuevoWhatsapp.trim() || null,
        email: nuevoEmail.trim() || null,
        birth_date: null,
        notes: null,
        marketing_consent: false,
        privacy_consent: false,
        privacy_consent_at: null,
      })
      .select(`
        id,
        first_name,
        last_name,
        phone,
        whatsapp,
        email
      `)
      .single();

    if (error || !data) {
      throw new Error(
        error?.message ||
          "No se pudo crear el cliente."
      );
    }

    setClientes((actuales) =>
      [...actuales, data].sort((a, b) =>
        a.first_name.localeCompare(b.first_name)
      )
    );

    return data.id;
  }

  async function crearCita(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!businessId) {
      setError("No se encontró el negocio.");
      return;
    }

    if (!professionalId) {
      setError("Seleccione un profesional.");
      return;
    }

    if (!servicioSeleccionado) {
      setError("Seleccione un servicio.");
      return;
    }

    if (!horaSeleccionada) {
      setError(
        "Seleccione una hora disponible."
      );
      return;
    }

    if (
      modoCliente === "existente" &&
      !clienteId
    ) {
      setError("Seleccione un cliente.");
      return;
    }

    setGuardando(true);

    try {
      let clienteFinalId = clienteId;

      if (modoCliente === "nuevo") {
        clienteFinalId =
          await crearClienteNuevo();
      }

      const startAt = new Date(
        `${fecha}T${horaSeleccionada}:00`
      );

      const endAt = new Date(
        startAt.getTime() +
          duracionServicio * 60 * 1000
      );

      /*
        Segunda validación justo antes de guardar,
        para evitar reservas simultáneas.
      */
      const {
        data: posiblesChoques,
        error: choqueError,
      } = await supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          end_at,
          status
        `)
        .eq("business_id", businessId)
        .eq("professional_id", professionalId)
        .lt("start_at", endAt.toISOString())
        .gt("end_at", startAt.toISOString());

      if (choqueError) {
        throw new Error(choqueError.message);
      }

      const choqueReal = (
        posiblesChoques || []
      ).some(
        (cita) =>
          cita.status !== "CANCELLED" &&
          cita.status !== "NO_SHOW"
      );

      if (choqueReal) {
        throw new Error(
          "Ese horario acaba de ser ocupado. Seleccione otra hora."
        );
      }

      const {
        data: citaCreada,
        error: citaError,
      } = await supabase
        .from("appointments")
        .insert({
          business_id: businessId,
          branch_id: null,
          client_id: clienteFinalId,
          professional_id: professionalId,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          status: "PENDING",
          source: "ADMIN",
          subtotal: precioServicio,
          discount: 0,
          tax: 0,
          total: precioServicio,
          deposit_amount: 0,
          customer_notes:
            notas.trim() || null,
          internal_notes: null,
          created_by: null,
        })
        .select("id")
        .single();

      if (citaError || !citaCreada) {
        throw new Error(
          citaError?.message ||
            "No se pudo crear la cita."
        );
      }

      const { error: servicioCitaError } =
        await supabase
          .from("appointment_services")
          .insert({
            business_id: businessId,
            appointment_id: citaCreada.id,
            service_id:
              servicioSeleccionado.id,
            service_name_snapshot:
              servicioSeleccionado.name,
            price: precioServicio,
            duration_minutes:
              duracionServicio,
          });

      if (servicioCitaError) {
        await supabase
          .from("appointments")
          .delete()
          .eq("id", citaCreada.id)
          .eq("business_id", businessId);

        throw new Error(
          "No se pudo guardar el servicio de la cita: " +
            servicioCitaError.message
        );
      }

      setMensaje(
        "Cita creada correctamente."
      );

      limpiarFormulario();

      /*
        Quitamos ?cliente=... de la URL después
        de completar la operación.
      */
      if (clienteParametro) {
        router.replace("/panel/agenda");
      }

      await cargarCitasDelDia();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Ocurrió un error al crear la cita."
        );
      }
    }

    setGuardando(false);
  }

  function abrirNuevaCita() {
    setMensaje("");
    setError("");

    /*
      Si el negocio todavía no tiene clientes,
      abrimos directamente Nuevo cliente.
    */
    if (clientes.length === 0) {
      setModoCliente("nuevo");
      setClienteId("");
    } else {
      setModoCliente("existente");

      /*
        Si venimos desde Clientes mantenemos
        el cliente seleccionado.
      */
      if (
        clienteParametro &&
        clientes.some(
          (cliente) =>
            cliente.id === clienteParametro
        )
      ) {
        setClienteId(clienteParametro);
      }
    }

    setMostrarFormulario(true);
  }

  function limpiarFormulario() {
    setClienteId("");

    setNuevoNombre("");
    setNuevoApellido("");
    setNuevoTelefono("");
    setNuevoWhatsapp("");
    setNuevoEmail("");

    setProfessionalId("");
    setServiciosProfesional([]);
    setServiceId("");

    setHoraSeleccionada("");
    setHorariosDisponibles([]);

    setNotas("");

    if (clientes.length === 0) {
      setModoCliente("nuevo");
    } else {
      setModoCliente("existente");
    }

    setMostrarFormulario(false);
  }

  async function cambiarEstadoCita(
    citaId: string,
    nuevoEstado: string
  ) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("appointments")
      .update({
        status: nuevoEstado,
      })
      .eq("id", citaId)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    setMensaje(
      "Estado de la cita actualizado."
    );

    await cargarCitasDelDia();

    if (
      professionalId &&
      serviceId
    ) {
      await cargarDisponibilidad();
    }
  }

  function cambiarDia(cantidad: number) {
    const actual = new Date(
      `${fecha}T12:00:00`
    );

    actual.setDate(
      actual.getDate() + cantidad
    );

    setFecha(
      fechaLocalDesdeDate(actual)
    );
  }

  function clienteDeCita(cita: Cita) {
    return Array.isArray(cita.clients)
      ? cita.clients[0]
      : cita.clients;
  }

  function profesionalDeCita(cita: Cita) {
    return Array.isArray(
      cita.professionals
    )
      ? cita.professionals[0]
      : cita.professionals;
  }

  function servicioDeCita(cita: Cita) {
    return (
      cita.appointment_services?.[0] ||
      null
    );
  }

  function textoEstado(status: string) {
    const estados: Record<
      string,
      string
    > = {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmada",
      CHECKED_IN: "Llegó",
      IN_PROGRESS: "En atención",
      COMPLETED: "Completada",
      CANCELLED: "Cancelada",
      NO_SHOW: "No se presentó",
    };

    return estados[status] || status;
  }

  function colorEstado(status: string) {
    switch (status) {
      case "CONFIRMED":
        return {
          background: "#eff8ff",
          color: "#175cd3",
        };

      case "COMPLETED":
        return {
          background: "#ecfdf3",
          color: "#027a48",
        };

      case "CANCELLED":
      case "NO_SHOW":
        return {
          background: "#fef3f2",
          color: "#b42318",
        };

      case "IN_PROGRESS":
      case "CHECKED_IN":
        return {
          background: "#fff6ed",
          color: "#c4320a",
        };

      default:
        return {
          background: "#f2f4f7",
          color: "#475467",
        };
    }
  }

  if (cargando) {
    return (
      <main style={pantallaCargando}>
        <p>Cargando agenda...</p>
      </main>
    );
  }

  const fechaMostrada = new Date(
    `${fecha}T12:00:00`
  ).toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main style={mainStyle}>
      <div style={contenedorStyle}>
        <button
          onClick={() =>
            router.push("/panel")
          }
          style={volverStyle}
        >
          ← Volver al panel
        </button>

        <div
          style={encabezadoPrincipalStyle}
        >
          <div>
            <h1 style={tituloStyle}>
              Agenda
            </h1>

            <p style={subtituloStyle}>
              Administre las citas y
              disponibilidad de su negocio.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/panel/agenda/calendario"
                )
              }
              style={botonCalendarioStyle}
            >
              📅 Ver calendario
            </button>

            <button
              type="button"
              onClick={() => {
                if (mostrarFormulario) {
                  limpiarFormulario();

                  if (clienteParametro) {
                    router.replace(
                      "/panel/agenda"
                    );
                  }
                } else {
                  abrirNuevaCita();
                }
              }}
              style={botonNuevaCitaStyle}
            >
              {mostrarFormulario
                ? "Cerrar formulario"
                : "+ Nueva cita"}
            </button>
          </div>
        </div>

        {error && (
          <div style={errorStyle}>
            <strong>Error:</strong>{" "}
            {error}
          </div>
        )}

        {mensaje && (
          <div style={mensajeStyle}>
            {mensaje}
          </div>
        )}

        <section style={fechaBarraStyle}>
          <button
            type="button"
            onClick={() => cambiarDia(-1)}
            style={botonFechaStyle}
          >
            ←
          </button>

          <div style={fechaCentroStyle}>
            <strong style={fechaTextoStyle}>
              {fechaMostrada}
            </strong>

            <input
              type="date"
              value={fecha}
              onChange={(e) =>
                setFecha(e.target.value)
              }
              style={inputFechaStyle}
            />
          </div>

          <button
            type="button"
            onClick={() => cambiarDia(1)}
            style={botonFechaStyle}
          >
            →
          </button>
        </section>

        {mostrarFormulario && (
          <section style={formularioStyle}>
            <div
              style={
                formularioEncabezadoStyle
              }
            >
              <div>
                <h2
                  style={
                    seccionTituloStyle
                  }
                >
                  Nueva cita
                </h2>

                <p
                  style={textoAyudaStyle}
                >
                  Seleccione cliente,
                  profesional, servicio y una
                  hora disponible.
                </p>
              </div>
            </div>

            <form onSubmit={crearCita}>
              <div style={bloqueFormStyle}>
                <h3
                  style={
                    subtituloBloqueStyle
                  }
                >
                  1. Cliente
                </h3>

                <div
                  style={tabsClienteStyle}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setModoCliente(
                        "existente"
                      )
                    }
                    disabled={
                      clientes.length === 0
                    }
                    style={{
                      ...tabClienteStyle,

                      background:
                        modoCliente ===
                        "existente"
                          ? "#101828"
                          : "#ffffff",

                      color:
                        modoCliente ===
                        "existente"
                          ? "#ffffff"
                          : "#344054",

                      opacity:
                        clientes.length === 0
                          ? 0.5
                          : 1,

                      cursor:
                        clientes.length === 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Cliente existente
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModoCliente(
                        "nuevo"
                      );

                      setClienteId("");
                    }}
                    style={{
                      ...tabClienteStyle,

                      background:
                        modoCliente === "nuevo"
                          ? "#101828"
                          : "#ffffff",

                      color:
                        modoCliente === "nuevo"
                          ? "#ffffff"
                          : "#344054",
                    }}
                  >
                    Nuevo cliente
                  </button>
                </div>

                {modoCliente ===
                "existente" ? (
                  <div>
                    <label
                      style={labelStyle}
                    >
                      Seleccione el cliente
                    </label>

                    <select
                      value={clienteId}
                      onChange={(e) =>
                        setClienteId(
                          e.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Seleccione un cliente
                      </option>

                      {clientes.map(
                        (cliente) => (
                          <option
                            key={cliente.id}
                            value={cliente.id}
                          >
                            {
                              cliente.first_name
                            }

                            {cliente.last_name
                              ? ` ${cliente.last_name}`
                              : ""}

                            {cliente.phone
                              ? ` · ${cliente.phone}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    {clienteId && (
                      <div
                        style={
                          clienteSeleccionadoStyle
                        }
                      >
                        ✓ Cliente seleccionado
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={
                      gridDosColumnasStyle
                    }
                  >
                    <div>
                      <label
                        style={labelStyle}
                      >
                        Nombre *
                      </label>

                      <input
                        type="text"
                        value={nuevoNombre}
                        onChange={(e) =>
                          setNuevoNombre(
                            e.target.value
                          )
                        }
                        placeholder="Ej. Carlos"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Apellido
                      </label>

                      <input
                        type="text"
                        value={nuevoApellido}
                        onChange={(e) =>
                          setNuevoApellido(
                            e.target.value
                          )
                        }
                        placeholder="Ej. Rodríguez"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Teléfono
                      </label>

                      <input
                        type="tel"
                        value={nuevoTelefono}
                        onChange={(e) =>
                          setNuevoTelefono(
                            e.target.value
                          )
                        }
                        placeholder="Ej. 8888-8888"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        WhatsApp
                      </label>

                      <input
                        type="tel"
                        value={nuevoWhatsapp}
                        onChange={(e) =>
                          setNuevoWhatsapp(
                            e.target.value
                          )
                        }
                        placeholder="Ej. 8888-8888"
                        style={inputStyle}
                      />
                    </div>

                    <div
                      style={{
                        gridColumn:
                          "1 / -1",
                      }}
                    >
                      <label
                        style={labelStyle}
                      >
                        Correo electrónico
                      </label>

                      <input
                        type="email"
                        value={nuevoEmail}
                        onChange={(e) =>
                          setNuevoEmail(
                            e.target.value
                          )
                        }
                        placeholder="correo@ejemplo.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={bloqueFormStyle}>
                <h3
                  style={
                    subtituloBloqueStyle
                  }
                >
                  2. Profesional y servicio
                </h3>

                <div
                  style={
                    gridDosColumnasStyle
                  }
                >
                  <div>
                    <label
                      style={labelStyle}
                    >
                      Profesional *
                    </label>

                    <select
                      value={professionalId}
                      onChange={(e) =>
                        setProfessionalId(
                          e.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Seleccione profesional
                      </option>

                      {profesionales.map(
                        (profesional) => (
                          <option
                            key={
                              profesional.id
                            }
                            value={
                              profesional.id
                            }
                          >
                            {profesional.name}

                            {profesional.specialty
                              ? ` · ${profesional.specialty}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      style={labelStyle}
                    >
                      Servicio *
                    </label>

                    <select
                      value={serviceId}
                      onChange={(e) =>
                        setServiceId(
                          e.target.value
                        )
                      }
                      disabled={
                        !professionalId
                      }
                      style={{
                        ...inputStyle,

                        opacity:
                          professionalId
                            ? 1
                            : 0.6,
                      }}
                    >
                      <option value="">
                        {professionalId
                          ? "Seleccione servicio"
                          : "Seleccione profesional primero"}
                      </option>

                      {serviciosProfesional.map(
                        (servicio) => {
                          const precio =
                            servicio.custom_price ??
                            servicio.price ??
                            0;

                          const duracion =
                            servicio.custom_duration_minutes ??
                            servicio.duration_minutes;

                          return (
                            <option
                              key={
                                servicio.id
                              }
                              value={
                                servicio.id
                              }
                            >
                              {servicio.name} ·{" "}
                              {moneda(precio)} ·{" "}
                              {duracion} min
                            </option>
                          );
                        }
                      )}
                    </select>
                  </div>
                </div>

                {servicioSeleccionado && (
                  <div
                    style={
                      resumenServicioStyle
                    }
                  >
                    <div>
                      <span
                        style={
                          resumenLabelStyle
                        }
                      >
                        Servicio
                      </span>

                      <strong>
                        {
                          servicioSeleccionado.name
                        }
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          resumenLabelStyle
                        }
                      >
                        Duración
                      </span>

                      <strong>
                        {duracionServicio}{" "}
                        minutos
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          resumenLabelStyle
                        }
                      >
                        Precio
                      </span>

                      <strong>
                        {moneda(
                          precioServicio
                        )}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div style={bloqueFormStyle}>
                <h3
                  style={
                    subtituloBloqueStyle
                  }
                >
                  3. Hora disponible
                </h3>

                {!professionalId ||
                !serviceId ? (
                  <p style={avisoStyle}>
                    Seleccione primero un
                    profesional y un servicio.
                  </p>
                ) : cargandoDisponibilidad ? (
                  <p style={avisoStyle}>
                    Calculando
                    disponibilidad...
                  </p>
                ) : horariosDisponibles.length ===
                  0 ? (
                  <div
                    style={
                      sinDisponibilidadStyle
                    }
                  >
                    No hay horarios disponibles
                    para esta fecha. Puede elegir
                    otro día.
                  </div>
                ) : (
                  <div
                    style={horariosGridStyle}
                  >
                    {horariosDisponibles.map(
                      (horario) => (
                        <button
                          key={horario.hora}
                          type="button"
                          onClick={() =>
                            setHoraSeleccionada(
                              horario.hora
                            )
                          }
                          style={{
                            ...horaBotonStyle,

                            background:
                              horaSeleccionada ===
                              horario.hora
                                ? "#101828"
                                : "#ffffff",

                            color:
                              horaSeleccionada ===
                              horario.hora
                                ? "#ffffff"
                                : "#101828",

                            borderColor:
                              horaSeleccionada ===
                              horario.hora
                                ? "#101828"
                                : "#d0d5dd",
                          }}
                        >
                          {horario.etiqueta}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div style={bloqueFormStyle}>
                <label style={labelStyle}>
                  Notas del cliente
                </label>

                <textarea
                  value={notas}
                  onChange={(e) =>
                    setNotas(e.target.value)
                  }
                  placeholder="Información adicional de la cita..."
                  style={{
                    ...inputStyle,
                    minHeight: "90px",
                    resize: "vertical",
                    fontFamily:
                      "Arial, sans-serif",
                  }}
                />
              </div>

              <div
                style={
                  accionesFormularioStyle
                }
              >
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario();

                    if (clienteParametro) {
                      router.replace(
                        "/panel/agenda"
                      );
                    }
                  }}
                  style={
                    botonCancelarStyle
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    ...botonGuardarStyle,

                    opacity: guardando
                      ? 0.7
                      : 1,

                    cursor: guardando
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {guardando
                    ? "Guardando cita..."
                    : "Crear cita"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section style={agendaStyle}>
          <div
            style={cabeceraListadoStyle}
          >
            <div>
              <h2
                style={seccionTituloStyle}
              >
                Citas del día
              </h2>

              <p
                style={textoAyudaStyle}
              >
                {citas.length === 1
                  ? "1 cita registrada."
                  : `${citas.length} citas registradas.`}
              </p>
            </div>

            <div
              style={contadorCitasStyle}
            >
              {citas.length}
            </div>
          </div>

          {citas.length === 0 ? (
            <div style={vacioStyle}>
              <div
                style={{
                  fontSize: "36px",
                }}
              >
                📅
              </div>

              <h3
                style={{
                  marginBottom: "7px",
                }}
              >
                No hay citas para este día
              </h3>

              <p
                style={{
                  color: "#667085",
                  margin: 0,
                }}
              >
                Cree una nueva cita o
                seleccione otra fecha.
              </p>
            </div>
          ) : (
            <div>
              {citas.map((cita) => {
                const cliente =
                  clienteDeCita(cita);

                const profesional =
                  profesionalDeCita(cita);

                const servicio =
                  servicioDeCita(cita);

                const inicio = new Date(
                  cita.start_at
                );

                const fin = new Date(
                  cita.end_at
                );

                const colores =
                  colorEstado(cita.status);

                return (
                  <article
                    key={cita.id}
                    style={citaCardStyle}
                  >
                    <div
                      style={horaCitaStyle}
                    >
                      <strong>
                        {horaAMPM(inicio)}
                      </strong>

                      <span
                        style={horaFinStyle}
                      >
                        {horaAMPM(fin)}
                      </span>
                    </div>

                    <div
                      style={
                        contenidoCitaStyle
                      }
                    >
                      <div
                        style={
                          tituloCitaFilaStyle
                        }
                      >
                        <div>
                          <h3
                            style={
                              nombreClienteStyle
                            }
                          >
                            {cliente
                              ? `${
                                  cliente.first_name
                                }${
                                  cliente.last_name
                                    ? ` ${cliente.last_name}`
                                    : ""
                                }`
                              : "Cliente"}
                          </h3>

                          <p
                            style={
                              servicioCitaStyle
                            }
                          >
                            {servicio?.service_name_snapshot ||
                              "Servicio"}
                          </p>
                        </div>

                        <span
                          style={{
                            ...estadoCitaStyle,
                            ...colores,
                          }}
                        >
                          {textoEstado(
                            cita.status
                          )}
                        </span>
                      </div>

                      <div
                        style={
                          detalleCitaStyle
                        }
                      >
                        <span>
                          👤{" "}
                          {profesional?.name ||
                            "Sin profesional"}
                        </span>

                        <span>
                          ⏱{" "}
                          {servicio?.duration_minutes ||
                            Math.round(
                              (fin.getTime() -
                                inicio.getTime()) /
                                60000
                            )}{" "}
                          min
                        </span>

                        <span>
                          💰{" "}
                          {moneda(cita.total)}
                        </span>

                        {cliente?.phone && (
                          <span>
                            ☎ {cliente.phone}
                          </span>
                        )}
                      </div>

                      {cita.customer_notes && (
                        <div
                          style={
                            notasCitaStyle
                          }
                        >
                          {
                            cita.customer_notes
                          }
                        </div>
                      )}

                      <div
                        style={
                          estadoAccionesStyle
                        }
                      >
                        <select
                          value={cita.status}
                          onChange={(e) =>
                            cambiarEstadoCita(
                              cita.id,
                              e.target.value
                            )
                          }
                          style={
                            estadoSelectStyle
                          }
                        >
                          <option value="PENDING">
                            Pendiente
                          </option>

                          <option value="CONFIRMED">
                            Confirmada
                          </option>

                          <option value="CHECKED_IN">
                            Llegó
                          </option>

                          <option value="IN_PROGRESS">
                            En atención
                          </option>

                          <option value="COMPLETED">
                            Completada
                          </option>

                          <option value="CANCELLED">
                            Cancelada
                          </option>

                          <option value="NO_SHOW">
                            No se presentó
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/panel/agenda/${cita.id}`
                            )
                          }
                          style={botonVerCitaStyle}
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  padding: "35px 20px 70px",
};

const pantallaCargando: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  color: "#667085",
};

const contenedorStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
};

const volverStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#667085",
  padding: 0,
  marginBottom: "16px",
  cursor: "pointer",
  fontSize: "14px",
};

const encabezadoPrincipalStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "25px",
};

const tituloStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "36px",
  color: "#101828",
};

const subtituloStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
};

const botonCalendarioStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#101828",
  borderRadius: "10px",
  padding: "13px 20px",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
};

const botonNuevaCitaStyle: React.CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "10px",
  padding: "13px 20px",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
};

const fechaBarraStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "50px 1fr 50px",
  alignItems: "center",
  gap: "12px",
  padding: "17px",
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
  marginBottom: "25px",
};

const botonFechaStyle: React.CSSProperties = {
  width: "44px",
  height: "44px",
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: "20px",
};

const fechaCentroStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "18px",
  flexWrap: "wrap",
};

const fechaTextoStyle: React.CSSProperties = {
  color: "#101828",
  textTransform: "capitalize",
};

const inputFechaStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  padding: "9px 11px",
  background: "#ffffff",
};

const formularioStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "30px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  marginBottom: "25px",
};

const formularioEncabezadoStyle: React.CSSProperties = {
  borderBottom: "1px solid #eaecf0",
  marginBottom: "25px",
};

const seccionTituloStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "23px",
  color: "#101828",
};

const textoAyudaStyle: React.CSSProperties = {
  margin: "7px 0 20px",
  color: "#667085",
  fontSize: "14px",
};

const bloqueFormStyle: React.CSSProperties = {
  padding: "10px 0 22px",
  borderBottom: "1px solid #eaecf0",
  marginBottom: "20px",
};

const subtituloBloqueStyle: React.CSSProperties = {
  margin: "0 0 18px",
  fontSize: "17px",
  color: "#101828",
};

const tabsClienteStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "18px",
};

const tabClienteStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  padding: "9px 14px",
  fontWeight: "600",
};

const gridDosColumnasStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0 18px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  color: "#344054",
  marginBottom: "7px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "9px",
  padding: "12px 13px",
  marginBottom: "17px",
  background: "#ffffff",
  color: "#101828",
  fontSize: "15px",
};

const clienteSeleccionadoStyle: React.CSSProperties = {
  marginTop: "-7px",
  marginBottom: "5px",
  color: "#067647",
  background: "#ecfdf3",
  border: "1px solid #abefc6",
  padding: "9px 12px",
  borderRadius: "8px",
  fontSize: "13px",
};

const avisoStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "14px",
  margin: "8px 0",
};

const resumenServicioStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "15px",
  background: "#f9fafb",
  borderRadius: "10px",
  padding: "15px",
};

const resumenLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "12px",
  marginBottom: "4px",
};

const horariosGridStyle: React.CSSProperties = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap",
};

const horaBotonStyle: React.CSSProperties = {
  minWidth: "95px",
  border: "1px solid #d0d5dd",
  borderRadius: "9px",
  padding: "10px 13px",
  cursor: "pointer",
  fontWeight: "600",
};

const sinDisponibilidadStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "10px",
  background: "#f9fafb",
  color: "#667085",
  textAlign: "center",
};

const accionesFormularioStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const botonCancelarStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  borderRadius: "9px",
  padding: "11px 18px",
  fontWeight: "600",
  cursor: "pointer",
};

const botonGuardarStyle: React.CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "9px",
  padding: "11px 22px",
  fontWeight: "700",
};

const agendaStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "30px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
};

const cabeceraListadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "center",
  borderBottom: "1px solid #eaecf0",
  marginBottom: "10px",
};

const contadorCitasStyle: React.CSSProperties = {
  minWidth: "45px",
  height: "45px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f2f4f7",
  fontSize: "20px",
  fontWeight: "700",
};

const vacioStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "70px 20px",
  color: "#101828",
};

const citaCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "110px 1fr",
  gap: "20px",
  padding: "24px 0",
  borderBottom: "1px solid #eaecf0",
};

const horaCitaStyle: React.CSSProperties = {
  borderRight: "1px solid #eaecf0",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  fontSize: "17px",
  color: "#101828",
};

const horaFinStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "13px",
};

const contenidoCitaStyle: React.CSSProperties = {
  minWidth: 0,
};

const tituloCitaFilaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
};

const nombreClienteStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  color: "#101828",
};

const servicioCitaStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#475467",
  fontWeight: "600",
};

const estadoCitaStyle: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const detalleCitaStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
  marginTop: "14px",
  color: "#667085",
  fontSize: "14px",
};

const notasCitaStyle: React.CSSProperties = {
  marginTop: "13px",
  background: "#f9fafb",
  padding: "10px 12px",
  borderRadius: "8px",
  color: "#475467",
  fontSize: "14px",
};

const estadoAccionesStyle: React.CSSProperties = {
  marginTop: "15px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const estadoSelectStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  padding: "8px 10px",
  background: "#ffffff",
  color: "#344054",
};

const botonVerCitaStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  padding: "8px 14px",
  background: "#ffffff",
  color: "#101828",
  fontWeight: "700",
  cursor: "pointer",
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