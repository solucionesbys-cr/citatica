"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Servicio = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number;
  online_booking_enabled: boolean;
  is_active: boolean;
  created_at: string;
};

export default function ServiciosPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [duracion, setDuracion] = useState("30");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
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
          "No se encontró un negocio asociado a este usuario."
      );
      setCargando(false);
      return;
    }

    setBusinessId(miembro.business_id);

    await cargarServicios(miembro.business_id);

    setCargando(false);
  }

  async function cargarServicios(idNegocio: string) {
    const { data, error } = await supabase
      .from("services")
      .select(`
        id,
        business_id,
        name,
        description,
        price,
        duration_minutes,
        online_booking_enabled,
        is_active,
        created_at
      `)
      .eq("business_id", idNegocio)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setServicios(data || []);
  }

  async function crearServicio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!businessId) {
      setError("No se encontró el negocio.");
      return;
    }

    if (!nombre.trim()) {
      setError("Ingrese el nombre del servicio.");
      return;
    }

    if (!precio || Number(precio) < 0) {
      setError("Ingrese un precio válido.");
      return;
    }

    if (!duracion || Number(duracion) <= 0) {
      setError("Ingrese una duración válida.");
      return;
    }

    setGuardando(true);

    const { error: insertError } = await supabase
      .from("services")
      .insert({
        business_id: businessId,
        name: nombre.trim(),
        description: descripcion.trim() || null,
        booking_type: "STANDARD",
        price_type: "FIXED",
        price: Number(precio),
        price_min: null,
        price_max: null,
        duration_minutes: Number(duracion),
        buffer_before_minutes: 0,
        buffer_after_minutes: 0,
        deposit_required: false,
        deposit_type: "NONE",
        deposit_value: null,
        image_url: null,
        online_booking_enabled: true,
        is_active: true,
      });

    if (insertError) {
      setError(insertError.message);
      setGuardando(false);
      return;
    }

    setNombre("");
    setDescripcion("");
    setPrecio("");
    setDuracion("30");

    setMensaje("Servicio creado correctamente.");

    await cargarServicios(businessId);

    setGuardando(false);
  }

  async function cambiarEstado(servicio: Servicio) {
    setError("");
    setMensaje("");

    const nuevoEstado = !servicio.is_active;

    const { error } = await supabase
      .from("services")
      .update({
        is_active: nuevoEstado,
      })
      .eq("id", servicio.id)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    setServicios((actuales) =>
      actuales.map((item) =>
        item.id === servicio.id
          ? {
              ...item,
              is_active: nuevoEstado,
            }
          : item
      )
    );
  }

  async function cambiarReservaOnline(servicio: Servicio) {
    setError("");
    setMensaje("");

    const nuevoEstado = !servicio.online_booking_enabled;

    const { error } = await supabase
      .from("services")
      .update({
        online_booking_enabled: nuevoEstado,
      })
      .eq("id", servicio.id)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    setServicios((actuales) =>
      actuales.map((item) =>
        item.id === servicio.id
          ? {
              ...item,
              online_booking_enabled: nuevoEstado,
            }
          : item
      )
    );
  }

  async function eliminarServicio(id: string) {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este servicio?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    setServicios((actuales) =>
      actuales.filter((servicio) => servicio.id !== id)
    );

    setMensaje("Servicio eliminado correctamente.");
  }

  if (cargando) {
    return (
      <main style={pantallaCargando}>
        <p>Cargando servicios...</p>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={contenedorStyle}>
        <div style={encabezadoStyle}>
          <div>
            <button
              onClick={() => router.push("/panel")}
              style={volverStyle}
            >
              ← Volver al panel
            </button>

            <h1 style={tituloStyle}>Servicios</h1>

            <p style={subtituloStyle}>
              Administre los servicios que ofrece su negocio.
            </p>
          </div>

          <div style={contadorStyle}>
            <span style={contadorNumeroStyle}>{servicios.length}</span>

            <span style={contadorTextoStyle}>
              {servicios.length === 1 ? "Servicio" : "Servicios"}
            </span>
          </div>
        </div>

        {error && (
          <div style={errorStyle}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {mensaje && (
          <div style={mensajeStyle}>
            {mensaje}
          </div>
        )}

        <div style={gridPrincipalStyle}>
          <section style={tarjetaStyle}>
            <h2 style={seccionTituloStyle}>Nuevo servicio</h2>

            <p style={textoAyudaStyle}>
              Agregue un servicio disponible para sus clientes.
            </p>

            <form onSubmit={crearServicio}>
              <label style={labelStyle}>
                Nombre del servicio
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Corte de cabello"
                style={inputStyle}
                required
              />

              <label style={labelStyle}>
                Descripción
              </label>

              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Corte clásico o moderno según preferencia."
                style={{
                  ...inputStyle,
                  minHeight: "95px",
                  resize: "vertical",
                  fontFamily: "Arial, sans-serif",
                }}
              />

              <div style={dosColumnasStyle}>
                <div>
                  <label style={labelStyle}>
                    Precio (₡)
                  </label>

                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="5000"
                    min="0"
                    step="1"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Duración
                  </label>

                  <select
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="75">1 hora 15 min</option>
                    <option value="90">1 hora 30 min</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={guardando}
                style={{
                  ...botonPrincipalStyle,
                  opacity: guardando ? 0.7 : 1,
                  cursor: guardando ? "not-allowed" : "pointer",
                }}
              >
                {guardando
                  ? "Guardando..."
                  : "+ Crear servicio"}
              </button>
            </form>
          </section>

          <section style={tarjetaStyle}>
            <h2 style={seccionTituloStyle}>
              Mis servicios
            </h2>

            <p style={textoAyudaStyle}>
              Servicios registrados en su negocio.
            </p>

            {servicios.length === 0 ? (
              <div style={vacioStyle}>
                <div style={iconoVacioStyle}>✂</div>

                <h3 style={{ marginBottom: "8px" }}>
                  Todavía no tiene servicios
                </h3>

                <p
                  style={{
                    color: "#667085",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Cree su primer servicio utilizando el formulario.
                </p>
              </div>
            ) : (
              <div>
                {servicios.map((servicio) => (
                  <div
                    key={servicio.id}
                    style={servicioStyle}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={servicioTituloFilaStyle}>
                        <h3 style={servicioTituloStyle}>
                          {servicio.name}
                        </h3>

                        <span
                          style={{
                            ...estadoStyle,
                            background: servicio.is_active
                              ? "#ecfdf3"
                              : "#f2f4f7",
                            color: servicio.is_active
                              ? "#027a48"
                              : "#667085",
                          }}
                        >
                          {servicio.is_active
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </div>

                      {servicio.description && (
                        <p style={descripcionStyle}>
                          {servicio.description}
                        </p>
                      )}

                      <div style={datosServicioStyle}>
                        <strong>
                          ₡
                          {Number(
                            servicio.price || 0
                          ).toLocaleString("es-CR")}
                        </strong>

                        <span>•</span>

                        <span>
                          {servicio.duration_minutes} minutos
                        </span>

                        <span>•</span>

                        <span>
                          {servicio.online_booking_enabled
                            ? "Reserva en línea activa"
                            : "Reserva en línea desactivada"}
                        </span>
                      </div>
                    </div>

                    <div style={accionesStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          cambiarEstado(servicio)
                        }
                        style={botonSecundarioStyle}
                      >
                        {servicio.is_active
                          ? "Desactivar"
                          : "Activar"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarReservaOnline(servicio)
                        }
                        style={botonSecundarioStyle}
                      >
                        {servicio.online_booking_enabled
                          ? "Ocultar online"
                          : "Publicar online"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarServicio(servicio.id)
                        }
                        style={botonEliminarStyle}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
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
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Arial, sans-serif",
  color: "#667085",
};

const contenedorStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
};

const encabezadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "20px",
  marginBottom: "30px",
};

const volverStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#667085",
  cursor: "pointer",
  fontSize: "14px",
  marginBottom: "12px",
};

const tituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "36px",
};

const subtituloStyle: React.CSSProperties = {
  color: "#667085",
  margin: "8px 0 0",
};

const contadorStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "12px",
  padding: "12px 18px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const contadorNumeroStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#101828",
};

const contadorTextoStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "14px",
};

const gridPrincipalStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(300px, 400px) minmax(0, 1fr)",
  gap: "24px",
  alignItems: "start",
};

const tarjetaStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
};

const seccionTituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "22px",
};

const textoAyudaStyle: React.CSSProperties = {
  margin: "7px 0 24px",
  color: "#667085",
  fontSize: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "7px",
  fontWeight: "600",
  fontSize: "14px",
  color: "#344054",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  marginBottom: "18px",
  border: "1px solid #d0d5dd",
  borderRadius: "9px",
  fontSize: "15px",
  background: "#ffffff",
  color: "#101828",
};

const dosColumnasStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const botonPrincipalStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  border: "none",
  borderRadius: "9px",
  background: "#101828",
  color: "#ffffff",
  fontWeight: "700",
  fontSize: "15px",
};

const vacioStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "60px 20px",
  border: "1px dashed #d0d5dd",
  borderRadius: "14px",
};

const iconoVacioStyle: React.CSSProperties = {
  fontSize: "34px",
  marginBottom: "10px",
};

const servicioStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  padding: "20px 0",
  borderBottom: "1px solid #eaecf0",
};

const servicioTituloFilaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const servicioTituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "18px",
};

const estadoStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "4px 9px",
  fontSize: "12px",
  fontWeight: "600",
};

const descripcionStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "14px",
  lineHeight: 1.5,
  margin: "8px 0",
};

const datosServicioStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  color: "#475467",
  fontSize: "14px",
  marginTop: "10px",
};

const accionesStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: "120px",
};

const botonSecundarioStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "9px 12px",
  cursor: "pointer",
  fontWeight: "600",
};

const botonEliminarStyle: React.CSSProperties = {
  border: "1px solid #fecdca",
  background: "#ffffff",
  color: "#b42318",
  borderRadius: "8px",
  padding: "9px 12px",
  cursor: "pointer",
  fontWeight: "600",
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