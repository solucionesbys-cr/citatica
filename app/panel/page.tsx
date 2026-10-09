"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Negocio = {
  id: string;
  business_name: string;
  slug: string;
  timezone?: string | null;
};

type ProximaCita = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;

  clients:
    | {
        first_name: string;
        last_name: string | null;
      }
    | {
        first_name: string;
        last_name: string | null;
      }[]
    | null;

  professionals:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;

  appointment_services:
    | {
        service_name_snapshot: string;
      }[]
    | null;
};

type ProfesionalBasico = {
  id: string;
  name: string;
};

type CitaMes = {
  id: string;
  professional_id: string | null;
  start_at: string;
  status: string;
  total: number | string | null;
  appointment_services:
    | {
        service_name_snapshot: string;
      }[]
    | null;
};



type SuscripcionPlan = {
  business_id: string;
  subscription_status: string;
  effective_plan_code: string;
  plan_name: string;
  max_clients: number | null;
  max_services: number | null;
  max_professionals: number | null;
  max_monthly_bookings: number | null;
  max_branches: number | null;
  whatsapp_enabled: boolean;
  reminder_24h_enabled: boolean;
  reminder_2h_enabled: boolean;
  analytics_level: string;
  export_data_enabled: boolean;
  custom_branding_enabled: boolean;
  priority_support_enabled: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_days_remaining: number;
  whatsapp_trial_limit: number;
  whatsapp_trial_used: number;
  whatsapp_trial_remaining: number;
};

type EstadisticasMes = {
  totalCitas: number;
  completadas: number;
  pendientes: number;
  confirmadas: number;
  canceladas: number;
  noShow: number;
  ingresosRealizados: number;
  valorProgramado: number;
  ticketPromedio: number;
  servicioTop: string;
  servicioTopCantidad: number;
  profesionalTop: string;
  profesionalTopCantidad: number;
};

const estadisticasIniciales: EstadisticasMes = {
  totalCitas: 0,
  completadas: 0,
  pendientes: 0,
  confirmadas: 0,
  canceladas: 0,
  noShow: 0,
  ingresosRealizados: 0,
  valorProgramado: 0,
  ticketPromedio: 0,
  servicioTop: "Sin datos",
  servicioTopCantidad: 0,
  profesionalTop: "Sin datos",
  profesionalTopCantidad: 0,
};

