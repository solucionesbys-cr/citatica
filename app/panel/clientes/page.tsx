"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type ResumenCliente = Cliente & {
  totalCitas: number;
  proximaCita: string | null;
  ultimaCita: string | null;
};

export default function ClientesPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");
  const [clientes, setClientes] = useState<ResumenCliente[]>([]);

  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
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
          "No se encontró un negocio asociado a su usuario."
      );
      setCargando(false);
      return;
    }

    setBusinessId(miembro.business_id);

    const { data: clientesData, error: clientesError } = await supabase
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
      .eq("business_id", miembro.business_id)
      .order("created_at", { ascending: false });

    if (clientesError) {
      setError(clientesError.message);
      setCargando(false);
      return;
    }

    const listaBase = clientesData || [];

    const ids = listaBase.map((cliente) => cliente.id);

    if (ids.length === 0) {
      setClientes([]);
      setCargando(false);
      return;
    }

    const { data: citasData, error: citasError } = await supabase
      .from("appointments")
      .select(`
        id,
        client_id,
        start_at,
        status
      `)
      .eq("business_id", miembro.business_id)
      .in("client_id", ids)
      .order("start_at", { ascending: true });

    if (citasError) {
      console.error(
        "No se pudo cargar el resumen de citas:",
        citasError.message
      );
    }

    const ahora = new Date();

    const resumen: ResumenCliente[] = listaBase.map((cliente) => {
      const citasCliente = (citasData || []).filter(
        (cita) => cita.client_id === cliente.id
      );

      const citasValidas = citasCliente.filter(
        (cita) => cita.status !== "CANCELLED"
      );

      const futuras = citasValidas
        .filter((cita) => new Date(cita.start_at) >= ahora)
        .sort(
          (a, b) =>
            new Date(a.start_at).getTime() -
            new Date(b.start_at).getTime()
        );

      const pasadas = citasValidas
        .filter((cita) => new Date(cita.start_at) < ahora)
        .sort(
          (a, b) =>
            new Date(b.start_at).getTime() -
            new Date(a.start_at).getTime()
        );

      return {
        ...cliente,
        totalCitas: citasCliente.length,
        proximaCita: futuras[0]?.start_at || null,
        ultimaCita: pasadas[0]?.start_at || null,
      };
    });

    setClientes(resumen);
    setCargando(false);
  }

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return clientes;

    return clientes.filter((cliente) => {
      const nombreCompleto = `${cliente.first_name} ${
        cliente.last_name || ""
      }`.toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        (cliente.phone || "").toLowerCase().includes(texto) ||
        (cliente.whatsapp || "").toLowerCase().includes(texto) ||
        (cliente.email || "").toLowerCase().includes(texto)
      );
    });
  }, [clientes, busqueda]);

  function nombreCompleto(cliente: Cliente) {
    return [cliente.first_name, cliente.last_name]
      .filter(Boolean)
      .join(" ");
  }

  function nuevaCita(clienteId: string) {
    router.push(`/panel/agenda?cliente=${clienteId}`);
  }

  function verCliente(clienteId: string) {
    router.push(`/panel/clientes/${clienteId}`);
  }

  if (cargando) {
    return (
      <main style={styles.centroPantalla}>
        <div>
          <strong>CitaTica</strong>
          <p style={{ color: "#667085" }}>Cargando clientes...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.contenedor}>
        <button
          type="button"
          onClick={() => router.push("/panel")}
          style={styles.volver}
        >
          ← Volver al panel
        </button>

        <header style={styles.encabezado}>
          <div>
            <p style={styles.marca}>CitaTica</p>

            <h1 style={styles.titulo}>Clientes</h1>

            <p style={styles.subtitulo}>
              Consulte sus clientes y el historial de citas de su negocio.
            </p>
          </div>

          <div style={styles.contador}>
            <strong style={{ fontSize: "24px" }}>{clientes.length}</strong>

            <span style={{ color: "#667085" }}>
              {clientes.length === 1 ? "Cliente" : "Clientes"}
            </span>
          </div>
        </header>

        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.busquedaCard}>
          <div style={styles.busquedaFila}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>
                Buscar cliente
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, teléfono, WhatsApp o correo..."
                style={styles.input}
              />
            </div>

            <button
              type="button"
              onClick={() => router.push("/panel/agenda")}
              style={styles.botonPrincipal}
            >
              + Nueva cita
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitulo}>
                Mis clientes
              </h2>

              <p style={styles.secundario}>
                {clientesFiltrados.length}{" "}
                {clientesFiltrados.length === 1
                  ? "cliente encontrado"
                  : "clientes encontrados"}
              </p>
            </div>
          </div>

          {clientesFiltrados.length === 0 ? (
            <div style={styles.vacio}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>
                👥
              </div>

              <strong>No hay clientes para mostrar</strong>

              <p style={styles.secundario}>
                Los clientes aparecerán aquí cuando se registren o creen una
                reserva.
              </p>
            </div>
          ) : (
            <div style={styles.lista}>
              {clientesFiltrados.map((cliente) => (
                <div
                  key={cliente.id}
                  style={styles.clienteFila}
                >
                  <div style={styles.avatar}>
                    {cliente.first_name.charAt(0).toUpperCase()}
                    {cliente.last_name
                      ? cliente.last_name.charAt(0).toUpperCase()
                      : ""}
                  </div>

                  <div style={styles.clientePrincipal}>
                    <div style={styles.nombreCliente}>
                      {nombreCompleto(cliente)}
                    </div>

                    <div style={styles.contactoLinea}>
                      {cliente.phone && (
                        <span>☎ {cliente.phone}</span>
                      )}

                      {cliente.email && (
                        <span>✉ {cliente.email}</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.datoResumen}>
                    <span style={styles.datoEtiqueta}>
                      Citas
                    </span>

                    <strong>{cliente.totalCitas}</strong>
                  </div>

                  <div style={styles.datoResumen}>
                    <span style={styles.datoEtiqueta}>
                      Próxima cita
                    </span>

                    <strong>
                      {cliente.proximaCita
                        ? formatearFechaHora(cliente.proximaCita)
                        : "Sin próxima cita"}
                    </strong>
                  </div>

                  <div style={styles.acciones}>
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
                      onClick={() => nuevaCita(cliente.id)}
                      style={styles.botonSecundario}
                    >
                      Nueva cita
                    </button>

                    <button
                      type="button"
                      onClick={() => verCliente(cliente.id)}
                      style={styles.botonVer}
                    >
                      Ver cliente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatearFechaHora(fechaISO: string) {
  const fecha = new Date(fechaISO);

  const fechaTexto = fecha.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
  });

  const horaTexto = fecha.toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${fechaTexto} · ${horaTexto}`;
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
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
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

  contador: {
    minWidth: "120px",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 4px 16px rgba(16,24,40,0.04)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  busquedaCard: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "18px",
    boxShadow: "0 5px 18px rgba(16,24,40,0.04)",
    marginBottom: "22px",
  },

  busquedaFila: {
    display: "flex",
    alignItems: "flex-end",
    gap: "15px",
    flexWrap: "wrap",
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
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    padding: "12px 13px",
    fontSize: "15px",
  },

  botonPrincipal: {
    border: "none",
    background: "#101828",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    minHeight: "45px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 5px 20px rgba(16,24,40,0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "18px",
  },

  cardTitulo: {
    margin: 0,
    fontSize: "24px",
  },

  secundario: {
    color: "#667085",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "6px 0 0",
  },

  lista: {
    display: "grid",
  },

  clienteFila: {
    display: "grid",
    gridTemplateColumns:
      "60px minmax(190px, 1.4fr) 90px minmax(170px, 1fr) auto",
    gap: "18px",
    alignItems: "center",
    padding: "20px 0",
    borderBottom: "1px solid #eaecf0",
  },

  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#f2f4f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#344054",
  },

  clientePrincipal: {
    minWidth: 0,
  },

  nombreCliente: {
    fontWeight: 700,
    fontSize: "17px",
    marginBottom: "7px",
  },

  contactoLinea: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    color: "#667085",
    fontSize: "13px",
  },

  datoResumen: {
    display: "grid",
    gap: "5px",
  },

  datoEtiqueta: {
    color: "#667085",
    fontSize: "12px",
  },

  acciones: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  botonWhatsApp: {
    textDecoration: "none",
    background: "#ecfdf3",
    color: "#067647",
    border: "1px solid #abefc6",
    borderRadius: "8px",
    padding: "9px 12px",
    fontWeight: 600,
    fontSize: "13px",
  },

  botonSecundario: {
    background: "#ffffff",
    color: "#101828",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "9px 12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  botonVer: {
    background: "#101828",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  vacio: {
    border: "1px dashed #d0d5dd",
    borderRadius: "14px",
    textAlign: "center",
    padding: "50px 25px",
    color: "#475467",
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