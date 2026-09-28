"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Negocio = {
  id: string;
  business_name: string;
  legal_name: string | null;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  currency_code: string;
  timezone: string;
  status: string;
};

type Configuracion = {
  business_id: string;
  booking_enabled: boolean;
  show_prices: boolean;
  show_team: boolean;
  show_reviews: boolean;
  show_location: boolean;
  show_social_links: boolean;
  minimum_booking_notice_minutes: number;
  maximum_booking_days: number;
  cancellation_policy: string | null;
  booking_confirmation_message: string | null;
};

type Servicio = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  price_type: string;
  duration_minutes: number;
  image_url: string | null;
  online_booking_enabled: boolean;
  is_active: boolean;
};

type Profesional = {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  photo_url: string | null;
  booking_enabled: boolean;
  is_active: boolean;
  custom_price: number | null;
  custom_duration_minutes: number | null;
};

type HorarioDisponible = {
  hora: string;
  etiqueta: string;
  professionalId: string;
  professionalName: string;
};

type ReservaConfirmada = {
  clienteNombre: string;
  servicioNombre: string;
  profesionalNombre: string;
  fecha: string;
  hora: string;
  duracion: number;
  precio: number;
};

function fechaHoyLocal() {
  const ahora = new Date();

  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fechaMaxima(dias: number) {
  const fecha = new Date();

  fecha.setDate(fecha.getDate() + dias);

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function minutosDesdeHora(hora: string) {
  const [h, m] = hora.split(":").map(Number);

  return h * 60 + m;
}

function horaDesdeMinutos(total: number) {
  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
    2,
    "0"
  )}`;
}

function horaAMPMDesdeTexto(hora: string) {
  const [h, m] = hora.split(":").map(Number);

  const fecha = new Date();

  fecha.setHours(h, m, 0, 0);

  return fecha.toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatearFechaCompleta(fechaTexto: string) {
  const fecha = new Date(`${fechaTexto}T12:00:00`);

  return fecha.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ReservarPage() {
  const params = useParams();

  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const [negocio, setNegocio] = useState<Negocio | null>(null);

  const [configuracion, setConfiguracion] =
    useState<Configuracion | null>(null);

  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<Servicio | null>(null);

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);

  const [profesionalSeleccionado, setProfesionalSeleccionado] =
    useState("");

  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(fechaHoyLocal());

  const [horariosDisponibles, setHorariosDisponibles] = useState<
    HorarioDisponible[]
  >([]);

  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  const [profesionalAsignadoId, setProfesionalAsignadoId] =
    useState("");

  const [profesionalAsignadoNombre, setProfesionalAsignadoNombre] =
    useState("");

  const [nombreCliente, setNombreCliente] = useState("");
  const [apellidoCliente, setApellidoCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [whatsappCliente, setWhatsappCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [notasCliente, setNotasCliente] = useState("");

  const [aceptaPolitica, setAceptaPolitica] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);

  const [cargando, setCargando] = useState(true);

  const [cargandoProfesionales, setCargandoProfesionales] =
    useState(false);

  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  const [guardandoReserva, setGuardandoReserva] = useState(false);

  const [reservaConfirmada, setReservaConfirmada] =
    useState<ReservaConfirmada | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    cargarPagina();
  }, [slug]);

  useEffect(() => {
    setHoraSeleccionada("");
    setProfesionalAsignadoId("");
    setProfesionalAsignadoNombre("");
    setHorariosDisponibles([]);

    if (
      !negocio ||
      !servicioSeleccionado ||
      !profesionalSeleccionado ||
      !fechaSeleccionada
    ) {
      return;
    }

    cargarHorarios();
  }, [
    negocio,
    servicioSeleccionado,
    profesionalSeleccionado,
    fechaSeleccionada,
  ]);

  async function cargarPagina() {
    setCargando(true);
    setError("");

    const { data: negocioData, error: negocioError } =
      await supabase
        .from("businesses")
        .select(`
          id,
          business_name,
          legal_name,
          slug,
          description,
          email,
          phone,
          whatsapp,
          province,
          canton,
          district,
          address,
          logo_url,
          cover_url,
          primary_color,
          secondary_color,
          accent_color,
          currency_code,
          timezone,
          status
        `)
        .eq("slug", slug)
        .single();

    if (negocioError || !negocioData) {
      setError(
        "No encontramos este negocio o la página de reservas no está disponible."
      );

      setCargando(false);

      return;
    }

    setNegocio(negocioData);

    const { data: configuracionData, error: configuracionError } =
      await supabase
        .from("business_settings")
        .select("*")
        .eq("business_id", negocioData.id)
        .maybeSingle();

    if (configuracionError) {
      console.error(configuracionError.message);
    }

    if (configuracionData) {
      setConfiguracion(configuracionData);
    } else {
      setConfiguracion({
        business_id: negocioData.id,
        booking_enabled: true,
        show_prices: true,
        show_team: true,
        show_reviews: false,
        show_location: true,
        show_social_links: true,
        minimum_booking_notice_minutes: 60,
        maximum_booking_days: 90,
        cancellation_policy: null,
        booking_confirmation_message: null,
      });
    }

    const { data: serviciosData, error: serviciosError } =
      await supabase
        .from("services")
        .select(`
          id,
          name,
          description,
          price,
          price_min,
          price_max,
          price_type,
          duration_minutes,
          image_url,
          online_booking_enabled,
          is_active
        `)
        .eq("business_id", negocioData.id)
        .eq("is_active", true)
        .eq("online_booking_enabled", true)
        .order("name");

    if (serviciosError) {
      console.error(serviciosError.message);
    } else {
      setServicios(serviciosData || []);
    }

    setCargando(false);
  }

  async function seleccionarServicio(servicio: Servicio) {
    setServicioSeleccionado(servicio);

    setProfesionalSeleccionado("");

    setProfesionalAsignadoId("");
    setProfesionalAsignadoNombre("");

    setHoraSeleccionada("");

    setHorariosDisponibles([]);

    await cargarProfesionalesDelServicio(servicio.id);
  }

  async function cargarProfesionalesDelServicio(serviceId: string) {
    if (!negocio) return;

    setCargandoProfesionales(true);
    setError("");

    const { data, error } = await supabase
      .from("professional_services")
      .select(`
        professional_id,
        custom_price,
        custom_duration_minutes,
        professionals (
          id,
          name,
          specialty,
          bio,
          photo_url,
          booking_enabled,
          is_active
        )
      `)
      .eq("business_id", negocio.id)
      .eq("service_id", serviceId)
      .eq("is_active", true);

    if (error) {
      setError(
        "No pudimos cargar los profesionales disponibles para este servicio."
      );

      setCargandoProfesionales(false);

      return;
    }

    const lista: Profesional[] = [];

    for (const relacion of data || []) {
      const raw = relacion.professionals;

      const profesional = Array.isArray(raw) ? raw[0] : raw;

      if (!profesional) continue;

      if (!profesional.is_active || !profesional.booking_enabled) {
        continue;
      }

      lista.push({
        id: profesional.id,
        name: profesional.name,
        specialty: profesional.specialty,
        bio: profesional.bio,
        photo_url: profesional.photo_url,
        booking_enabled: profesional.booking_enabled,
        is_active: profesional.is_active,
        custom_price: relacion.custom_price,
        custom_duration_minutes:
          relacion.custom_duration_minutes,
      });
    }

    lista.sort((a, b) => a.name.localeCompare(b.name));

    setProfesionales(lista);

    setCargandoProfesionales(false);

    setTimeout(() => {
      document.getElementById("equipo")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }

  function profesionalActual() {
    return profesionales.find(
      (item) => item.id === profesionalAsignadoId
    );
  }

  function duracionParaProfesional(professionalId: string) {
    if (!servicioSeleccionado) return 0;

    const profesional = profesionales.find(
      (item) => item.id === professionalId
    );

    if (!profesional) {
      return servicioSeleccionado.duration_minutes;
    }

    return (
      profesional.custom_duration_minutes ??
      servicioSeleccionado.duration_minutes
    );
  }

  function precioParaProfesional(professionalId: string) {
    if (!servicioSeleccionado) return 0;

    const profesional = profesionales.find(
      (item) => item.id === professionalId
    );

    if (!profesional) {
      return Number(servicioSeleccionado.price || 0);
    }

    return Number(
      profesional.custom_price ??
        servicioSeleccionado.price ??
        0
    );
  }

  async function cargarHorarios() {
    if (
      !negocio ||
      !servicioSeleccionado ||
      !profesionalSeleccionado ||
      !configuracion
    ) {
      return;
    }

    setCargandoHorarios(true);
    setError("");

    try {
      if (profesionalSeleccionado === "ANY") {
        const todosLosHorarios: HorarioDisponible[] = [];

        for (const profesional of profesionales) {
          const horarios = await obtenerHorariosProfesional(
            profesional.id,
            profesional.name
          );

          todosLosHorarios.push(...horarios);
        }

        const mapa = new Map<string, HorarioDisponible>();

        for (const horario of todosLosHorarios) {
          if (!mapa.has(horario.hora)) {
            mapa.set(horario.hora, horario);
          }
        }

        const unicos = Array.from(mapa.values()).sort((a, b) =>
          a.hora.localeCompare(b.hora)
        );

        setHorariosDisponibles(unicos);
      } else {
        const profesional = profesionales.find(
          (item) => item.id === profesionalSeleccionado
        );

        if (!profesional) {
          setHorariosDisponibles([]);
          setCargandoHorarios(false);

          return;
        }

        const horarios = await obtenerHorariosProfesional(
          profesional.id,
          profesional.name
        );

        setHorariosDisponibles(horarios);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "No se pudieron cargar los horarios disponibles."
        );
      }
    }

    setCargandoHorarios(false);

    setTimeout(() => {
      document.getElementById("fecha-hora")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }

  async function obtenerHorariosProfesional(
    professionalId: string,
    professionalName: string
  ): Promise<HorarioDisponible[]> {
    if (!negocio || !servicioSeleccionado || !configuracion) {
      return [];
    }

    const { data, error } = await supabase.rpc(
      "get_public_availability",
      {
        p_business_id: negocio.id,
        p_service_id: servicioSeleccionado.id,
        p_local_date: fechaSeleccionada,
        p_professional_id: professionalId,
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    const filas = Array.isArray(data) ? data : [];

    return filas.map((fila: any) => {
      const horaRaw =
        typeof fila.local_time === "string"
          ? fila.local_time.slice(0, 5)
          : "";

      return {
        hora: horaRaw,
        etiqueta: horaAMPMDesdeTexto(horaRaw),
        professionalId:
          fila.professional_id || professionalId,
        professionalName:
          fila.professional_name || professionalName,
      };
    });
  }

  function seleccionarHora(horario: HorarioDisponible) {
    setHoraSeleccionada(horario.hora);

    setProfesionalAsignadoId(
      horario.professionalId
    );

    setProfesionalAsignadoNombre(
      horario.professionalName
    );

    setTimeout(() => {
      document
        .getElementById("datos-cliente")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  }

  async function confirmarReserva(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (
      !negocio ||
      !servicioSeleccionado ||
      !horaSeleccionada ||
      !profesionalAsignadoId
    ) {
      setError(
        "Debe completar servicio, profesional, fecha y hora."
      );
      return;
    }

    if (!nombreCliente.trim()) {
      setError("Ingrese su nombre.");
      return;
    }

    if (!telefonoCliente.trim()) {
      setError("Ingrese un número de teléfono.");
      return;
    }

    if (!aceptaPrivacidad) {
      setError(
        "Debe aceptar el uso de sus datos para gestionar la reserva."
      );
      return;
    }

    if (
      configuracion?.cancellation_policy &&
      !aceptaPolitica
    ) {
      setError(
        "Debe aceptar la política de cancelación."
      );
      return;
    }

    setGuardandoReserva(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "create_public_booking",
        {
          p_business_id: negocio.id,
          p_service_id: servicioSeleccionado.id,
          p_professional_id: profesionalAsignadoId,
          p_local_date: fechaSeleccionada,
          p_local_time: `${horaSeleccionada}:00`,
          p_first_name: nombreCliente.trim(),
          p_last_name: apellidoCliente.trim() || null,
          p_phone: telefonoCliente.trim(),
          p_whatsapp: whatsappCliente.trim() || null,
          p_email: emailCliente.trim() || null,
          p_customer_notes: notasCliente.trim() || null,
          p_privacy_consent: aceptaPrivacidad,
        }
      );

      if (rpcError) {
        const mensaje =
          rpcError.message || "No se pudo crear la reserva.";

        if (mensaje.includes("HORARIO_OCUPADO")) {
          setHoraSeleccionada("");
          setProfesionalAsignadoId("");
          setProfesionalAsignadoNombre("");

          await cargarHorarios();

          setTimeout(() => {
            document
              .getElementById("fecha-hora")
              ?.scrollIntoView({
                behavior: "smooth",
              });
          }, 100);

          throw new Error(
            "Ese horario acaba de ser reservado por otra persona. Seleccione otra hora disponible."
          );
        }

        if (mensaje.includes("HORARIO_BLOQUEADO")) {
          setHoraSeleccionada("");
          setProfesionalAsignadoId("");
          setProfesionalAsignadoNombre("");

          await cargarHorarios();

          setTimeout(() => {
            document
              .getElementById("fecha-hora")
              ?.scrollIntoView({
                behavior: "smooth",
              });
          }, 100);

          throw new Error(
            "Ese horario ya no está disponible porque fue bloqueado por el negocio. Seleccione otra hora."
          );
        }

        if (mensaje.includes("FUERA_DEL_HORARIO_LABORAL")) {
          await cargarHorarios();
          throw new Error(
            "Ese horario ya no está disponible. Seleccione otra hora."
          );
        }

        if (mensaje.includes("ANTICIPACION_INSUFICIENTE")) {
          await cargarHorarios();
          throw new Error(
            "La cita no cumple con el tiempo mínimo de anticipación configurado por el negocio."
          );
        }

        if (mensaje.includes("FECHA_FUERA_DE_RANGO")) {
          throw new Error(
            "La fecha seleccionada está fuera del período permitido para reservar."
          );
        }

        if (mensaje.includes("FECHA_PASADA")) {
          throw new Error(
            "No se pueden crear reservas en una fecha pasada."
          );
        }

        if (mensaje.includes("RESERVAS_DESHABILITADAS")) {
          throw new Error(
            "Este negocio ha deshabilitado temporalmente las reservas en línea."
          );
        }

        if (
          mensaje.includes(
            "SERVICIO_PROFESIONAL_NO_DISPONIBLE"
          )
        ) {
          throw new Error(
            "El servicio o profesional seleccionado ya no está disponible."
          );
        }

        if (mensaje.includes("PRIVACIDAD_REQUERIDA")) {
          throw new Error(
            "Debe aceptar el uso de sus datos para gestionar la reserva."
          );
        }

        throw new Error(mensaje);
      }

      if (!data) {
        throw new Error(
          "La reserva no pudo ser confirmada."
        );
      }

      const resultado =
        typeof data === "string" ? JSON.parse(data) : data;

      setReservaConfirmada({
        clienteNombre: `${nombreCliente.trim()}${
          apellidoCliente.trim()
            ? ` ${apellidoCliente.trim()}`
            : ""
        }`,
        servicioNombre:
          resultado.service_name || servicioSeleccionado.name,
        profesionalNombre:
          resultado.professional_name ||
          profesionalAsignadoNombre,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        duracion:
          Number(resultado.duration_minutes) ||
          duracionParaProfesional(profesionalAsignadoId),
        precio:
          Number(resultado.price) ||
          precioParaProfesional(profesionalAsignadoId),
      });

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 100);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "No se pudo completar la reserva."
        );
      }
    } finally {
      setGuardandoReserva(false);
    }
  }

  function formatearPrecio(servicio: Servicio) {
    const moneda =
      negocio?.currency_code || "CRC";

    const formato =
      new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: moneda,
        maximumFractionDigits: 0,
      });

    if (servicio.price_type === "FREE") {
      return "Gratis";
    }

    if (
      servicio.price_type === "RANGE" &&
      servicio.price_min !== null &&
      servicio.price_max !== null
    ) {
      return `${formato.format(
        Number(servicio.price_min)
      )} - ${formato.format(
        Number(servicio.price_max)
      )}`;
    }

    if (
      servicio.price_type === "FROM" &&
      servicio.price_min !== null
    ) {
      return `Desde ${formato.format(
        Number(servicio.price_min)
      )}`;
    }

    if (servicio.price_type === "QUOTE") {
      return "Precio a consultar";
    }

    if (servicio.price !== null) {
      return formato.format(
        Number(servicio.price)
      );
    }

    return "Consultar";
  }

  function formatearMoneda(valor: number) {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency:
        negocio?.currency_code || "CRC",
      maximumFractionDigits: 0,
    }).format(valor);
  }

  function formatearPrecioProfesional(
    profesional: Profesional
  ) {
    if (!servicioSeleccionado) return "";

    const precio =
      profesional.custom_price ??
      servicioSeleccionado.price ??
      0;

    return formatearMoneda(Number(precio));
  }

  function duracionProfesional(
    profesional: Profesional
  ) {
    if (!servicioSeleccionado) return 0;

    return (
      profesional.custom_duration_minutes ??
      servicioSeleccionado.duration_minutes
    );
  }

  function obtenerUbicacion() {
    if (!negocio) return "";

    return [
      negocio.district,
      negocio.canton,
      negocio.province,
    ]
      .filter(Boolean)
      .join(", ");
  }

  function nuevaReserva() {
    setReservaConfirmada(null);

    setServicioSeleccionado(null);
    setProfesionalSeleccionado("");
    setProfesionales([]);

    setFechaSeleccionada(fechaHoyLocal());

    setHorariosDisponibles([]);
    setHoraSeleccionada("");

    setProfesionalAsignadoId("");
    setProfesionalAsignadoNombre("");

    setNombreCliente("");
    setApellidoCliente("");
    setTelefonoCliente("");
    setWhatsappCliente("");
    setEmailCliente("");
    setNotasCliente("");

    setAceptaPolitica(false);
    setAceptaPrivacidad(false);
    setError("");
  }

  const fechaMax = useMemo(() => {
    return fechaMaxima(
      configuracion?.maximum_booking_days ||
        90
    );
  }, [configuracion]);

  if (cargando) {
    return (
      <main style={styles.pantallaCentro}>
        <div style={styles.cargandoCaja}>
          <div style={styles.logoMarca}>
            CitaTica
          </div>

          <p style={styles.textoSecundario}>
            Cargando página de reservas...
          </p>
        </div>
      </main>
    );
  }

  if (error && !negocio) {
    return (
      <main style={styles.pantallaCentro}>
        <div style={styles.errorCaja}>
          <div style={styles.logoMarca}>
            CitaTica
          </div>

          <h1 style={styles.errorTitulo}>
            Página no disponible
          </h1>

          <p style={styles.textoSecundario}>
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!negocio) return null;

  const colorPrincipal =
    negocio.primary_color || "#101828";

  const reservasHabilitadas =
    configuracion?.booking_enabled !== false;

  const mostrarPrecios =
    configuracion?.show_prices !== false;

  const mostrarEquipo =
    configuracion?.show_team !== false;

  const mostrarUbicacion =
    configuracion?.show_location !== false;

  /*
   * PANTALLA FINAL
   */
  if (reservaConfirmada) {
    return (
      <main style={styles.main}>
        <section style={styles.portada}>
          {negocio.cover_url ? (
            <div
              style={{
                ...styles.cover,
                backgroundImage: `linear-gradient(
                  rgba(0,0,0,0.35),
                  rgba(0,0,0,0.35)
                ), url("${negocio.cover_url}")`,
              }}
            />
          ) : (
            <div
              style={{
                ...styles.coverSinImagen,
                background: `linear-gradient(
                  135deg,
                  ${colorPrincipal},
                  #101828
                )`,
              }}
            />
          )}

          <div
            style={
              styles.perfilContenedor
            }
          >
            {negocio.logo_url ? (
              <img
                src={negocio.logo_url}
                alt={negocio.business_name}
                style={styles.logoNegocio}
              />
            ) : (
              <div
                style={{
                  ...styles.logoPlaceholder,
                  background: colorPrincipal,
                }}
              >
                {negocio.business_name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div
              style={
                styles.perfilInformacion
              }
            >
              <p style={styles.citaTica}>
                Reservas en CitaTica
              </p>

              <h1
                style={
                  styles.nombreNegocio
                }
              >
                {negocio.business_name}
              </h1>
            </div>
          </div>
        </section>

        <div style={styles.contenedor}>
          <section
            style={
              styles.confirmacionCard
            }
          >
            <div
              style={{
                ...styles.confirmacionIcono,
                background: colorPrincipal,
              }}
            >
              ✓
            </div>

            <h1
              style={
                styles.confirmacionTitulo
              }
            >
              ¡Su cita ha sido reservada!
            </h1>

            <p
              style={
                styles.textoSecundario
              }
            >
              Gracias,{" "}
              {reservaConfirmada.clienteNombre}.
            </p>

            <div
              style={
                styles.resumenFinal
              }
            >
              <FilaResumen
                etiqueta="Servicio"
                valor={
                  reservaConfirmada.servicioNombre
                }
              />

              <FilaResumen
                etiqueta="Profesional"
                valor={
                  reservaConfirmada.profesionalNombre
                }
              />

              <FilaResumen
                etiqueta="Fecha"
                valor={formatearFechaCompleta(
                  reservaConfirmada.fecha
                )}
              />

              <FilaResumen
                etiqueta="Hora"
                valor={horaAMPMDesdeTexto(
                  reservaConfirmada.hora
                )}
              />

              <FilaResumen
                etiqueta="Duración"
                valor={`${reservaConfirmada.duracion} minutos`}
              />

              {mostrarPrecios && (
                <FilaResumen
                  etiqueta="Precio"
                  valor={formatearMoneda(
                    reservaConfirmada.precio
                  )}
                />
              )}
            </div>

            {configuracion?.booking_confirmation_message && (
              <div
                style={
                  styles.mensajeConfirmacion
                }
              >
                {
                  configuracion.booking_confirmation_message
                }
              </div>
            )}

            <button
              type="button"
              onClick={nuevaReserva}
              style={{
                ...styles.botonConfirmar,
                background:
                  colorPrincipal,
              }}
            >
              Reservar otra cita
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.topbar}>
        <div style={styles.topbarInner}>
          <div style={styles.topbarBrand}>
            <span style={{ ...styles.topbarMark, background: colorPrincipal }}>C</span>
            <span>CitaTica</span>
          </div>
          <div style={styles.topbarText}>Reservas en línea</div>
        </div>
      </div>

      <section style={styles.portada}>
        {negocio.cover_url ? (
          <div
            style={{
              ...styles.cover,

              backgroundImage: `linear-gradient(
                rgba(0,0,0,0.35),
                rgba(0,0,0,0.35)
              ), url("${negocio.cover_url}")`,
            }}
          />
        ) : (
          <div
            style={{
              ...styles.coverSinImagen,

              background: `linear-gradient(
                135deg,
                ${colorPrincipal},
                #101828
              )`,
            }}
          />
        )}

        <div
          style={
            styles.perfilContenedor
          }
        >
          {negocio.logo_url ? (
            <img
              src={negocio.logo_url}
              alt={negocio.business_name}
              style={styles.logoNegocio}
            />
          ) : (
            <div
              style={{
                ...styles.logoPlaceholder,
                background:
                  colorPrincipal,
              }}
            >
              {negocio.business_name
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div
            style={
              styles.perfilInformacion
            }
          >
            <p style={styles.citaTica}>
              Reservas en CitaTica
            </p>

            <h1
              style={
                styles.nombreNegocio
              }
            >
              {negocio.business_name}
            </h1>

            {negocio.description && (
              <p
                style={
                  styles.descripcionNegocio
                }
              >
                {negocio.description}
              </p>
            )}

            {mostrarUbicacion &&
              obtenerUbicacion() && (
                <p
                  style={
                    styles.ubicacion
                  }
                >
                  📍 {obtenerUbicacion()}
                </p>
              )}
          </div>
        </div>
      </section>

      <div style={styles.progresoWrap}>
        <div style={styles.progresoBarra}>
          {[
            { n: 1, label: "Servicio", activo: true, completo: !!servicioSeleccionado },
            { n: 2, label: "Profesional", activo: !!servicioSeleccionado, completo: !!profesionalSeleccionado },
            { n: 3, label: "Fecha y hora", activo: !!profesionalSeleccionado, completo: !!horaSeleccionada },
            { n: 4, label: "Confirmar", activo: !!horaSeleccionada, completo: !!reservaConfirmada },
          ].map((paso, index, arr) => (
            <div key={paso.n} style={styles.progresoItem}>
              <div
                style={{
                  ...styles.progresoCirculo,
                  background: paso.completo || paso.activo ? colorPrincipal : "#eef1f5",
                  color: paso.completo || paso.activo ? "#ffffff" : "#98a2b3",
                }}
              >
                {paso.completo ? "✓" : paso.n}
              </div>
              <span
                style={{
                  ...styles.progresoLabel,
                  color: paso.activo || paso.completo ? "#101828" : "#98a2b3",
                  fontWeight: paso.activo ? 700 : 600,
                }}
              >
                {paso.label}
              </span>
              {index < arr.length - 1 && <div style={styles.progresoLinea} />}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.contenedor}>
        {!reservasHabilitadas && (
          <div style={styles.aviso}>
            <strong>
              Las reservas en línea no
              están disponibles
              actualmente.
            </strong>
          </div>
        )}

        {error && (
          <div
            style={
              styles.errorBanner
            }
          >
            {error}
          </div>
        )}

        {/* PASO 1 */}

        <section style={styles.seccion}>
          <p style={styles.paso}>
            PASO 1
          </p>

          <h2
            style={
              styles.tituloSeccion
            }
          >
            Seleccione un servicio
          </h2>

          <p
            style={
              styles.textoSecundario
            }
          >
            ¿Qué servicio desea reservar?
          </p>

          <div
            style={
              styles.listaServicios
            }
          >
            {servicios.map(
              (servicio) => {
                const seleccionado =
                  servicioSeleccionado?.id ===
                  servicio.id;

                return (
                  <button
                    key={servicio.id}
                    type="button"
                    onClick={() =>
                      seleccionarServicio(
                        servicio
                      )
                    }
                    style={{
                      ...styles.servicioCard,

                      border:
                        seleccionado
                          ? `2px solid ${colorPrincipal}`
                          : "1px solid #e4e7ec",

                      background:
                        seleccionado
                          ? "#f7fbff"
                          : "#ffffff",

                      boxShadow:
                        seleccionado
                          ? `0 10px 26px ${colorPrincipal}18`
                          : "0 1px 2px rgba(16,24,40,0.04)",
                    }}
                  >
                    <div
                      style={
                        styles.servicioIzquierda
                      }
                    >
                      {servicio.image_url ? (
                        <img
                          src={servicio.image_url}
                          alt={servicio.name}
                          style={styles.servicioImagen}
                        />
                      ) : (
                        <div
                          style={{
                            ...styles.servicioIcono,
                            color:
                              colorPrincipal,
                          }}
                        >
                          ✂
                        </div>
                      )}

                      <div
                        style={
                          styles.servicioInfo
                        }
                      >
                        <div
                          style={
                            styles.servicioNombre
                          }
                        >
                          {servicio.name}
                        </div>

                        {servicio.description && (
                          <div
                            style={
                              styles.servicioDescripcion
                            }
                          >
                            {
                              servicio.description
                            }
                          </div>
                        )}

                        <div
                          style={
                            styles.servicioDatos
                          }
                        >
                          <span>
                            ⏱{" "}
                            {
                              servicio.duration_minutes
                            }{" "}
                            min
                          </span>

                          {mostrarPrecios && (
                            <span>
                              {formatearPrecio(
                                servicio
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <SelectorVisual
                      seleccionado={
                        seleccionado
                      }
                      color={
                        colorPrincipal
                      }
                    />
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* PASO 2 */}

        {servicioSeleccionado &&
          reservasHabilitadas && (
            <section
              id="equipo"
              style={styles.seccion}
            >
              <p style={styles.paso}>
                PASO 2
              </p>

              <h2
                style={
                  styles.tituloSeccion
                }
              >
                Seleccione un profesional
              </h2>

              <p
                style={
                  styles.textoSecundario
                }
              >
                Elija quién desea que le
                atienda.
              </p>

              {cargandoProfesionales ? (
                <div style={styles.vacio}>
                  Buscando
                  profesionales...
                </div>
              ) : (
                <div
                  style={
                    styles.gridProfesionales
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setProfesionalSeleccionado(
                        "ANY"
                      )
                    }
                    style={{
                      ...styles.profesionalBoton,

                      border:
                        profesionalSeleccionado ===
                        "ANY"
                          ? `2px solid ${colorPrincipal}`
                          : "1px solid #e4e7ec",

                      background:
                        profesionalSeleccionado === "ANY" ? "#f7fbff" : "#fbfcfe",

                      boxShadow:
                        profesionalSeleccionado === "ANY"
                          ? `0 10px 28px ${colorPrincipal}16`
                          : "0 1px 2px rgba(16,24,40,0.04)",
                    }}
                  >
                    <div
                      style={{
                        ...styles.profesionalFotoPlaceholder,
                        color:
                          colorPrincipal,
                      }}
                    >
                      👥
                    </div>

                    <div>
                      <div
                        style={
                          styles.profesionalNombre
                        }
                      >
                        Cualquier profesional
                        disponible
                      </div>

                      <p
                        style={
                          styles.profesionalBio
                        }
                      >
                        CitaTica asignará
                        automáticamente una
                        persona disponible.
                      </p>
                    </div>

                    <SelectorVisual
                      seleccionado={
                        profesionalSeleccionado ===
                        "ANY"
                      }
                      color={
                        colorPrincipal
                      }
                    />
                  </button>

                  {mostrarEquipo &&
                    profesionales.map(
                    (profesional) => {
                      const seleccionado =
                        profesionalSeleccionado ===
                        profesional.id;

                      return (
                        <button
                          key={
                            profesional.id
                          }
                          type="button"
                          onClick={() =>
                            setProfesionalSeleccionado(
                              profesional.id
                            )
                          }
                          style={{
                            ...styles.profesionalBoton,

                            border:
                              seleccionado
                                ? `2px solid ${colorPrincipal}`
                                : "1px solid #e4e7ec",

                            background:
                              seleccionado ? "#f7fbff" : "#ffffff",

                            boxShadow:
                              seleccionado
                                ? `0 10px 28px ${colorPrincipal}16`
                                : "0 1px 2px rgba(16,24,40,0.04)",
                          }}
                        >
                          {profesional.photo_url ? (
                            <img
                              src={profesional.photo_url}
                              alt={profesional.name}
                              style={styles.profesionalFoto}
                            />
                          ) : (
                            <div
                              style={{
                                ...styles.profesionalFotoPlaceholder,
                                color:
                                  colorPrincipal,
                              }}
                            >
                              👤
                            </div>
                          )}

                          <div>
                            <div
                              style={
                                styles.profesionalNombre
                              }
                            >
                              {
                                profesional.name
                              }
                            </div>

                            {profesional.specialty && (
                              <div
                                style={
                                  styles.profesionalEspecialidad
                                }
                              >
                                {
                                  profesional.specialty
                                }
                              </div>
                            )}

                            {profesional.bio && (
                              <p
                                style={
                                  styles.profesionalBio
                                }
                              >
                                {
                                  profesional.bio
                                }
                              </p>
                            )}

                            <div
                              style={
                                styles.profesionalDatos
                              }
                            >
                              <span>
                                ⏱{" "}
                                {duracionProfesional(
                                  profesional
                                )}{" "}
                                min
                              </span>

                              {mostrarPrecios && (
                                <span>
                                  {formatearPrecioProfesional(
                                    profesional
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <SelectorVisual
                            seleccionado={
                              seleccionado
                            }
                            color={
                              colorPrincipal
                            }
                          />
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          )}

        {/* PASO 3 */}

        {servicioSeleccionado &&
          profesionalSeleccionado && (
            <section
              id="fecha-hora"
              style={styles.seccion}
            >
              <p style={styles.paso}>
                PASO 3
              </p>

              <h2
                style={
                  styles.tituloSeccion
                }
              >
                Seleccione fecha y hora
              </h2>

              <p
                style={
                  styles.textoSecundario
                }
              >
                Mostramos únicamente
                horarios realmente
                disponibles.
              </p>

              <div
                style={
                  styles.fechaCaja
                }
              >
                <label
                  style={styles.label}
                >
                  Fecha
                </label>

                <input
                  type="date"
                  value={
                    fechaSeleccionada
                  }
                  min={fechaHoyLocal()}
                  max={fechaMax}
                  onChange={(e) =>
                    setFechaSeleccionada(
                      e.target.value
                    )
                  }
                  style={
                    styles.fechaInput
                  }
                />
              </div>

              <div
                style={
                  styles.horariosArea
                }
              >
                {cargandoHorarios ? (
                  <div
                    style={styles.vacio}
                  >
                    Calculando horarios
                    disponibles...
                  </div>
                ) : horariosDisponibles.length ===
                  0 ? (
                  <div
                    style={styles.vacio}
                  >
                    No hay horarios
                    disponibles para esta
                    fecha.
                  </div>
                ) : (
                  <div
                    style={
                      styles.horariosGrid
                    }
                  >
                    {horariosDisponibles.map(
                      (horario) => {
                        const seleccionado =
                          horaSeleccionada ===
                            horario.hora &&
                          profesionalAsignadoId ===
                            horario.professionalId;

                        return (
                          <button
                            key={`${horario.hora}-${horario.professionalId}`}
                            type="button"
                            onClick={() =>
                              seleccionarHora(
                                horario
                              )
                            }
                            style={{
                              ...styles.horaBoton,

                              background:
                                seleccionado
                                  ? colorPrincipal
                                  : "#ffffff",

                              color:
                                seleccionado
                                  ? "#ffffff"
                                  : "#101828",

                              borderColor:
                                seleccionado
                                  ? colorPrincipal
                                  : "#d0d5dd",
                            }}
                          >
                            {
                              horario.etiqueta
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                {horaSeleccionada && (
                  <div
                    style={
                      styles.resumenHora
                    }
                  >
                    <strong>
                      {formatearFechaCompleta(
                        fechaSeleccionada
                      )}
                    </strong>

                    <span>
                      🕒{" "}
                      {horaAMPMDesdeTexto(
                        horaSeleccionada
                      )}
                    </span>

                    <span>
                      👤{" "}
                      {
                        profesionalAsignadoNombre
                      }
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

        {/* PASO 4 */}

        {horaSeleccionada &&
          profesionalAsignadoId &&
          servicioSeleccionado && (
            <section
              id="datos-cliente"
              style={styles.seccion}
            >
              <p style={styles.paso}>
                PASO 4
              </p>

              <h2
                style={
                  styles.tituloSeccion
                }
              >
                Sus datos
              </h2>

              <p
                style={
                  styles.textoSecundario
                }
              >
                Complete sus datos para
                confirmar la reserva.
              </p>

              <form
                onSubmit={
                  confirmarReserva
                }
              >
                <div
                  style={
                    styles.gridDosColumnas
                  }
                >
                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Nombre *
                    </label>

                    <input
                      type="text"
                      value={
                        nombreCliente
                      }
                      onChange={(e) =>
                        setNombreCliente(
                          e.target.value
                        )
                      }
                      placeholder="Ej. José"
                      style={
                        styles.input
                      }
                    />
                  </div>

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Apellidos
                    </label>

                    <input
                      type="text"
                      value={
                        apellidoCliente
                      }
                      onChange={(e) =>
                        setApellidoCliente(
                          e.target.value
                        )
                      }
                      placeholder="Ej. Rodríguez"
                      style={
                        styles.input
                      }
                    />
                  </div>

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Teléfono *
                    </label>

                    <input
                      type="tel"
                      value={
                        telefonoCliente
                      }
                      onChange={(e) =>
                        setTelefonoCliente(
                          e.target.value
                        )
                      }
                      placeholder="8888-8888"
                      style={
                        styles.input
                      }
                    />
                  </div>

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      WhatsApp
                    </label>

                    <input
                      type="tel"
                      value={
                        whatsappCliente
                      }
                      onChange={(e) =>
                        setWhatsappCliente(
                          e.target.value
                        )
                      }
                      placeholder="8888-8888"
                      style={
                        styles.input
                      }
                    />
                  </div>

                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                    }}
                  >
                    <label
                      style={
                        styles.label
                      }
                    >
                      Correo electrónico
                    </label>

                    <input
                      type="email"
                      value={
                        emailCliente
                      }
                      onChange={(e) =>
                        setEmailCliente(
                          e.target.value
                        )
                      }
                      placeholder="correo@ejemplo.com"
                      style={
                        styles.input
                      }
                    />
                  </div>

                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                    }}
                  >
                    <label
                      style={
                        styles.label
                      }
                    >
                      Notas
                    </label>

                    <textarea
                      value={
                        notasCliente
                      }
                      onChange={(e) =>
                        setNotasCliente(
                          e.target.value
                        )
                      }
                      placeholder="Información adicional para el negocio..."
                      style={{
                        ...styles.input,
                        minHeight: "90px",
                        resize: "vertical",
                        fontFamily:
                          "Arial, sans-serif",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={
                    styles.resumenReserva
                  }
                >
                  <h3
                    style={{
                      marginTop: 0,
                    }}
                  >
                    Resumen de la reserva
                  </h3>

                  <FilaResumen
                    etiqueta="Servicio"
                    valor={
                      servicioSeleccionado.name
                    }
                  />

                  <FilaResumen
                    etiqueta="Profesional"
                    valor={
                      profesionalAsignadoNombre
                    }
                  />

                  <FilaResumen
                    etiqueta="Fecha"
                    valor={formatearFechaCompleta(
                      fechaSeleccionada
                    )}
                  />

                  <FilaResumen
                    etiqueta="Hora"
                    valor={horaAMPMDesdeTexto(
                      horaSeleccionada
                    )}
                  />

                  <FilaResumen
                    etiqueta="Duración"
                    valor={`${duracionParaProfesional(
                      profesionalAsignadoId
                    )} minutos`}
                  />

                  {mostrarPrecios && (
                    <FilaResumen
                      etiqueta="Precio"
                      valor={formatearMoneda(
                        precioParaProfesional(
                          profesionalAsignadoId
                        )
                      )}
                    />
                  )}
                </div>

                <div style={styles.politicaCaja}>
                  <strong>Uso de datos personales</strong>

                  <p
                    style={{
                      color: "#667085",
                      lineHeight: 1.5,
                      marginBottom: "12px",
                    }}
                  >
                    Sus datos serán utilizados para registrar,
                    administrar y dar seguimiento a esta reserva.
                  </p>

                  <label style={styles.checkboxFila}>
                    <input
                      type="checkbox"
                      checked={aceptaPrivacidad}
                      onChange={(e) =>
                        setAceptaPrivacidad(e.target.checked)
                      }
                    />

                    <span>
                      Acepto el uso de mis datos para gestionar
                      esta cita.
                    </span>
                  </label>
                </div>

                {configuracion?.cancellation_policy && (
                  <div
                    style={
                      styles.politicaCaja
                    }
                  >
                    <strong>
                      Política de cancelación
                    </strong>

                    <p
                      style={{
                        color:
                          "#667085",
                        lineHeight: 1.5,
                      }}
                    >
                      {
                        configuracion.cancellation_policy
                      }
                    </p>

                    <label
                      style={
                        styles.checkboxFila
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          aceptaPolitica
                        }
                        onChange={(e) =>
                          setAceptaPolitica(
                            e.target.checked
                          )
                        }
                      />

                      <span>
                        He leído y acepto la
                        política de
                        cancelación.
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    guardandoReserva
                  }
                  style={{
                    ...styles.botonConfirmar,

                    background:
                      colorPrincipal,

                    opacity:
                      guardandoReserva
                        ? 0.65
                        : 1,

                    cursor:
                      guardandoReserva
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {guardandoReserva
                    ? "Confirmando reserva..."
                    : "Confirmar cita"}
                </button>
              </form>
            </section>
          )}

        {(negocio.phone ||
          negocio.whatsapp ||
          negocio.email) && (
          <section
            style={styles.contacto}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              Contacto
            </h3>

            <div
              style={
                styles.contactoDatos
              }
            >
              {negocio.phone && (
                <span>
                  ☎ {negocio.phone}
                </span>
              )}

              {negocio.whatsapp && (
                <span>
                  WhatsApp:{" "}
                  {negocio.whatsapp}
                </span>
              )}

              {negocio.email && (
                <span>
                  ✉ {negocio.email}
                </span>
              )}
            </div>
          </section>
        )}

        <footer
          style={styles.footer}
        >
          <strong>CitaTica</strong>

          <span>
            Reservas fáciles para negocios
            de Costa Rica
          </span>
        </footer>
      </div>
    </main>
  );
}

function SelectorVisual({
  seleccionado,
  color,
}: {
  seleccionado: boolean;
  color: string;
}) {
  return (
    <div
      style={{
        ...styles.radio,

        borderColor:
          seleccionado
            ? color
            : "#d0d5dd",
      }}
    >
      {seleccionado && (
        <div
          style={{
            ...styles.radioInterior,
            background: color,
          }}
        />
      )}
    </div>
  );
}

function FilaResumen({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div
      style={
        styles.filaResumen
      }
    >
      <span
        style={{
          color: "#667085",
        }}
      >
        {etiqueta}
      </span>

      <strong>
        {valor}
      </strong>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  main: {
    minHeight: "100vh",
    background: "#f4f6f9",
    fontFamily:
      "Arial, sans-serif",
    color: "#101828",
  },

  topbar: {
    background: "rgba(255,255,255,0.96)",
    borderBottom: "1px solid #eaecf0",
    position: "sticky",
    top: 0,
    zIndex: 30,
    backdropFilter: "blur(10px)",
  },

  topbarInner: {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "12px clamp(16px, 4vw, 28px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },

  topbarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "-0.2px",
  },

  topbarMark: {
    width: "30px",
    height: "30px",
    borderRadius: "9px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 800,
  },

  topbarText: {
    color: "#667085",
    fontSize: "13px",
    fontWeight: 600,
  },

  pantallaCentro: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "Arial, sans-serif",
    padding: "30px",
  },

  cargandoCaja: {
    textAlign: "center",
  },

  errorCaja: {
    width: "100%",
    maxWidth: "550px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "45px",
    textAlign: "center",
  },

  errorTitulo: {
    margin: "20px 0 10px",
  },

  logoMarca: {
    fontSize: "24px",
    fontWeight: 700,
  },

  portada: {
    background: "#ffffff",
    borderBottom: "1px solid #eaecf0",
    paddingBottom: "26px",
  },

  cover: {
    width: "100%",
    height: "clamp(165px, 22vw, 220px)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },

  coverSinImagen: {
    width: "100%",
    height: "clamp(150px, 20vw, 190px)",
  },

  perfilContenedor: {
    maxWidth: "1050px",
    margin: "-52px auto 0",
    padding: "18px clamp(18px, 4vw, 26px)",
    display: "flex",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
    background: "#ffffff",
    border: "1px solid #eaecf0",
    borderRadius: "22px",
    boxShadow: "0 16px 40px rgba(16,24,40,0.10)",
    position: "relative",
    zIndex: 2,
  },

  logoNegocio: {
    width: "clamp(78px, 16vw, 92px)",
    height: "clamp(78px, 16vw, 92px)",
    borderRadius: "18px",
    objectFit: "contain",
    border: "1px solid #eaecf0",
    padding: "6px",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  logoPlaceholder: {
    width: "clamp(78px, 16vw, 92px)",
    height: "clamp(78px, 16vw, 92px)",
    minWidth: "78px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    fontWeight: 700,
    color: "#ffffff",
    border: "1px solid #eaecf0",
  },

  perfilInformacion: {
    paddingTop: 0,
    flex: 1,
    minWidth: "220px",
  },

  citaTica: {
    color: "#667085",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    margin: "0 0 5px",
  },

  nombreNegocio: {
    margin: 0,
    fontSize: "clamp(24px, 5vw, 32px)",
    letterSpacing: "-0.5px",
  },

  descripcionNegocio: {
    color: "#667085",
    margin: "10px 0",
  },

  ubicacion: {
    color: "#475467",
    margin: "10px 0 0",
  },

  progresoWrap: {
    maxWidth: "1050px",
    margin: "18px auto 0",
    padding: "0 clamp(14px, 4vw, 25px)",
  },

  progresoBarra: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #eaecf0",
    borderRadius: "16px",
    padding: "14px 16px",
    boxShadow: "0 8px 24px rgba(16,24,40,0.04)",
  },

  progresoItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
    position: "relative",
  },

  progresoCirculo: {
    width: "28px",
    height: "28px",
    minWidth: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 800,
  },

  progresoLabel: {
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  progresoLinea: {
    height: "1px",
    background: "#eaecf0",
    flex: 1,
    minWidth: "10px",
  },

  contenedor: {
    maxWidth: "1050px",
    margin: "0 auto",
    padding: "22px clamp(14px, 4vw, 25px) 60px",
  },

  aviso: {
    background: "#fff7ed",
    border:
      "1px solid #fed7aa",
    padding: "18px",
    borderRadius: "12px",
    marginBottom: "25px",
    color: "#9a3412",
  },

  errorBanner: {
    background: "#fef3f2",
    border:
      "1px solid #fecdca",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
    color: "#b42318",
  },

  seccion: {
    background: "#ffffff",
    padding: "clamp(20px, 4vw, 30px)",
    borderRadius: "22px",
    marginBottom: "22px",
    border: "1px solid #edf0f4",
    boxShadow: "0 10px 30px rgba(16,24,40,0.05)",
  },

  paso: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#667085",
    letterSpacing: "1px",
    margin: "0 0 8px",
  },

  tituloSeccion: {
    fontSize: "clamp(22px, 5vw, 26px)",
    margin: "0 0 8px",
  },

  textoSecundario: {
    color: "#667085",
    lineHeight: 1.5,
  },

  listaServicios: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "14px",
    marginTop: "20px",
  },

  servicioCard: {
    width: "100%",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    background: "#ffffff",
    minHeight: "118px",
    transition: "all 160ms ease",
  },

  servicioIzquierda: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },

  servicioIcono: {
    width: "88px",
    height: "88px",
    minWidth: "88px",
    borderRadius: "12px",
    background: "#f2f4f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  servicioImagen: {
    width: "88px",
    height: "88px",
    minWidth: "88px",
    borderRadius: "14px",
    objectFit: "cover",
    background: "#f2f4f7",
  },

  servicioInfo: {
    display: "grid",
    gap: "6px",
    minWidth: 0,
  },

  servicioNombre: {
    fontSize: "18px",
    fontWeight: 700,
  },

  servicioDescripcion: {
    color: "#667085",
    fontSize: "14px",
  },

  servicioDatos: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    fontSize: "14px",
    color: "#475467",
  },

  radio: {
    width: "22px",
    height: "22px",
    minWidth: "22px",
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  radioInterior: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },

  gridProfesionales: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "14px",
    marginTop: "22px",
  },

  profesionalBoton: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    display: "grid",
    gridTemplateColumns: "82px minmax(0, 1fr) 24px",
    alignItems: "center",
    gap: "15px",
    cursor: "pointer",
    textAlign: "left",
    background: "#ffffff",
    minHeight: "118px",
    transition: "all 160ms ease",
  },

  profesionalFotoPlaceholder: {
    width: "78px",
    height: "78px",
    minWidth: "78px",
    borderRadius: "50%",
    background: "#f2f4f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  profesionalFoto: {
    width: "78px",
    height: "78px",
    minWidth: "78px",
    borderRadius: "50%",
    objectFit: "cover",
    background: "#f2f4f7",
  },

  profesionalNombre: {
    fontWeight: 800,
    fontSize: "18px",
    letterSpacing: "-0.2px",
  },

  profesionalEspecialidad: {
    color: "#344054",
    fontSize: "14px",
    fontWeight: 600,
    marginTop: "4px",
  },

  profesionalBio: {
    color: "#667085",
    fontSize: "13px",
    lineHeight: 1.45,
    margin: "6px 0",
  },

  profesionalDatos: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    color: "#475467",
    fontSize: "13px",
    marginTop: "8px",
  },

  vacio: {
    border:
      "1px dashed #d0d5dd",
    borderRadius: "14px",
    padding: "35px",
    textAlign: "center",
    color: "#667085",
    marginTop: "20px",
  },

  fechaCaja: {
    marginTop: "22px",
    maxWidth: "320px",
  },

  label: {
    display: "block",
    fontWeight: 600,
    fontSize: "14px",
    marginBottom: "7px",
  },

  fechaInput: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #d0d5dd",
    borderRadius: "9px",
    padding: "12px 13px",
    fontSize: "15px",
  },

  horariosArea: {
    marginTop: "20px",
  },

  horariosGrid: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  horaBoton: {
    minWidth: "100px",
    border:
      "1px solid #d0d5dd",
    borderRadius: "9px",
    padding: "11px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },

  resumenHora: {
    marginTop: "20px",
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    color: "#475467",
  },

  gridDosColumnas: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "0 18px",
    marginTop: "25px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #d0d5dd",
    borderRadius: "9px",
    padding: "12px 13px",
    fontSize: "15px",
    marginBottom: "17px",
    background: "#ffffff",
  },

  resumenReserva: {
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "20px",
    marginTop: "10px",
    marginBottom: "20px",
  },

  filaResumen: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    flexWrap: "wrap",
    padding: "9px 0",
    borderBottom:
      "1px solid #eaecf0",
  },

  politicaCaja: {
    border:
      "1px solid #e4e7ec",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "20px",
  },

  checkboxFila: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    cursor: "pointer",
  },

  botonConfirmar: {
    width: "100%",
    border: "none",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "15px 20px",
    fontWeight: 700,
    fontSize: "16px",
  },

  contacto: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "25px",
    marginTop: "25px",
  },

  contactoDatos: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    color: "#475467",
  },

  footer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    padding:
      "40px 10px 10px",
    color: "#667085",
    fontSize: "13px",
  },

  confirmacionCard: {
    maxWidth: "650px",
    margin: "30px auto",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "clamp(24px, 5vw, 40px)",
    textAlign: "center",
    boxShadow:
      "0 10px 35px rgba(16,24,40,0.08)",
  },

  confirmacionIcono: {
    width: "72px",
    height: "72px",
    margin: "0 auto 20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "34px",
    fontWeight: 700,
  },

  confirmacionTitulo: {
    margin:
      "0 0 10px",
    fontSize: "30px",
  },

  resumenFinal: {
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "20px",
    margin: "25px 0",
    textAlign: "left",
  },

  mensajeConfirmacion: {
    padding: "17px",
    borderRadius: "12px",
    background: "#ecfdf3",
    color: "#067647",
    marginBottom: "20px",
    lineHeight: 1.5,
  },
};