export default function PanelPage() {
  const router = useRouter();

  const [negocio, setNegocio] = useState<Negocio | null>(null);

  const [servicios, setServicios] = useState(0);
  const [clientes, setClientes] = useState(0);
  const [profesionales, setProfesionales] = useState(0);
  const [citasHoy, setCitasHoy] = useState(0);
  const [proximasCitas, setProximasCitas] = useState(0);

  const [listaProximas, setListaProximas] = useState<ProximaCita[]>([]);
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasMes>(estadisticasIniciales);

  const [suscripcion, setSuscripcion] =
    useState<SuscripcionPlan | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  useEffect(() => {
    cargarPanel();
  }, []);

  async function cargarPanel() {
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
      .select(`
        business_id,
        businesses (
          id,
          business_name,
          slug,
          timezone
        )
      `)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (miembroError) {
      setError(miembroError.message);
      setCargando(false);
      return;
    }

    if (!miembro) {
      router.replace("/planes");
      return;
    }

    const negocioData = Array.isArray(miembro.businesses)
      ? miembro.businesses[0]
      : miembro.businesses;

    if (!negocioData) {
      setError("No se encontró el negocio asociado al usuario.");
      setCargando(false);
      return;
    }

    setNegocio(negocioData);

    const businessId = negocioData.id;

    await Promise.all([
      cargarServicios(businessId),
      cargarClientes(businessId),
      cargarProfesionales(businessId),
      cargarCitas(businessId),
      cargarProximasCitas(businessId),
      cargarEstadisticasMes(businessId),
      cargarSuscripcion(businessId),
    ]);

    setCargando(false);
  }

  async function cargarServicios(businessId: string) {
    const { count, error } = await supabase
      .from("services")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("business_id", businessId)
      .eq("is_active", true);

    if (error) {
      console.error("Error contando servicios:", error.message);
      return;
    }

    setServicios(count || 0);
  }

  async function cargarClientes(businessId: string) {
    const { count, error } = await supabase
      .from("clients")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("business_id", businessId);

    if (error) {
      console.error("Error contando clientes:", error.message);
      return;
    }

    setClientes(count || 0);
  }

  async function cargarProfesionales(businessId: string) {
    const { count, error } = await supabase
      .from("professionals")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("business_id", businessId)
      .eq("is_active", true);

    if (error) {
      console.error(
        "Error contando profesionales:",
        error.message
      );
      return;
    }

    setProfesionales(count || 0);
  }

  async function cargarCitas(businessId: string) {
    const ahora = new Date();

    const inicioHoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      0,
      0,
      0,
      0
    );

    const finHoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      23,
      59,
      59,
      999
    );

    const { count: countHoy, error: errorHoy } =
      await supabase
        .from("appointments")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("business_id", businessId)
        .gte("start_at", inicioHoy.toISOString())
        .lte("start_at", finHoy.toISOString())
        .not("status", "in", '("CANCELLED","NO_SHOW")');

    if (errorHoy) {
      console.error(
        "Error contando citas de hoy:",
        errorHoy.message
      );
    } else {
      setCitasHoy(countHoy || 0);
    }

    const { count: countProximas, error: errorProximas } =
      await supabase
        .from("appointments")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("business_id", businessId)
        .gt("start_at", finHoy.toISOString())
        .not("status", "in", '("CANCELLED","NO_SHOW")');

    if (errorProximas) {
      console.error(
        "Error contando próximas citas:",
        errorProximas.message
      );
    } else {
      setProximasCitas(countProximas || 0);
    }
  }

  async function cargarProximasCitas(businessId: string) {
    const ahora = new Date();

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        end_at,
        status,
        clients (
          first_name,
          last_name
        ),
        professionals (
          name
        ),
        appointment_services (
          service_name_snapshot
        )
      `)
      .eq("business_id", businessId)
      .gte("start_at", ahora.toISOString())
      .not("status", "in", '("CANCELLED","NO_SHOW")')
      .order("start_at", { ascending: true })
      .limit(5);

    if (error) {
      console.error(
        "Error cargando próximas citas:",
        error.message
      );
      return;
    }

    setListaProximas((data || []) as ProximaCita[]);
  }

  async function cargarEstadisticasMes(businessId: string) {
    const ahora = new Date();

    const inicioMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    const inicioMesSiguiente = new Date(
      ahora.getFullYear(),
      ahora.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );

    const [resultadoCitas, resultadoProfesionales] = await Promise.all([
      supabase
        .from("appointments")
        .select(`
          id,
          professional_id,
          start_at,
          status,
          total,
          appointment_services (
            service_name_snapshot
          )
        `)
        .eq("business_id", businessId)
        .gte("start_at", inicioMes.toISOString())
        .lt("start_at", inicioMesSiguiente.toISOString()),

      supabase
        .from("professionals")
        .select("id, name")
        .eq("business_id", businessId),
    ]);

    if (resultadoCitas.error) {
      console.error(
        "Error cargando estadísticas mensuales:",
        resultadoCitas.error.message
      );
      return;
    }

    if (resultadoProfesionales.error) {
      console.error(
        "Error cargando profesionales para estadísticas:",
        resultadoProfesionales.error.message
      );
    }

    const citasMes = (resultadoCitas.data || []) as CitaMes[];
    const listaProfesionales =
      (resultadoProfesionales.data || []) as ProfesionalBasico[];

    let completadas = 0;
    let pendientes = 0;
    let confirmadas = 0;
    let canceladas = 0;
    let noShow = 0;
    let ingresosRealizados = 0;
    let valorProgramado = 0;

    const serviciosConteo = new Map<string, number>();
    const profesionalesConteo = new Map<string, number>();

    for (const cita of citasMes) {
      const total = Number(cita.total || 0);

      if (cita.status === "COMPLETED") {
        completadas += 1;
        ingresosRealizados += total;
      }

      if (cita.status === "PENDING") {
        pendientes += 1;
      }

      if (
        cita.status === "CONFIRMED" ||
        cita.status === "CHECKED_IN" ||
        cita.status === "IN_PROGRESS"
      ) {
        confirmadas += 1;
      }

      if (cita.status === "CANCELLED") {
        canceladas += 1;
      }

      if (cita.status === "NO_SHOW") {
        noShow += 1;
      }

      if (
        cita.status !== "CANCELLED" &&
        cita.status !== "NO_SHOW"
      ) {
        valorProgramado += total;
      }

      if (
        cita.status !== "CANCELLED" &&
        cita.status !== "NO_SHOW"
      ) {
        const serviciosCita = cita.appointment_services || [];

        for (const servicio of serviciosCita) {
          const nombre =
            servicio.service_name_snapshot || "Servicio";

          serviciosConteo.set(
            nombre,
            (serviciosConteo.get(nombre) || 0) + 1
          );
        }

        if (cita.professional_id) {
          profesionalesConteo.set(
            cita.professional_id,
            (profesionalesConteo.get(cita.professional_id) || 0) + 1
          );
        }
      }
    }

    let servicioTop = "Sin datos";
    let servicioTopCantidad = 0;

    for (const [nombre, cantidad] of serviciosConteo.entries()) {
      if (cantidad > servicioTopCantidad) {
        servicioTop = nombre;
        servicioTopCantidad = cantidad;
      }
    }

    let profesionalTopId = "";
    let profesionalTopCantidad = 0;

    for (const [id, cantidad] of profesionalesConteo.entries()) {
      if (cantidad > profesionalTopCantidad) {
        profesionalTopId = id;
        profesionalTopCantidad = cantidad;
      }
    }

    const profesionalTop =
      listaProfesionales.find(
        (profesional) => profesional.id === profesionalTopId
      )?.name || "Sin datos";

    setEstadisticas({
      totalCitas: citasMes.length,
      completadas,
      pendientes,
      confirmadas,
      canceladas,
      noShow,
      ingresosRealizados,
      valorProgramado,
      ticketPromedio:
        completadas > 0
          ? ingresosRealizados / completadas
          : 0,
      servicioTop,
      servicioTopCantidad,
      profesionalTop,
      profesionalTopCantidad,
    });
  }

  async function cargarSuscripcion(businessId: string) {
    const { data, error } = await supabase.rpc(
      "get_effective_business_plan",
      {
        p_business_id: businessId,
      }
    );

    if (error) {
      console.error(
        "Error cargando plan del negocio:",
        error.message
      );
      return;
    }

    const planData = Array.isArray(data) ? data[0] : data;

    if (planData) {
      setSuscripcion(planData as SuscripcionPlan);
    }
  }

  function textoLimite(
    usado: number,
    limite: number | null
  ) {
    if (limite === null) {
      return `${usado} / Ilimitado`;
    }

    return `${usado} / ${limite}`;
  }

  function porcentajeUso(
    usado: number,
    limite: number | null
  ) {
    if (limite === null || limite <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((usado / limite) * 100));
  }

  const enlaceReservas = useMemo(() => {
    if (!negocio?.slug || typeof window === "undefined") return "";
    return `${window.location.origin}/reservar/${negocio.slug}`;
  }, [negocio?.slug]);

  async function copiarEnlaceReservas() {
    if (!enlaceReservas) return;

    try {
      await navigator.clipboard.writeText(enlaceReservas);
      setEnlaceCopiado(true);
      window.setTimeout(() => setEnlaceCopiado(false), 1800);
    } catch (error) {
      console.error("No se pudo copiar el enlace de reservas:", error);
    }
  }

  function abrirPaginaReservas() {
    if (!enlaceReservas) return;
    window.open(enlaceReservas, "_blank", "noopener,noreferrer");
  }

  function compartirReservasWhatsApp() {
    if (!enlaceReservas) return;

    const mensaje = `Reserva tu cita en ${negocio?.business_name || "nuestro negocio"}: ${enlaceReservas}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function obtenerCliente(cita: ProximaCita) {
    return Array.isArray(cita.clients)
      ? cita.clients[0]
      : cita.clients;
  }

  function obtenerProfesional(cita: ProximaCita) {
    return Array.isArray(cita.professionals)
      ? cita.professionals[0]
      : cita.professionals;
  }

  function obtenerServicio(cita: ProximaCita) {
    return cita.appointment_services?.[0] || null;
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString("es-CR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function formatearHora(fecha: string) {
    return new Date(fecha).toLocaleTimeString("es-CR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const nombreMes = useMemo(() => {
    const nombre = new Date().toLocaleDateString("es-CR", {
      month: "long",
      year: "numeric",
    });

    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }, []);

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <p style={{ color: "#667085", fontSize: "16px" }}>
          Cargando CitaTica...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={pantallaErrorStyle}>
        <h1>Error al cargar el panel</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={contenedorStyle}>
        <header style={headerStyle}>
          <div>
            <p style={marcaStyle}>CitaTica</p>

            <h1 style={nombreNegocioStyle}>
              {negocio?.business_name || "Mi negocio"}
            </h1>

            <p style={bienvenidaStyle}>
              Resumen de actividad de su negocio.
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            style={cerrarSesionStyle}
          >
            Cerrar sesión
          </button>
        </header>

        {suscripcion && (
          <section style={suscripcionPanelStyle}>
            <div style={suscripcionSuperiorStyle}>
              <div>
                <div style={suscripcionEtiquetaStyle}>
                  {suscripcion.subscription_status === "TRIAL"
                    ? "PRUEBA PREMIUM"
                    : `PLAN ${suscripcion.plan_name.toUpperCase()}`}
                </div>

                <h2 style={suscripcionTituloStyle}>
                  {suscripcion.subscription_status === "TRIAL"
                    ? `Estás disfrutando CitaTica ${suscripcion.plan_name} gratis`
                    : `Tu negocio está en CitaTica ${suscripcion.plan_name}`}
                </h2>

                <p style={suscripcionDescripcionStyle}>
                  {suscripcion.subscription_status === "TRIAL"
                    ? suscripcion.trial_days_remaining > 0
                      ? `Te quedan ${suscripcion.trial_days_remaining} días de prueba. WhatsApp, recordatorios y funciones ${suscripcion.plan_name} están habilitados.`
                      : "Tu período de prueba ha terminado. Tu negocio continuará con las funciones de tu plan disponible."
                    : "Consulta el uso actual de las principales capacidades de tu plan."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/planes")}
                style={verPlanesStyle}
              >
                Ver planes
              </button>
            </div>

            <div style={usoPlanGridStyle}>
              <UsoPlan
                titulo="Clientes"
                valor={textoLimite(clientes, suscripcion.max_clients)}
                porcentaje={porcentajeUso(clientes, suscripcion.max_clients)}
              />

              <UsoPlan
                titulo="Servicios"
                valor={textoLimite(servicios, suscripcion.max_services)}
                porcentaje={porcentajeUso(servicios, suscripcion.max_services)}
              />

              <UsoPlan
                titulo="Profesionales"
                valor={textoLimite(
                  profesionales,
                  suscripcion.max_professionals
                )}
                porcentaje={porcentajeUso(
                  profesionales,
                  suscripcion.max_professionals
                )}
              />

              {suscripcion.subscription_status === "TRIAL" &&
                suscripcion.whatsapp_enabled && (
                  <UsoPlan
                    titulo="WhatsApp de prueba"
                    valor={`${suscripcion.whatsapp_trial_used} / ${suscripcion.whatsapp_trial_limit}`}
                    porcentaje={porcentajeUso(
                      suscripcion.whatsapp_trial_used,
                      suscripcion.whatsapp_trial_limit
                    )}
                  />
                )}
            </div>
          </section>
        )}

        <section
          style={{
            ...panelBlancoStyle,
            marginBottom: "28px",
          }}
        >
          <h2 style={tituloSeccionStyle}>
            Prepare su negocio para recibir citas
          </h2>

          <p style={textoSecundarioStyle}>
            Le recomendamos seguir este orden para dejar CitaTica listo.
          </p>

          <div style={accesosGridStyle}>
            <Boton
              icono="⚙️"
              texto="1. Configure su negocio"
              descripcion="Datos, logo y contacto"
              onClick={() =>
                router.push("/panel/configuracion")
              }
            />

            <Boton
              icono="✂️"
              texto="2. Agregue sus servicios"
              descripcion="Precios y duración"
              onClick={() =>
                router.push("/panel/servicios")
              }
            />

            <Boton
              icono="👥"
              texto="3. Profesionales y horarios"
              descripcion="Equipo y disponibilidad"
              onClick={() =>
                router.push("/panel/profesionales")
              }
            />

            <Boton
              icono="🔗"
              texto="4. Comparta su página"
              descripcion="Reservas online"
              onClick={abrirPaginaReservas}
            />

            <Boton
              icono="📋"
              texto="Agenda"
              descripcion="Gestionar citas"
              onClick={() =>
                router.push("/panel/agenda")
              }
            />

            <Boton
              icono="📅"
              texto="Calendario"
              descripcion="Día y semana"
              onClick={() =>
                router.push("/panel/agenda/calendario")
              }
            />

            <Boton
              icono="🧑"
              texto="Clientes"
              descripcion="Base de clientes"
              onClick={() =>
                router.push("/panel/clientes")
              }
            />
          </div>
        </section>

        <section style={tarjetasGridStyle}>
          <Tarjeta
            titulo="Citas de hoy"
            valor={String(citasHoy)}
            texto="Agenda de hoy"
            onClick={() => router.push("/panel/agenda")}
          />

          <Tarjeta
            titulo="Próximas citas"
            valor={String(proximasCitas)}
            texto="Citas futuras"
            onClick={() => router.push("/panel/agenda/calendario")}
          />

          <Tarjeta
            titulo="Clientes"
            valor={String(clientes)}
            texto="Clientes registrados"
            onClick={() => router.push("/panel/clientes")}
          />

          <Tarjeta
            titulo="Servicios"
            valor={String(servicios)}
            texto="Servicios activos"
            onClick={() => router.push("/panel/servicios")}
          />

          <Tarjeta
            titulo="Profesionales"
            valor={String(profesionales)}
            texto="Equipo activo"
            onClick={() => router.push("/panel/profesionales")}
          />
        </section>

        <section style={reservasPanelStyle}>
          <div style={reservasContenidoStyle}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={reservasEtiquetaStyle}>RESERVAS EN LÍNEA</div>
              <h2 style={reservasTituloStyle}>Mi página de reservas</h2>
              <p style={reservasDescripcionStyle}>
                Comparta este enlace para que sus clientes reserven una cita
                directamente con su negocio.
              </p>

              <div style={reservasUrlStyle}>
                {enlaceReservas || "Preparando enlace de reservas..."}
              </div>
            </div>

            <div style={reservasAccionesStyle}>
              <button
                type="button"
                onClick={copiarEnlaceReservas}
                style={reservasBotonPrincipalStyle}
                disabled={!enlaceReservas}
              >
                {enlaceCopiado ? "✓ Copiado" : "Copiar enlace"}
              </button>

              <button
                type="button"
                onClick={abrirPaginaReservas}
                style={reservasBotonStyle}
                disabled={!enlaceReservas}
              >
                Abrir página
              </button>

              <button
                type="button"
                onClick={compartirReservasWhatsApp}
                style={reservasBotonWhatsappStyle}
                disabled={!enlaceReservas}
              >
                WhatsApp
              </button>
            </div>
          </div>
        </section>

        <section style={estadisticasPanelStyle}>
          <div style={estadisticasEncabezadoStyle}>
            <div>
              <h2 style={tituloSeccionStyle}>
                Estadísticas del negocio
              </h2>

              <p style={textoSecundarioSinMargenStyle}>
                Resumen de {nombreMes}.
              </p>
            </div>

            <div style={periodoBadgeStyle}>
              {nombreMes}
            </div>
          </div>

          <div style={metricasFinancierasGridStyle}>
            <Metrica
              titulo="Ingresos realizados"
              valor={formatearColones(
                estadisticas.ingresosRealizados
              )}
              descripcion="Solo citas completadas"
            />

            <Metrica
              titulo="Valor programado"
              valor={formatearColones(
                estadisticas.valorProgramado
              )}
              descripcion="Excluye canceladas y no asistidas"
            />

            <Metrica
              titulo="Ticket promedio"
              valor={formatearColones(
                estadisticas.ticketPromedio
              )}
              descripcion="Promedio de citas completadas"
            />

            <Metrica
              titulo="Citas del mes"
              valor={String(estadisticas.totalCitas)}
              descripcion="Todos los estados"
            />
          </div>

          <div style={estadisticasDetalleGridStyle}>
            <div style={subPanelStyle}>
              <h3 style={subTituloStyle}>
                Estado de las citas
              </h3>

              <div style={estadoGridStyle}>
                <EstadoMini
                  titulo="Completadas"
                  valor={estadisticas.completadas}
                  tipo="positivo"
                />

                <EstadoMini
                  titulo="Pendientes"
                  valor={estadisticas.pendientes}
                  tipo="neutral"
                />

                <EstadoMini
                  titulo="Confirmadas / en atención"
                  valor={estadisticas.confirmadas}
                  tipo="azul"
                />

                <EstadoMini
                  titulo="Canceladas"
                  valor={estadisticas.canceladas}
                  tipo="negativo"
                />

                <EstadoMini
                  titulo="No asistió"
                  valor={estadisticas.noShow}
                  tipo="negativo"
                />
              </div>
            </div>

            <div style={subPanelStyle}>
              <h3 style={subTituloStyle}>
                Rendimiento
              </h3>

              <div style={rankingFilaStyle}>
                <div>
                  <span style={rankingEtiquetaStyle}>
                    Servicio más solicitado
                  </span>

                  <strong style={rankingValorStyle}>
                    {estadisticas.servicioTop}
                  </strong>
                </div>

                <span style={rankingNumeroStyle}>
                  {estadisticas.servicioTopCantidad}
                </span>
              </div>

              <div style={rankingSeparadorStyle} />

              <div style={rankingFilaStyle}>
                <div>
                  <span style={rankingEtiquetaStyle}>
                    Profesional con más citas
                  </span>

                  <strong style={rankingValorStyle}>
                    {estadisticas.profesionalTop}
                  </strong>
                </div>

                <span style={rankingNumeroStyle}>
                  {estadisticas.profesionalTopCantidad}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div style={contenidoGridStyle}>
          <section style={panelBlancoStyle}>
            <div style={tituloSeccionFilaStyle}>
              <div>
                <h2 style={tituloSeccionStyle}>
                  Próximas citas
                </h2>

                <p style={textoSecundarioStyle}>
                  Las siguientes citas programadas.
                </p>
              </div>

              <div style={accionesAgendaStyle}>
                <button
                  type="button"
                  onClick={() =>
                    router.push("/panel/agenda/calendario")
                  }
                  style={verAgendaStyle}
                >
                  📅 Calendario
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/panel/agenda")}
                  style={verAgendaStyle}
                >
                  Ver agenda
                </button>
              </div>
            </div>

            {listaProximas.length === 0 ? (
              <div style={vacioStyle}>
                <div style={{ fontSize: "32px" }}>
                  📅
                </div>

                <strong>No hay próximas citas</strong>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#667085",
                  }}
                >
                  Las nuevas citas aparecerán aquí.
                </p>
              </div>
            ) : (
              <div>
                {listaProximas.map((cita) => {
                  const cliente = obtenerCliente(cita);
                  const profesional = obtenerProfesional(cita);
                  const servicio = obtenerServicio(cita);

                  return (
                    <div
                      key={cita.id}
                      style={citaFilaStyle}
                    >
                      <div style={fechaCitaStyle}>
                        <strong>
                          {formatearHora(cita.start_at)}
                        </strong>

                        <span>
                          {formatearFecha(cita.start_at)}
                        </span>
                      </div>

                      <div style={{ flex: 1 }}>
                        <strong style={clienteStyle}>
                          {cliente
                            ? `${cliente.first_name}${
                                cliente.last_name
                                  ? ` ${cliente.last_name}`
                                  : ""
                              }`
                            : "Cliente"}
                        </strong>

                        <div style={detalleStyle}>
                          {servicio?.service_name_snapshot ||
                            "Servicio"}
                          {profesional?.name
                            ? ` · ${profesional.name}`
                            : ""}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/panel/agenda/${cita.id}`
                          )
                        }
                        style={botonVerStyle}
                      >
                        Ver
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}

function Tarjeta({
  titulo,
  valor,
  texto,
  onClick,
}: {
  titulo: string;
  valor: string;
  texto: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={tarjetaStyle}
    >
      <p style={tarjetaTituloStyle}>
        {titulo}
      </p>

      <div style={tarjetaValorStyle}>
        {valor}
      </div>

      <p style={tarjetaTextoStyle}>
        {texto}
      </p>
    </button>
  );
}

function Boton({
  icono,
  texto,
  descripcion,
  onClick,
}: {
  icono: string;
  texto: string;
  descripcion: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={botonAccesoStyle}
    >
      <span style={botonAccesoIconoStyle}>{icono}</span>

      <span style={botonAccesoContenidoStyle}>
        <strong style={botonAccesoTituloStyle}>
          {texto}
        </strong>

        <span style={botonAccesoDescripcionStyle}>
          {descripcion}
        </span>
      </span>
    </button>
  );
}

function UsoPlan({
  titulo,
  valor,
  porcentaje,
}: {
  titulo: string;
  valor: string;
  porcentaje: number;
}) {
  return (
    <div style={usoPlanItemStyle}>
      <div style={usoPlanFilaStyle}>
        <span style={usoPlanTituloStyle}>{titulo}</span>
        <strong style={usoPlanValorStyle}>{valor}</strong>
      </div>

      <div style={usoPlanBarraStyle}>
        <div
          style={{
            ...usoPlanBarraRellenoStyle,
            width: `${porcentaje}%`,
          }}
        />
      </div>
    </div>
  );
}

function Metrica({
  titulo,
  valor,
  descripcion,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
}) {
  return (
    <div style={metricaStyle}>
      <span style={metricaTituloStyle}>
        {titulo}
      </span>

      <strong style={metricaValorStyle}>
        {valor}
      </strong>

      <span style={metricaDescripcionStyle}>
        {descripcion}
      </span>
    </div>
  );
}

function EstadoMini({
  titulo,
  valor,
  tipo,
}: {
  titulo: string;
  valor: number;
  tipo: "positivo" | "neutral" | "azul" | "negativo";
}) {
  const estilos = {
    positivo: {
      background: "#ecfdf3",
      color: "#067647",
    },
    neutral: {
      background: "#f2f4f7",
      color: "#344054",
    },
    azul: {
      background: "#eff8ff",
      color: "#175cd3",
    },
    negativo: {
      background: "#fef3f2",
      color: "#b42318",
    },
  }[tipo];

  return (
    <div
      style={{
        ...estadoMiniStyle,
        background: estilos.background,
        color: estilos.color,
      }}
    >
      <span style={estadoMiniTituloStyle}>
        {titulo}
      </span>

      <strong style={estadoMiniNumeroStyle}>
        {valor}
      </strong>
    </div>
  );
}

function formatearColones(valor: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

const pantallaCargaStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
};

const pantallaErrorStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "40px",
  fontFamily: "Arial, sans-serif",
};

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  padding: "35px clamp(12px, 4vw, 20px) 70px",
};

const contenedorStyle: React.CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
  gap: "20px",
};

const marcaStyle: React.CSSProperties = {
  margin: 0,
  color: "#667085",
  fontSize: "14px",
};

const nombreNegocioStyle: React.CSSProperties = {
  margin: "5px 0 0",
  fontSize: "38px",
  color: "#101828",
  fontWeight: "500",
};

const bienvenidaStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  fontSize: "15px",
};

const cerrarSesionStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  padding: "11px 18px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: "600",
  color: "#101828",
};

const suscripcionPanelStyle: React.CSSProperties = {
  marginBottom: "28px",
  padding: "24px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, #eef7ff 0%, #f2fffa 100%)",
  border: "1px solid #cfe5ff",
  boxShadow: "0 10px 30px rgba(0,102,255,0.08)",
};

const suscripcionSuperiorStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
};

const suscripcionEtiquetaStyle: React.CSSProperties = {
  color: "#0066ff",
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "1px",
  marginBottom: "7px",
};

const suscripcionTituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#042a6b",
  fontSize: "23px",
  lineHeight: 1.25,
};

const suscripcionDescripcionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#475467",
  fontSize: "14px",
  lineHeight: 1.6,
  maxWidth: "760px",
};

const verPlanesStyle: React.CSSProperties = {
  border: "none",
  background: "#0066ff",
  color: "#ffffff",
  padding: "11px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const usoPlanGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "12px",
  marginTop: "20px",
};

const usoPlanItemStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(0,102,255,0.10)",
  borderRadius: "12px",
  padding: "13px",
};

const usoPlanFilaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const usoPlanTituloStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "12px",
  fontWeight: "600",
};

const usoPlanValorStyle: React.CSSProperties = {
  color: "#042a6b",
  fontSize: "13px",
};

const usoPlanBarraStyle: React.CSSProperties = {
  height: "6px",
  background: "#e7eef8",
  borderRadius: "999px",
  overflow: "hidden",
  marginTop: "10px",
};

const usoPlanBarraRellenoStyle: React.CSSProperties = {
  height: "100%",
  background: "#0066ff",
  borderRadius: "999px",
  transition: "width 0.25s ease",
};

const tarjetasGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
  gap: "18px",
  marginBottom: "28px",
  width: "100%",
};

const tarjetaStyle: React.CSSProperties = {
  textAlign: "left",
  border: "none",
  background: "#ffffff",
  padding: "23px",
  borderRadius: "16px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  cursor: "pointer",
};

const tarjetaTituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#667085",
  fontSize: "14px",
};

const tarjetaValorStyle: React.CSSProperties = {
  marginTop: "9px",
  fontSize: "32px",
  fontWeight: "700",
  color: "#101828",
};

const tarjetaTextoStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#98a2b3",
  fontSize: "12px",
};

const reservasPanelStyle: React.CSSProperties = {
  marginBottom: "28px",
  padding: "24px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #eef7ff 0%, #f4fffb 100%)",
  border: "1px solid #cfe5ff",
  boxShadow: "0 8px 24px rgba(0,102,255,0.07)",
};

const reservasContenidoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
};

const reservasEtiquetaStyle: React.CSSProperties = {
  color: "#0066ff",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.9px",
  marginBottom: "7px",
};

const reservasTituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "21px",
};

const reservasDescripcionStyle: React.CSSProperties = {
  margin: "7px 0 12px",
  color: "#667085",
  fontSize: "14px",
  lineHeight: 1.5,
};

const reservasUrlStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.88)",
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  padding: "11px 13px",
  color: "#344054",
  fontSize: "13px",
  overflowWrap: "anywhere",
};

const reservasAccionesStyle: React.CSSProperties = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap",
};

const reservasBotonPrincipalStyle: React.CSSProperties = {
  border: "none",
  background: "#0066ff",
  color: "#ffffff",
  padding: "11px 15px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const reservasBotonStyle: React.CSSProperties = {
  border: "1px solid #b9c3d0",
  background: "#ffffff",
  color: "#101828",
  padding: "11px 15px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const reservasBotonWhatsappStyle: React.CSSProperties = {
  border: "1px solid #b7e4c7",
  background: "#f0fff4",
  color: "#137a42",
  padding: "11px 15px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};

const estadisticasPanelStyle: React.CSSProperties = {
  background: "#ffffff",
  padding: "clamp(18px, 4vw, 28px)",
  borderRadius: "18px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  marginBottom: "28px",
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
};

const estadisticasEncabezadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "22px",
  flexWrap: "wrap",
};

const textoSecundarioSinMargenStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#667085",
  fontSize: "14px",
};

const periodoBadgeStyle: React.CSSProperties = {
  background: "#f2f4f7",
  color: "#344054",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "700",
};

const metricasFinancierasGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
  gap: "14px",
  marginBottom: "20px",
  width: "100%",
};

const metricaStyle: React.CSSProperties = {
  border: "1px solid #eaecf0",
  borderRadius: "14px",
  padding: "18px",
  background: "#f9fafb",
};

const metricaTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "13px",
};

const metricaValorStyle: React.CSSProperties = {
  display: "block",
  color: "#101828",
  fontSize: "26px",
  marginTop: "7px",
};

const metricaDescripcionStyle: React.CSSProperties = {
  display: "block",
  color: "#98a2b3",
  fontSize: "11px",
  marginTop: "6px",
  lineHeight: 1.4,
};

const estadisticasDetalleGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: "16px",
  width: "100%",
};

const subPanelStyle: React.CSSProperties = {
  border: "1px solid #eaecf0",
  borderRadius: "14px",
  padding: "19px",
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const subTituloStyle: React.CSSProperties = {
  margin: "0 0 15px",
  fontSize: "16px",
  color: "#101828",
};

const estadoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
  gap: "9px",
  width: "100%",
};

const estadoMiniStyle: React.CSSProperties = {
  borderRadius: "11px",
  padding: "13px",
};

const estadoMiniTituloStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: "600",
  lineHeight: 1.35,
  minHeight: "30px",
};

const estadoMiniNumeroStyle: React.CSSProperties = {
  display: "block",
  fontSize: "23px",
  marginTop: "4px",
};

const rankingFilaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  minWidth: 0,
};

const rankingEtiquetaStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "12px",
  marginBottom: "6px",
};

const rankingValorStyle: React.CSSProperties = {
  display: "block",
  color: "#101828",
  fontSize: "15px",
  overflowWrap: "anywhere",
};

const rankingNumeroStyle: React.CSSProperties = {
  minWidth: "42px",
  height: "42px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "12px",
  background: "#f2f4f7",
  color: "#101828",
  fontWeight: "700",
};

const rankingSeparadorStyle: React.CSSProperties = {
  height: "1px",
  background: "#eaecf0",
  margin: "17px 0",
};

const contenidoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
  gap: "22px",
  alignItems: "start",
  width: "100%",
};

const panelBlancoStyle: React.CSSProperties = {
  background: "#ffffff",
  padding: "clamp(18px, 4vw, 28px)",
  borderRadius: "18px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
};

const tituloSeccionFilaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
};

const tituloSeccionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "21px",
  color: "#101828",
};

const textoSecundarioStyle: React.CSSProperties = {
  margin: "6px 0 20px",
  color: "#667085",
  fontSize: "14px",
};

const accionesAgendaStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const verAgendaStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "600",
  color: "#101828",
};

const vacioStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "50px 15px",
  background: "#f9fafb",
  borderRadius: "12px",
};

const citaFilaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  padding: "16px 0",
  borderBottom: "1px solid #eaecf0",
};

const fechaCitaStyle: React.CSSProperties = {
  minWidth: "105px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  color: "#101828",
  fontSize: "14px",
};

const clienteStyle: React.CSSProperties = {
  color: "#101828",
  fontSize: "15px",
};

const detalleStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#667085",
  fontSize: "13px",
};

const botonVerStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  color: "#101828",
  fontWeight: "600",
};

const accesosGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  width: "100%",
};

const botonAccesoStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "13px",
  border: "1px solid #eaecf0",
  borderRadius: "12px",
  background: "#ffffff",
  cursor: "pointer",
  minWidth: 0,
  minHeight: "92px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: "10px",
  boxSizing: "border-box",
};

const botonAccesoIconoStyle: React.CSSProperties = {
  fontSize: "20px",
  lineHeight: 1,
};

const botonAccesoContenidoStyle: React.CSSProperties = {
  display: "block",
  minWidth: 0,
};

const botonAccesoTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#101828",
  fontSize: "14px",
  lineHeight: 1.25,
};

const botonAccesoDescripcionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#667085",
  fontSize: "11px",
  lineHeight: 1.3,
};
