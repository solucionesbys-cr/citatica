"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Cliente = {
  id: string;
  business_id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  birth_date: string | null;
  notes: string | null;
  marketing_consent: boolean;
  privacy_consent: boolean;
  privacy_consent_at: string | null;
  created_at: string;
  updated_at: string;
};

type Cita = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  total: number;
  professional_id: string | null;
  customer_notes: string | null;
};

type Profesional = {
  id: string;
  name: string;
};

type ServicioCita = {
  id: string;
  appointment_id: string;
  service_name_snapshot: string;
  price: number;
  duration_minutes: number;
};

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();

  const idParam = params?.id;
  const clienteId = Array.isArray(idParam) ? idParam[0] : idParam;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [servicios, setServicios] = useState<ServicioCita[]>([]);

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (!clienteId) return;

    cargarCliente();
  }, [clienteId]);

  async function cargarCliente() {
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

    const { data: clienteData, error: clienteError } =
      await supabase
        .from("clients")
        .select(`
          id,
          business_id,
          first_name,
          last_name,
          phone,
          whatsapp,
          email,
          birth_date,
          notes,
          marketing_consent,
          privacy_consent,
          privacy_consent_at,
          created_at,
          updated_at
        `)
        .eq("id", clienteId)
        .in("business_id", businessIds)
        .maybeSingle();

    if (clienteError) {
      setError(clienteError.message);
      setCargando(false);
      return;
    }

    if (!clienteData) {
      setError("No se encontró el cliente.");
      setCargando(false);
      return;
    }

    setCliente(clienteData);

    setNombre(clienteData.first_name || "");
    setApellidos(clienteData.last_name || "");
    setTelefono(clienteData.phone || "");
    setWhatsapp(clienteData.whatsapp || "");
    setEmail(clienteData.email || "");
    setFechaNacimiento(clienteData.birth_date || "");
    setNotas(clienteData.notes || "");

    const { data: citasData, error: citasError } = await supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        end_at,
        status,
        total,
        professional_id,
        customer_notes
      `)
      .eq("business_id", clienteData.business_id)
      .eq("client_id", clienteData.id)
      .order("start_at", { ascending: false });

    if (citasError) {
      console.error(citasError.message);
    }

    setCitas(citasData || []);

    const professionalIds = Array.from(
      new Set(
        (citasData || [])
          .map((cita) => cita.professional_id)
          .filter(Boolean)
      )
    ) as string[];

    if (professionalIds.length > 0) {
      const { data: profesionalesData } = await supabase
        .from("professionals")
        .select("id, name")
        .in("id", professionalIds);

      setProfesionales(profesionalesData || []);
    } else {
      setProfesionales([]);
    }

    const appointmentIds = (citasData || []).map((cita) => cita.id);

    if (appointmentIds.length > 0) {
      const { data: serviciosData } = await supabase
        .from("appointment_services")
        .select(`
          id,
          appointment_id,
          service_name_snapshot,
          price,
          duration_minutes
        `)
        .in("appointment_id", appointmentIds)
        .order("created_at");

      setServicios(serviciosData || []);
    } else {
      setServicios([]);
    }

    setCargando(false);
  }

  async function guardarCliente() {
    if (!cliente) return;

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from("clients")
      .update({
        first_name: nombre.trim(),
        last_name: apellidos.trim() || null,
        phone: telefono.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        birth_date: fechaNacimiento || null,
        notes: notas.trim() || null,
      })
      .eq("id", cliente.id)
      .eq("business_id", cliente.business_id);

    if (error) {
      setError(error.message);
      setGuardando(false);
      return;
    }

    setCliente({
      ...cliente,
      first_name: nombre.trim(),
      last_name: apellidos.trim() || null,
      phone: telefono.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      birth_date: fechaNacimiento || null,
      notes: notas.trim() || null,
    });

    setEditando(false);
    setMensaje("Cliente actualizado correctamente.");
    setGuardando(false);
  }

  const nombreCompleto = useMemo(() => {
    if (!cliente) return "";

    return [cliente.first_name, cliente.last_name]
      .filter(Boolean)
      .join(" ");
  }, [cliente]);

  const ahora = useMemo(() => new Date(), [citas]);

  const citasFuturas = useMemo(() => {
    return citas
      .filter(
        (cita) =>
          new Date(cita.start_at) >= ahora &&
          cita.status !== "CANCELLED"
      )
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() -
          new Date(b.start_at).getTime()
      );
  }, [citas, ahora]);

  const citasPasadas = useMemo(() => {
    return citas
      .filter((cita) => new Date(cita.start_at) < ahora)
      .sort(
        (a, b) =>
          new Date(b.start_at).getTime() -
          new Date(a.start_at).getTime()
      );
  }, [citas, ahora]);

  const citasCanceladas = useMemo(() => {
    return citas.filter((cita) => cita.status === "CANCELLED");
  }, [citas]);

  function servicioDeCita(citaId: string) {
    return servicios
      .filter((servicio) => servicio.appointment_id === citaId)
      .map((servicio) => servicio.service_name_snapshot)
      .join(", ");
  }

  function profesionalDeCita(professionalId: string | null) {
    if (!professionalId) return "Sin asignar";

    return (
      profesionales.find((item) => item.id === professionalId)?.name ||
      "Sin asignar"
    );
  }

  function nuevaCita() {
    if (!cliente) return;

    router.push(`/panel/agenda?cliente=${cliente.id}`);
  }

  if (cargando) {
    return (
      <main style={styles.centroPantalla}>
        Cargando cliente...
      </main>
    );
  }

  if (error && !cliente) {
    return (
      <main style={styles.main}>
        <div style={styles.contenedor}>
          <button
            type="button"
            onClick={() => router.push("/panel/clientes")}
            style={styles.volver}
          >
            ← Volver a clientes
          </button>

          <div style={styles.error}>{error}</div>
        </div>
      </main>
    );
  }

  if (!cliente) return null;

  return (
    <main style={styles.main}>
      <div style={styles.contenedor}>
        <button
          type="button"
          onClick={() => router.push("/panel/clientes")}
          style={styles.volver}
        >
          ← Volver a clientes
        </button>

        <header style={styles.encabezado}>
          <div>
            <p style={styles.marca}>CitaTica</p>

            <h1 style={styles.titulo}>{nombreCompleto}</h1>

            <p style={styles.subtitulo}>
              Consulte los datos y el historial de este cliente.
            </p>
          </div>

          <div style={styles.accionesCabecera}>
            {(cliente.whatsapp || cliente.phone) && (
              <a
                href={crearEnlaceWhatsApp(
                  cliente.whatsapp || cliente.phone || ""
                )}
                target="_blank"
                rel="noreferrer"
                style={styles.botonWhatsApp}
              >
                WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={nuevaCita}
              style={styles.botonPrincipal}
            >
              + Nueva cita
            </button>
          </div>
        </header>

        {mensaje && (
          <div style={styles.mensaje}>{mensaje}</div>
        )}

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        <section style={styles.resumenGrid}>
          <ResumenCard
            titulo="Total de citas"
            valor={String(citas.length)}
          />

          <ResumenCard
            titulo="Próximas citas"
            valor={String(citasFuturas.length)}
          />

          <ResumenCard
            titulo="Canceladas"
            valor={String(citasCanceladas.length)}
          />

          <ResumenCard
            titulo="Última cita"
            valor={
              citasPasadas[0]
                ? formatearFechaCorta(citasPasadas[0].start_at)
                : "Sin historial"
            }
          />
        </section>

        <div style={styles.gridPrincipal}>
          <div>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitulo}>
                    Datos del cliente
                  </h2>

                  <p style={styles.secundario}>
                    Información de contacto y notas.
                  </p>
                </div>

                {!editando && (
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    style={styles.botonSecundario}
                  >
                    Editar
                  </button>
                )}
              </div>

              {!editando ? (
                <div style={styles.datosGrid}>
                  <Dato
                    etiqueta="Nombre"
                    valor={nombreCompleto}
                  />

                  <Dato
                    etiqueta="Teléfono"
                    valor={cliente.phone || "No indicado"}
                  />

                  <Dato
                    etiqueta="WhatsApp"
                    valor={cliente.whatsapp || "No indicado"}
                  />

                  <Dato
                    etiqueta="Correo electrónico"
                    valor={cliente.email || "No indicado"}
                  />

                  <Dato
                    etiqueta="Fecha de nacimiento"
                    valor={
                      cliente.birth_date
                        ? formatearFechaNacimiento(cliente.birth_date)
                        : "No indicada"
                    }
                  />

                  <Dato
                    etiqueta="Cliente desde"
                    valor={formatearFechaCorta(cliente.created_at)}
                  />

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={styles.datoEtiqueta}>Notas</div>

                    <div style={styles.notaCaja}>
                      {cliente.notes || "Sin notas."}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={styles.formGrid}>
                    <div>
                      <label style={styles.label}>Nombre *</label>

                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Apellidos</label>

                      <input
                        type="text"
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Teléfono</label>

                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>WhatsApp</label>

                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Correo electrónico</label>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>
                        Fecha de nacimiento
                      </label>

                      <input
                        type="date"
                        value={fechaNacimiento}
                        onChange={(e) =>
                          setFechaNacimiento(e.target.value)
                        }
                        style={styles.input}
                      />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={styles.label}>Notas</label>

                      <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        style={styles.textarea}
                        placeholder="Notas internas sobre el cliente..."
                      />
                    </div>
                  </div>

                  <div style={styles.formAcciones}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(false);

                        setNombre(cliente.first_name || "");
                        setApellidos(cliente.last_name || "");
                        setTelefono(cliente.phone || "");
                        setWhatsapp(cliente.whatsapp || "");
                        setEmail(cliente.email || "");
                        setFechaNacimiento(cliente.birth_date || "");
                        setNotas(cliente.notes || "");
                      }}
                      style={styles.botonSecundario}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={guardarCliente}
                      disabled={guardando}
                      style={styles.botonPrincipal}
                    >
                      {guardando
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Historial de citas
              </h2>

              <p style={styles.secundario}>
                Todas las citas registradas para este cliente.
              </p>

              {citas.length === 0 ? (
                <div style={styles.vacio}>
                  Este cliente todavía no tiene citas.
                </div>
              ) : (
                <div style={styles.historialLista}>
                  {citas.map((cita) => (
                    <div
                      key={cita.id}
                      style={styles.citaFila}
                    >
                      <div>
                        <div style={styles.citaFecha}>
                          {formatearFechaHora(cita.start_at)}
                        </div>

                        <div style={styles.servicioNombre}>
                          {servicioDeCita(cita.id) || "Servicio"}
                        </div>

                        <div style={styles.secundario}>
                          {profesionalDeCita(cita.professional_id)}
                        </div>
                      </div>

                      <div style={styles.citaDerecha}>
                        <EstadoBadge estado={cita.status} />

                        <strong>
                          {formatearColones(Number(cita.total || 0))}
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/panel/agenda/${cita.id}`)
                          }
                          style={styles.botonVer}
                        >
                          Ver cita
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside>
            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Próxima cita
              </h2>

              {citasFuturas.length === 0 ? (
                <p style={styles.secundario}>
                  No tiene una próxima cita.
                </p>
              ) : (
                <>
                  <div style={styles.proximaFecha}>
                    {formatearFechaHora(citasFuturas[0].start_at)}
                  </div>

                  <div style={{ marginTop: "10px", fontWeight: 700 }}>
                    {servicioDeCita(citasFuturas[0].id) || "Servicio"}
                  </div>

                  <p style={styles.secundario}>
                    {profesionalDeCita(
                      citasFuturas[0].professional_id
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/panel/agenda/${citasFuturas[0].id}`
                      )
                    }
                    style={styles.botonPrincipal}
                  >
                    Ver cita
                  </button>
                </>
              )}
            </section>

            <section style={styles.card}>
              <h2 style={styles.cardTitulo}>
                Privacidad
              </h2>

              <Dato
                etiqueta="Consentimiento"
                valor={
                  cliente.privacy_consent
                    ? "Aceptado"
                    : "No registrado"
                }
              />

              <div style={{ marginTop: "18px" }}>
                <Dato
                  etiqueta="Marketing"
                  valor={
                    cliente.marketing_consent
                      ? "Autorizado"
                      : "No autorizado"
                  }
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ResumenCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div style={styles.resumenCard}>
      <div style={styles.datoEtiqueta}>{titulo}</div>

      <div style={styles.resumenValor}>{valor}</div>
    </div>
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
      <div style={styles.datoEtiqueta}>{etiqueta}</div>
      <div style={styles.datoValor}>{valor}</div>
    </div>
  );
}

function EstadoBadge({
  estado,
}: {
  estado: string;
}) {
  const estados: Record<
    string,
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

  const item =
    estados[estado] || {
      texto: estado,
      background: "#f2f4f7",
      color: "#344054",
    };

  return (
    <span
      style={{
        background: item.background,
        color: item.color,
        padding: "6px 10px",
        borderRadius: "999px",
        fontWeight: 700,
        fontSize: "12px",
      }}
    >
      {item.texto}
    </span>
  );
}

function formatearFechaHora(fechaISO: string) {
  const fecha = new Date(fechaISO);

  const fechaTexto = fecha.toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const horaTexto = fecha.toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${fechaTexto} · ${horaTexto}`;
}

function formatearFechaCorta(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatearFechaNacimiento(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatearColones(valor: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor);
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
    background: "#f5f7fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    color: "#667085",
  },

  contenedor: {
    width: "100%",
    maxWidth: "1250px",
    margin: "0 auto",
  },

  volver: {
    border: "none",
    background: "transparent",
    color: "#667085",
    padding: 0,
    marginBottom: "25px",
    cursor: "pointer",
    fontSize: "15px",
  },

  encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "25px",
    marginBottom: "30px",
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
    color: "#667085",
    marginTop: "10px",
    lineHeight: 1.5,
  },

  accionesCabecera: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  botonPrincipal: {
    border: "none",
    borderRadius: "9px",
    background: "#101828",
    color: "#ffffff",
    padding: "12px 17px",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
  },

  botonSecundario: {
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#101828",
    padding: "11px 15px",
    fontWeight: 600,
    cursor: "pointer",
  },

  botonWhatsApp: {
    border: "1px solid #abefc6",
    borderRadius: "9px",
    background: "#ecfdf3",
    color: "#067647",
    padding: "11px 15px",
    fontWeight: 700,
    textDecoration: "none",
  },

  resumenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  resumenCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 5px 18px rgba(16,24,40,0.04)",
  },

  resumenValor: {
    marginTop: "8px",
    fontSize: "24px",
    fontWeight: 700,
  },

  gridPrincipal: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(270px, 1fr)",
    gap: "22px",
    alignItems: "start",
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "26px",
    marginBottom: "22px",
    boxShadow: "0 5px 20px rgba(16,24,40,0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
  },

  cardTitulo: {
    margin: 0,
    fontSize: "23px",
  },

  secundario: {
    color: "#667085",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "6px 0 0",
  },

  datosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "22px",
  },

  datoEtiqueta: {
    color: "#667085",
    fontSize: "13px",
    marginBottom: "5px",
  },

  datoValor: {
    fontWeight: 700,
    lineHeight: 1.4,
  },

  notaCaja: {
    background: "#f9fafb",
    borderRadius: "10px",
    padding: "14px",
    color: "#475467",
    lineHeight: 1.5,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0 18px",
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
    marginBottom: "17px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "110px",
    padding: "13px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
    fontSize: "15px",
  },

  formAcciones: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
  },

  historialLista: {
    display: "grid",
    marginTop: "20px",
  },

  citaFila: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "18px 0",
    borderBottom: "1px solid #eaecf0",
  },

  citaFecha: {
    fontWeight: 700,
    marginBottom: "6px",
  },

  servicioNombre: {
    fontWeight: 700,
    marginBottom: "3px",
  },

  citaDerecha: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  botonVer: {
    border: "1px solid #d0d5dd",
    background: "#ffffff",
    color: "#101828",
    borderRadius: "8px",
    padding: "9px 12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  proximaFecha: {
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: 1.4,
  },

  vacio: {
    border: "1px dashed #d0d5dd",
    borderRadius: "12px",
    padding: "30px",
    textAlign: "center",
    color: "#667085",
    marginTop: "20px",
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
};