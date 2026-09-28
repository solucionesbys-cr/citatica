"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const STORAGE_BUCKET = "business-assets";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Servicio = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number;
  image_url: string | null;
  online_booking_enabled: boolean;
  is_active: boolean;
};

export default function ServiciosPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [duracion, setDuracion] = useState("30");

  const [imagenNueva, setImagenNueva] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [imagenProcesandoId, setImagenProcesandoId] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    return () => {
      if (imagenPreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagenPreview);
      }
    };
  }, [imagenPreview]);

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
      .select(
        `
        id,
        business_id,
        name,
        description,
        price,
        duration_minutes,
        image_url,
        online_booking_enabled,
        is_active
      `
      )
      .eq("business_id", idNegocio)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setServicios(data || []);
  }

  function validarImagen(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "La imagen debe estar en formato JPG, PNG o WebP.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "La imagen no puede superar los 5 MB.";
    }

    return "";
  }

  function extensionDesdeMime(mime: string) {
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    return "jpg";
  }

  function limpiarImagenNueva() {
    setImagenNueva(null);
    setImagenPreview("");
  }

  function seleccionarImagenNueva(file: File | null) {
    setError("");
    setMensaje("");

    if (!file) return;

    const validacion = validarImagen(file);

    if (validacion) {
      setError(validacion);
      return;
    }

    setImagenNueva(file);
    setImagenPreview(URL.createObjectURL(file));
  }

  async function subirImagenServicio(serviceId: string, file: File) {
    if (!businessId) {
      throw new Error("No se encontró el negocio.");
    }

    const extension = extensionDesdeMime(file.type);
    const nombreArchivo = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const ruta = `${businessId}/services/${serviceId}/${nombreArchivo}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(ruta, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(ruta);

    if (!data.publicUrl) {
      await supabase.storage.from(STORAGE_BUCKET).remove([ruta]);
      throw new Error("No se pudo obtener la URL pública de la imagen.");
    }

    return {
      ruta,
      publicUrl: data.publicUrl,
    };
  }

  function obtenerRutaStorage(url: string | null) {
    if (!url) return null;

    const marcador = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const posicion = url.indexOf(marcador);

    if (posicion === -1) return null;

    const rutaConQuery = url.slice(posicion + marcador.length);
    const ruta = rutaConQuery.split("?")[0];

    try {
      return decodeURIComponent(ruta);
    } catch {
      return ruta;
    }
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

    let servicioCreadoId = "";
    let rutaImagenNueva = "";

    try {
      const { data: servicioCreado, error: insertError } = await supabase
        .from("services")
        .insert({
          business_id: businessId,
          name: nombre.trim(),
          description: descripcion.trim() || null,
          price: Number(precio),
          duration_minutes: Number(duracion),
          image_url: null,
          online_booking_enabled: true,
          is_active: true,
        })
        .select("id")
        .single();

      if (insertError || !servicioCreado) {
        throw new Error(insertError?.message || "No se pudo crear el servicio.");
      }

      servicioCreadoId = servicioCreado.id;

      if (imagenNueva) {
        const subida = await subirImagenServicio(servicioCreado.id, imagenNueva);
        rutaImagenNueva = subida.ruta;

        const { error: updateImageError } = await supabase
          .from("services")
          .update({
            image_url: subida.publicUrl,
          })
          .eq("id", servicioCreado.id)
          .eq("business_id", businessId);

        if (updateImageError) {
          throw new Error(
            `El servicio se creó, pero no se pudo guardar su imagen: ${updateImageError.message}`
          );
        }
      }

      setNombre("");
      setDescripcion("");
      setPrecio("");
      setDuracion("30");
      limpiarImagenNueva();

      setMensaje("Servicio creado correctamente.");

      await cargarServicios(businessId);
    } catch (err) {
      if (rutaImagenNueva) {
        await supabase.storage.from(STORAGE_BUCKET).remove([rutaImagenNueva]);
      }

      if (servicioCreadoId) {
        await supabase
          .from("services")
          .delete()
          .eq("id", servicioCreadoId)
          .eq("business_id", businessId);
      }

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el servicio."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarImagenServicio(servicio: Servicio, file: File | null) {
    setError("");
    setMensaje("");

    if (!file) return;

    const validacion = validarImagen(file);

    if (validacion) {
      setError(validacion);
      return;
    }

    setImagenProcesandoId(servicio.id);

    let rutaNueva = "";

    try {
      const subida = await subirImagenServicio(servicio.id, file);
      rutaNueva = subida.ruta;

      const { error: updateError } = await supabase
        .from("services")
        .update({
          image_url: subida.publicUrl,
        })
        .eq("id", servicio.id)
        .eq("business_id", businessId);

      if (updateError) {
        await supabase.storage.from(STORAGE_BUCKET).remove([subida.ruta]);
        throw new Error(updateError.message);
      }

      const rutaAnterior = obtenerRutaStorage(servicio.image_url);

      if (rutaAnterior && rutaAnterior !== subida.ruta) {
        const { error: removeOldError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([rutaAnterior]);

        if (removeOldError) {
          console.warn(
            "La nueva imagen se guardó, pero no se pudo eliminar la anterior:",
            removeOldError.message
          );
        }
      }

      setServicios((actuales) =>
        actuales.map((item) =>
          item.id === servicio.id
            ? {
                ...item,
                image_url: subida.publicUrl,
              }
            : item
        )
      );

      setMensaje("Foto del servicio actualizada correctamente.");
    } catch (err) {
      if (rutaNueva) {
        await supabase.storage.from(STORAGE_BUCKET).remove([rutaNueva]);
      }

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la foto del servicio."
      );
    } finally {
      setImagenProcesandoId("");
    }
  }

  async function eliminarImagenServicio(servicio: Servicio) {
    if (!servicio.image_url) return;

    const confirmar = window.confirm(
      "¿Desea eliminar la foto de este servicio?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");
    setImagenProcesandoId(servicio.id);

    try {
      const { error: updateError } = await supabase
        .from("services")
        .update({
          image_url: null,
        })
        .eq("id", servicio.id)
        .eq("business_id", businessId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const rutaAnterior = obtenerRutaStorage(servicio.image_url);

      if (rutaAnterior) {
        const { error: removeError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([rutaAnterior]);

        if (removeError) {
          console.warn(
            "La referencia se eliminó, pero el archivo no pudo borrarse de Storage:",
            removeError.message
          );
        }
      }

      setServicios((actuales) =>
        actuales.map((item) =>
          item.id === servicio.id
            ? {
                ...item,
                image_url: null,
              }
            : item
        )
      );

      setMensaje("Foto del servicio eliminada correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la foto del servicio."
      );
    } finally {
      setImagenProcesandoId("");
    }
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

  async function eliminarServicio(servicio: Servicio) {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este servicio?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", servicio.id)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    const rutaImagen = obtenerRutaStorage(servicio.image_url);

    if (rutaImagen) {
      const { error: removeError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([rutaImagen]);

      if (removeError) {
        console.warn(
          "El servicio se eliminó, pero no se pudo borrar su imagen de Storage:",
          removeError.message
        );
      }
    }

    setServicios((actuales) =>
      actuales.filter((item) => item.id !== servicio.id)
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
              type="button"
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

        {mensaje && <div style={mensajeStyle}>{mensaje}</div>}

        <div style={gridPrincipalStyle}>
          <section style={tarjetaStyle}>
            <h2 style={seccionTituloStyle}>Nuevo servicio</h2>

            <p style={textoAyudaStyle}>
              Agregue un servicio disponible para sus clientes.
            </p>

            <form onSubmit={crearServicio}>
              <label style={labelStyle}>Nombre del servicio</label>

              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Corte de cabello"
                style={inputStyle}
                required
              />

              <label style={labelStyle}>Descripción</label>

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

              <label style={labelStyle}>Foto del servicio</label>

              <div style={imagenNuevaCajaStyle}>
                {imagenPreview ? (
                  <img
                    src={imagenPreview}
                    alt="Vista previa del servicio"
                    style={imagenNuevaPreviewStyle}
                  />
                ) : (
                  <div style={imagenPlaceholderStyle}>
                    <span style={{ fontSize: "30px" }}>📷</span>
                    <span>Agregue una foto opcional</span>
                  </div>
                )}

                <div style={imagenNuevaAccionesStyle}>
                  <label style={botonSubirImagenStyle}>
                    {imagenPreview ? "Cambiar foto" : "Seleccionar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null;
                        seleccionarImagenNueva(file);
                        e.currentTarget.value = "";
                      }}
                      style={inputArchivoOcultoStyle}
                    />
                  </label>

                  {imagenPreview && (
                    <button
                      type="button"
                      onClick={limpiarImagenNueva}
                      style={botonQuitarImagenStyle}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              <p style={ayudaImagenStyle}>
                JPG, PNG o WebP. Tamaño máximo: 5 MB.
              </p>

              <div style={dosColumnasStyle}>
                <div>
                  <label style={labelStyle}>Precio (₡)</label>

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
                  <label style={labelStyle}>Duración</label>

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
                {guardando ? "Guardando..." : "+ Crear servicio"}
              </button>
            </form>
          </section>

          <section style={tarjetaStyle}>
            <div style={listaEncabezadoStyle}>
              <div>
                <h2 style={seccionTituloStyle}>Mis servicios</h2>

                <p style={textoAyudaStyle}>
                  Servicios registrados en su negocio.
                </p>
              </div>
            </div>

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
                {servicios.map((servicio) => {
                  const procesandoImagen = imagenProcesandoId === servicio.id;

                  return (
                    <div key={servicio.id} style={servicioStyle}>
                      <div style={servicioContenidoStyle}>
                        <div style={miniaturaCajaStyle}>
                          {servicio.image_url ? (
                            <img
                              src={servicio.image_url}
                              alt={servicio.name}
                              style={miniaturaImagenStyle}
                            />
                          ) : (
                            <div style={miniaturaPlaceholderStyle}>✂</div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={servicioTituloFilaStyle}>
                            <h3 style={servicioTituloStyle}>{servicio.name}</h3>

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
                              {servicio.is_active ? "Activo" : "Inactivo"}
                            </span>
                          </div>

                          {servicio.description && (
                            <p style={descripcionStyle}>{servicio.description}</p>
                          )}

                          <div style={datosServicioStyle}>
                            <strong>
                              ₡
                              {Number(servicio.price || 0).toLocaleString(
                                "es-CR"
                              )}
                            </strong>

                            <span>•</span>

                            <span>{servicio.duration_minutes} minutos</span>

                            <span>•</span>

                            <span>
                              {servicio.online_booking_enabled
                                ? "Reserva en línea"
                                : "Sin reserva en línea"}
                            </span>
                          </div>

                          <div style={accionesImagenListaStyle}>
                            <label
                              style={{
                                ...botonFotoListaStyle,
                                opacity: procesandoImagen ? 0.6 : 1,
                                cursor: procesandoImagen ? "not-allowed" : "pointer",
                                pointerEvents: procesandoImagen ? "none" : "auto",
                              }}
                            >
                              {procesandoImagen
                                ? "Procesando..."
                                : servicio.image_url
                                ? "Cambiar foto"
                                : "Agregar foto"}

                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                  const input = e.currentTarget;
                                  const file = input.files?.[0] || null;
                                  input.value = "";
                                  void cambiarImagenServicio(servicio, file);
                                }}
                                style={inputArchivoOcultoStyle}
                              />
                            </label>

                            {servicio.image_url && (
                              <button
                                type="button"
                                onClick={() => eliminarImagenServicio(servicio)}
                                disabled={procesandoImagen}
                                style={{
                                  ...botonQuitarFotoListaStyle,
                                  opacity: procesandoImagen ? 0.6 : 1,
                                  cursor: procesandoImagen
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              >
                                Quitar foto
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={accionesStyle}>
                        <button
                          type="button"
                          onClick={() => cambiarEstado(servicio)}
                          style={botonSecundarioStyle}
                        >
                          {servicio.is_active ? "Desactivar" : "Activar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarServicio(servicio)}
                          style={botonEliminarStyle}
                        >
                          Eliminar
                        </button>
                      </div>
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
  flexWrap: "wrap",
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
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const imagenNuevaCajaStyle: React.CSSProperties = {
  border: "1px solid #eaecf0",
  borderRadius: "14px",
  overflow: "hidden",
  background: "#f9fafb",
};

const imagenNuevaPreviewStyle: React.CSSProperties = {
  width: "100%",
  height: "210px",
  objectFit: "cover",
  display: "block",
};

const imagenPlaceholderStyle: React.CSSProperties = {
  height: "170px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  color: "#667085",
  fontSize: "14px",
};

const imagenNuevaAccionesStyle: React.CSSProperties = {
  padding: "12px",
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  background: "#ffffff",
  borderTop: "1px solid #eaecf0",
};

const botonSubirImagenStyle: React.CSSProperties = {
  flex: 1,
  minWidth: "130px",
  textAlign: "center",
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  borderRadius: "8px",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
};

const botonQuitarImagenStyle: React.CSSProperties = {
  border: "1px solid #fecdca",
  background: "#ffffff",
  color: "#b42318",
  borderRadius: "8px",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 600,
};

const ayudaImagenStyle: React.CSSProperties = {
  color: "#98a2b3",
  fontSize: "12px",
  margin: "7px 0 18px",
};

const inputArchivoOcultoStyle: React.CSSProperties = {
  display: "none",
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

const listaEncabezadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
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
  alignItems: "flex-start",
  gap: "20px",
  padding: "20px 0",
  borderBottom: "1px solid #eaecf0",
  flexWrap: "wrap",
};

const servicioContenidoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: "260px",
  display: "flex",
  gap: "16px",
  alignItems: "flex-start",
};

const miniaturaCajaStyle: React.CSSProperties = {
  width: "95px",
  height: "78px",
  minWidth: "95px",
  borderRadius: "12px",
  overflow: "hidden",
  background: "#f2f4f7",
  border: "1px solid #eaecf0",
};

const miniaturaImagenStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const miniaturaPlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  color: "#667085",
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

const accionesImagenListaStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const botonFotoListaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "8px 11px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#344054",
};

const botonQuitarFotoListaStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#b42318",
  padding: "8px 6px",
  fontSize: "12px",
  fontWeight: 600,
};

const accionesStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: "105px",
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
