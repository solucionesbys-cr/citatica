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
  name: string;
  price: number | null;
  duration_minutes: number;
  is_active: boolean;
};

type ProfesionalServicio = {
  id: string;
  service_id: string;
  is_active: boolean;
  services:
    | {
        id: string;
        name: string;
        price: number | null;
        duration_minutes: number;
      }
    | {
        id: string;
        name: string;
        price: number | null;
        duration_minutes: number;
      }[]
    | null;
};

type Profesional = {
  id: string;
  business_id: string;
  name: string;
  bio: string | null;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  booking_enabled: boolean;
  is_active: boolean;
  created_at: string;
  professional_services?: ProfesionalServicio[];
};

export default function ProfesionalesPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [nombre, setNombre] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  const [fotoNueva, setFotoNueva] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoProcesandoId, setFotoProcesandoId] = useState("");

  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    string[]
  >([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    return () => {
      if (fotoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

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

    await Promise.all([
      cargarServicios(miembro.business_id),
      cargarProfesionales(miembro.business_id),
    ]);

    setCargando(false);
  }

  async function cargarServicios(idNegocio: string) {
    const { data, error } = await supabase
      .from("services")
      .select(`
        id,
        name,
        price,
        duration_minutes,
        is_active
      `)
      .eq("business_id", idNegocio)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setServicios(data || []);
  }

  async function cargarProfesionales(idNegocio: string) {
    const { data, error } = await supabase
      .from("professionals")
      .select(`
        id,
        business_id,
        name,
        bio,
        specialty,
        phone,
        email,
        photo_url,
        booking_enabled,
        is_active,
        created_at,
        professional_services (
          id,
          service_id,
          is_active,
          services (
            id,
            name,
            price,
            duration_minutes
          )
        )
      `)
      .eq("business_id", idNegocio)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setProfesionales((data || []) as Profesional[]);
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

  function limpiarFotoNueva() {
    setFotoNueva(null);
    setFotoPreview("");
  }

  function seleccionarFotoNueva(file: File | null) {
    setError("");
    setMensaje("");

    if (!file) return;

    const validacion = validarImagen(file);

    if (validacion) {
      setError(validacion);
      return;
    }

    setFotoNueva(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function subirFotoProfesional(professionalId: string, file: File) {
    if (!businessId) {
      throw new Error("No se encontró el negocio.");
    }

    const extension = extensionDesdeMime(file.type);
    const nombreArchivo = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const ruta = `${businessId}/professionals/${professionalId}/${nombreArchivo}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(ruta, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`No se pudo subir la foto: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(ruta);

    if (!data.publicUrl) {
      await supabase.storage.from(STORAGE_BUCKET).remove([ruta]);
      throw new Error("No se pudo obtener la URL pública de la foto.");
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

  async function cambiarFotoProfesional(
    profesional: Profesional,
    file: File | null
  ) {
    setError("");
    setMensaje("");

    if (!file) return;

    const validacion = validarImagen(file);

    if (validacion) {
      setError(validacion);
      return;
    }

    setFotoProcesandoId(profesional.id);

    let rutaNueva = "";

    try {
      const subida = await subirFotoProfesional(profesional.id, file);
      rutaNueva = subida.ruta;

      const { error: updateError } = await supabase
        .from("professionals")
        .update({
          photo_url: subida.publicUrl,
        })
        .eq("id", profesional.id)
        .eq("business_id", businessId);

      if (updateError) {
        await supabase.storage.from(STORAGE_BUCKET).remove([subida.ruta]);
        throw new Error(updateError.message);
      }

      const rutaAnterior = obtenerRutaStorage(profesional.photo_url);

      if (rutaAnterior && rutaAnterior !== subida.ruta) {
        const { error: removeOldError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([rutaAnterior]);

        if (removeOldError) {
          console.warn(
            "La nueva foto se guardó, pero no se pudo eliminar la anterior:",
            removeOldError.message
          );
        }
      }

      setProfesionales((actuales) =>
        actuales.map((item) =>
          item.id === profesional.id
            ? {
                ...item,
                photo_url: subida.publicUrl,
              }
            : item
        )
      );

      setMensaje("Foto del profesional actualizada correctamente.");
    } catch (err) {
      if (rutaNueva) {
        await supabase.storage.from(STORAGE_BUCKET).remove([rutaNueva]);
      }

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la foto del profesional."
      );
    } finally {
      setFotoProcesandoId("");
    }
  }

  async function eliminarFotoProfesional(profesional: Profesional) {
    if (!profesional.photo_url) return;

    const confirmar = window.confirm(
      "¿Desea eliminar la foto de este profesional?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");
    setFotoProcesandoId(profesional.id);

    try {
      const { error: updateError } = await supabase
        .from("professionals")
        .update({
          photo_url: null,
        })
        .eq("id", profesional.id)
        .eq("business_id", businessId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const rutaAnterior = obtenerRutaStorage(profesional.photo_url);

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

      setProfesionales((actuales) =>
        actuales.map((item) =>
          item.id === profesional.id
            ? {
                ...item,
                photo_url: null,
              }
            : item
        )
      );

      setMensaje("Foto del profesional eliminada correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la foto del profesional."
      );
    } finally {
      setFotoProcesandoId("");
    }
  }

  function cambiarSeleccionServicio(serviceId: string) {
    setServiciosSeleccionados((actuales) => {
      if (actuales.includes(serviceId)) {
        return actuales.filter((id) => id !== serviceId);
      }

      return [...actuales, serviceId];
    });
  }

  async function crearProfesional(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!businessId) {
      setError("No se encontró el negocio.");
      return;
    }

    if (!nombre.trim()) {
      setError("Ingrese el nombre del profesional.");
      return;
    }

    setGuardando(true);

    let profesionalCreadoId = "";
    let rutaFotoNueva = "";

    try {
      const { data: profesionalCreado, error: insertError } =
        await supabase
          .from("professionals")
          .insert({
            business_id: businessId,
            branch_id: null,
            user_id: null,
            name: nombre.trim(),
            bio: bio.trim() || null,
            photo_url: null,
            specialty: especialidad.trim() || null,
            phone: telefono.trim() || null,
            email: email.trim() || null,
            booking_enabled: true,
            commission_type: null,
            commission_value: null,
            is_active: true,
          })
          .select("id")
          .single();

      if (insertError || !profesionalCreado) {
        throw new Error(
          insertError?.message || "No se pudo crear el profesional."
        );
      }

      profesionalCreadoId = profesionalCreado.id;

      if (serviciosSeleccionados.length > 0) {
        const relaciones = serviciosSeleccionados.map((serviceId) => ({
          business_id: businessId,
          professional_id: profesionalCreado.id,
          service_id: serviceId,
          custom_price: null,
          custom_duration_minutes: null,
          is_active: true,
        }));

        const { error: relacionError } = await supabase
          .from("professional_services")
          .insert(relaciones);

        if (relacionError) {
          throw new Error(
            "No se pudieron asignar los servicios: " + relacionError.message
          );
        }
      }

      if (fotoNueva) {
        const subida = await subirFotoProfesional(
          profesionalCreado.id,
          fotoNueva
        );
        rutaFotoNueva = subida.ruta;

        const { error: updatePhotoError } = await supabase
          .from("professionals")
          .update({
            photo_url: subida.publicUrl,
          })
          .eq("id", profesionalCreado.id)
          .eq("business_id", businessId);

        if (updatePhotoError) {
          throw new Error(
            `El profesional se creó, pero no se pudo guardar su foto: ${updatePhotoError.message}`
          );
        }
      }

      setNombre("");
      setEspecialidad("");
      setTelefono("");
      setEmail("");
      setBio("");
      setServiciosSeleccionados([]);
      limpiarFotoNueva();

      setMensaje(
        serviciosSeleccionados.length > 0
          ? "Profesional creado correctamente."
          : "Profesional creado correctamente. Puede asignarle servicios después."
      );

      await cargarProfesionales(businessId);
    } catch (err) {
      if (rutaFotoNueva) {
        await supabase.storage.from(STORAGE_BUCKET).remove([rutaFotoNueva]);
      }

      if (profesionalCreadoId) {
        await supabase
          .from("professional_services")
          .delete()
          .eq("professional_id", profesionalCreadoId)
          .eq("business_id", businessId);

        await supabase
          .from("professionals")
          .delete()
          .eq("id", profesionalCreadoId)
          .eq("business_id", businessId);
      }

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el profesional."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(profesional: Profesional) {
    setError("");
    setMensaje("");

    const nuevoEstado = !profesional.is_active;

    const { error } = await supabase
      .from("professionals")
      .update({
        is_active: nuevoEstado,
      })
      .eq("id", profesional.id)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    await cargarProfesionales(businessId);
  }

  async function cambiarReservas(profesional: Profesional) {
    setError("");
    setMensaje("");

    const nuevoEstado = !profesional.booking_enabled;

    const { error } = await supabase
      .from("professionals")
      .update({
        booking_enabled: nuevoEstado,
      })
      .eq("id", profesional.id)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    await cargarProfesionales(businessId);
  }

  async function asignarServicio(
    professionalId: string,
    serviceId: string
  ) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("professional_services")
      .insert({
        business_id: businessId,
        professional_id: professionalId,
        service_id: serviceId,
        custom_price: null,
        custom_duration_minutes: null,
        is_active: true,
      });

    if (error) {
      setError(error.message);
      return;
    }

    setMensaje("Servicio asignado correctamente.");

    await cargarProfesionales(businessId);
  }

  async function quitarServicio(
    professionalId: string,
    serviceId: string
  ) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("professional_services")
      .delete()
      .eq("professional_id", professionalId)
      .eq("service_id", serviceId)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    setMensaje("Servicio quitado correctamente.");

    await cargarProfesionales(businessId);
  }

  async function eliminarProfesional(profesional: Profesional) {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este profesional?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("professionals")
      .delete()
      .eq("id", profesional.id)
      .eq("business_id", businessId);

    if (error) {
      setError(error.message);
      return;
    }

    const rutaFoto = obtenerRutaStorage(profesional.photo_url);

    if (rutaFoto) {
      const { error: removeError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([rutaFoto]);

      if (removeError) {
        console.warn(
          "El profesional se eliminó, pero no se pudo borrar su foto de Storage:",
          removeError.message
        );
      }
    }

    setMensaje("Profesional eliminado correctamente.");

    await cargarProfesionales(businessId);
  }

  function obtenerServiciosAsignados(profesional: Profesional) {
    return (profesional.professional_services || [])
      .filter((relacion) => relacion.is_active)
      .map((relacion) => {
        const servicio = Array.isArray(relacion.services)
          ? relacion.services[0]
          : relacion.services;

        return servicio;
      })
      .filter(Boolean);
  }

  function obtenerServiciosDisponibles(profesional: Profesional) {
    const asignados = obtenerServiciosAsignados(profesional);

    const idsAsignados = asignados.map(
      (servicio) => servicio?.id
    );

    return servicios.filter(
      (servicio) => !idsAsignados.includes(servicio.id)
    );
  }

  if (cargando) {
    return (
      <main style={pantallaCargando}>
        <p>Cargando profesionales...</p>
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

            <h1 style={tituloStyle}>Profesionales</h1>

            <p style={subtituloStyle}>
              Administre su equipo, sus servicios y horarios de atención.
            </p>
          </div>

          <div style={contadorStyle}>
            <span style={contadorNumeroStyle}>
              {profesionales.length}
            </span>

            <span style={contadorTextoStyle}>
              {profesionales.length === 1
                ? "Profesional"
                : "Profesionales"}
            </span>
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

        <div style={gridPrincipalStyle}>
          <section style={tarjetaStyle}>
            <h2 style={seccionTituloStyle}>
              Nuevo profesional
            </h2>

            <p style={textoAyudaStyle}>
              Agregue una persona. Puede asignarle servicios ahora o hacerlo después.
            </p>

            <form onSubmit={crearProfesional}>
              <label style={labelStyle}>
                Nombre completo
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bryan Bermúdez"
                style={inputStyle}
                required
              />

              <label style={labelStyle}>
                Especialidad
              </label>

              <input
                type="text"
                value={especialidad}
                onChange={(e) =>
                  setEspecialidad(e.target.value)
                }
                placeholder="Ej. Barbero"
                style={inputStyle}
              />

              <label style={labelStyle}>
                Teléfono
              </label>

              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 8813-2725"
                style={inputStyle}
              />

              <label style={labelStyle}>
                Correo electrónico
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                style={inputStyle}
              />

              <label style={labelStyle}>
                Biografía o descripción
              </label>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ej. Especialista en cortes clásicos y modernos."
                style={{
                  ...inputStyle,
                  minHeight: "95px",
                  resize: "vertical",
                  fontFamily: "Arial, sans-serif",
                }}
              />

              <label style={labelStyle}>Foto del profesional</label>

              <div style={fotoNuevaCajaStyle}>
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="Vista previa del profesional"
                    style={fotoNuevaPreviewStyle}
                  />
                ) : (
                  <div style={fotoPlaceholderGrandeStyle}>
                    <span style={{ fontSize: "34px" }}>👤</span>
                    <span>Agregue una foto opcional</span>
                  </div>
                )}

                <div style={fotoNuevaAccionesStyle}>
                  <label style={botonSubirFotoStyle}>
                    {fotoPreview ? "Cambiar foto" : "Seleccionar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null;
                        seleccionarFotoNueva(file);
                        e.currentTarget.value = "";
                      }}
                      style={inputArchivoOcultoStyle}
                    />
                  </label>

                  {fotoPreview && (
                    <button
                      type="button"
                      onClick={limpiarFotoNueva}
                      style={botonQuitarFotoStyle}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              <p style={ayudaFotoStyle}>
                JPG, PNG o WebP. Tamaño máximo: 5 MB.
              </p>

              <label style={labelStyle}>
                Servicios que realiza
              </label>

              <div style={serviciosSelectorStyle}>
                {servicios.length === 0 ? (
                  <div>
                    <p
                      style={{
                        color: "#667085",
                        fontSize: "14px",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      Todavía no hay servicios creados. Puede crear el profesional ahora y asignarle servicios después.
                    </p>

                    <button
                      type="button"
                      onClick={() => router.push("/panel/servicios")}
                      style={{
                        marginTop: "12px",
                        border: "1px solid #B2CCFF",
                        background: "#EFF4FF",
                        color: "#175CD3",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      + Crear servicio
                    </button>
                  </div>
                ) : (
                  servicios.map((servicio) => (
                    <label
                      key={servicio.id}
                      style={servicioCheckboxStyle}
                    >
                      <input
                        type="checkbox"
                        checked={serviciosSeleccionados.includes(
                          servicio.id
                        )}
                        onChange={() =>
                          cambiarSeleccionServicio(servicio.id)
                        }
                      />

                      <div>
                        <strong>{servicio.name}</strong>

                        <div
                          style={{
                            color: "#667085",
                            fontSize: "13px",
                            marginTop: "3px",
                          }}
                        >
                          ₡
                          {Number(
                            servicio.price || 0
                          ).toLocaleString("es-CR")}
                          {" · "}
                          {servicio.duration_minutes} min
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <button
                type="submit"
                disabled={guardando}
                style={{
                  ...botonPrincipalStyle,
                  opacity: guardando ? 0.6 : 1,
                  cursor: guardando ? "not-allowed" : "pointer",
                }}
              >
                {guardando
                  ? "Guardando..."
                  : "+ Crear profesional"}
              </button>
            </form>
          </section>

          <section style={tarjetaStyle}>
            <h2 style={seccionTituloStyle}>
              Mi equipo
            </h2>

            <p style={textoAyudaStyle}>
              Profesionales registrados en su negocio.
            </p>

            {profesionales.length === 0 ? (
              <div style={vacioStyle}>
                <div style={iconoVacioStyle}>👤</div>

                <h3 style={{ marginBottom: "8px" }}>
                  Todavía no tiene profesionales
                </h3>

                <p
                  style={{
                    color: "#667085",
                    margin: 0,
                  }}
                >
                  Cree el primer integrante de su equipo.
                </p>
              </div>
            ) : (
              <div>
                {profesionales.map((profesional) => {
                  const asignados =
                    obtenerServiciosAsignados(profesional);

                  const disponibles =
                    obtenerServiciosDisponibles(profesional);

                  return (
                    <div
                      key={profesional.id}
                      style={profesionalStyle}
                    >
                      <div style={profesionalContenidoStyle}>
                        <div style={fotoColumnaStyle}>
                          <div style={fotoProfesionalCajaStyle}>
                            {profesional.photo_url ? (
                              <img
                                src={profesional.photo_url}
                                alt={profesional.name}
                                style={fotoProfesionalStyle}
                              />
                            ) : (
                              <div style={fotoProfesionalPlaceholderStyle}>
                                👤
                              </div>
                            )}
                          </div>

                          <div style={fotoAccionesListaStyle}>
                            <label
                              style={{
                                ...botonFotoListaStyle,
                                opacity:
                                  fotoProcesandoId === profesional.id ? 0.6 : 1,
                                cursor:
                                  fotoProcesandoId === profesional.id
                                    ? "not-allowed"
                                    : "pointer",
                                pointerEvents:
                                  fotoProcesandoId === profesional.id
                                    ? "none"
                                    : "auto",
                              }}
                            >
                              {fotoProcesandoId === profesional.id
                                ? "Procesando..."
                                : profesional.photo_url
                                ? "Cambiar foto"
                                : "Agregar foto"}

                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                  const input = e.currentTarget;
                                  const file = input.files?.[0] || null;
                                  input.value = "";
                                  void cambiarFotoProfesional(profesional, file);
                                }}
                                style={inputArchivoOcultoStyle}
                              />
                            </label>

                            {profesional.photo_url && (
                              <button
                                type="button"
                                onClick={() =>
                                  eliminarFotoProfesional(profesional)
                                }
                                disabled={fotoProcesandoId === profesional.id}
                                style={{
                                  ...botonQuitarFotoListaStyle,
                                  opacity:
                                    fotoProcesandoId === profesional.id ? 0.6 : 1,
                                  cursor:
                                    fotoProcesandoId === profesional.id
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              >
                                Quitar foto
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={tituloFilaStyle}>
                          <h3 style={profesionalTituloStyle}>
                            {profesional.name}
                          </h3>

                          <span
                            style={{
                              ...estadoStyle,
                              background:
                                profesional.is_active
                                  ? "#ecfdf3"
                                  : "#f2f4f7",
                              color:
                                profesional.is_active
                                  ? "#027a48"
                                  : "#667085",
                            }}
                          >
                            {profesional.is_active
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </div>

                        {profesional.specialty && (
                          <p style={especialidadStyle}>
                            {profesional.specialty}
                          </p>
                        )}

                        {profesional.bio && (
                          <p style={descripcionStyle}>
                            {profesional.bio}
                          </p>
                        )}

                        <div style={datosStyle}>
                          {profesional.phone && (
                            <span>
                              Tel. {profesional.phone}
                            </span>
                          )}

                          {profesional.email && (
                            <>
                              <span>•</span>
                              <span>
                                {profesional.email}
                              </span>
                            </>
                          )}
                        </div>

                        <div style={reservaStyle}>
                          {profesional.booking_enabled
                            ? "Disponible para reservas"
                            : "Reservas desactivadas"}
                        </div>

                        <div style={serviciosAsignadosBoxStyle}>
                          <strong
                            style={{
                              display: "block",
                              marginBottom: "10px",
                            }}
                          >
                            Servicios asignados
                          </strong>

                          {asignados.length === 0 ? (
                            <p
                              style={{
                                color: "#667085",
                                fontSize: "14px",
                                margin: 0,
                              }}
                            >
                              Sin servicios asignados.
                            </p>
                          ) : (
                            <div style={chipsStyle}>
                              {asignados.map((servicio) =>
                                servicio ? (
                                  <div
                                    key={servicio.id}
                                    style={chipStyle}
                                  >
                                    <span>
                                      {servicio.name}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        quitarServicio(
                                          profesional.id,
                                          servicio.id
                                        )
                                      }
                                      style={chipCerrarStyle}
                                      title="Quitar servicio"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : null
                              )}
                            </div>
                          )}

                          {disponibles.length > 0 && (
                            <div
                              style={{
                                marginTop: "14px",
                              }}
                            >
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  const serviceId =
                                    e.target.value;

                                  if (serviceId) {
                                    asignarServicio(
                                      profesional.id,
                                      serviceId
                                    );

                                    e.target.value = "";
                                  }
                                }}
                                style={selectServicioStyle}
                              >
                                <option value="">
                                  + Asignar servicio
                                </option>

                                {disponibles.map(
                                  (servicio) => (
                                    <option
                                      key={servicio.id}
                                      value={servicio.id}
                                    >
                                      {servicio.name}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                      <div style={accionesStyle}>
                        <button
                      
  type="button"
  onClick={() =>
    router.push(
      `/panel/horarios?professional=${profesional.id}`
    )
  }
  style={botonPrincipalPequenoStyle}
>
  Configurar horario
</button>

<button
  type="button"
  onClick={() =>
    router.push(
      `/panel/horarios/bloqueos?professional=${profesional.id}`
    )
  }
  style={botonSecundarioStyle}
>
  Bloqueos y excepciones

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            cambiarEstado(profesional)
                          }
                          style={botonSecundarioStyle}
                        >
                          {profesional.is_active
                            ? "Desactivar"
                            : "Activar"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            cambiarReservas(profesional)
                          }
                          style={botonSecundarioStyle}
                        >
                          {profesional.booking_enabled
                            ? "Bloquear reservas"
                            : "Habilitar reservas"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            eliminarProfesional(
                              profesional
                            )
                          }
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
  gridTemplateColumns:
    "minmax(300px, 400px) minmax(0, 1fr)",
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

const fotoNuevaCajaStyle: React.CSSProperties = {
  border: "1px solid #eaecf0",
  borderRadius: "14px",
  overflow: "hidden",
  background: "#f9fafb",
};

const fotoNuevaPreviewStyle: React.CSSProperties = {
  width: "100%",
  height: "230px",
  objectFit: "cover",
  display: "block",
};

const fotoPlaceholderGrandeStyle: React.CSSProperties = {
  height: "190px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  color: "#667085",
  fontSize: "14px",
};

const fotoNuevaAccionesStyle: React.CSSProperties = {
  padding: "12px",
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  background: "#ffffff",
  borderTop: "1px solid #eaecf0",
};

const botonSubirFotoStyle: React.CSSProperties = {
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

const botonQuitarFotoStyle: React.CSSProperties = {
  border: "1px solid #fecdca",
  background: "#ffffff",
  color: "#b42318",
  borderRadius: "8px",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 600,
};

const ayudaFotoStyle: React.CSSProperties = {
  color: "#98a2b3",
  fontSize: "12px",
  margin: "7px 0 18px",
};

const inputArchivoOcultoStyle: React.CSSProperties = {
  display: "none",
};

const serviciosSelectorStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  padding: "10px",
  marginBottom: "20px",
  maxHeight: "230px",
  overflowY: "auto",
};

const servicioCheckboxStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  padding: "10px",
  cursor: "pointer",
  borderBottom: "1px solid #eaecf0",
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

const profesionalStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  padding: "22px 0",
  borderBottom: "1px solid #eaecf0",
  flexWrap: "wrap",
};

const profesionalContenidoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: "290px",
  display: "flex",
  gap: "18px",
  alignItems: "flex-start",
};

const fotoColumnaStyle: React.CSSProperties = {
  width: "110px",
  minWidth: "110px",
};

const fotoProfesionalCajaStyle: React.CSSProperties = {
  width: "96px",
  height: "96px",
  borderRadius: "50%",
  overflow: "hidden",
  background: "#f2f4f7",
  border: "1px solid #eaecf0",
};

const fotoProfesionalStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const fotoProfesionalPlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "34px",
  color: "#667085",
};

const fotoAccionesListaStyle: React.CSSProperties = {
  display: "grid",
  gap: "5px",
  marginTop: "8px",
};

const botonFotoListaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "7px 8px",
  fontSize: "11px",
  fontWeight: 600,
  color: "#344054",
  textAlign: "center",
};

const botonQuitarFotoListaStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#b42318",
  padding: "4px",
  fontSize: "11px",
  fontWeight: 600,
};

const tituloFilaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const profesionalTituloStyle: React.CSSProperties = {
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

const especialidadStyle: React.CSSProperties = {
  color: "#344054",
  fontSize: "14px",
  fontWeight: "600",
  margin: "8px 0 0",
};

const descripcionStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "14px",
  lineHeight: 1.5,
  margin: "8px 0",
};

const datosStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  color: "#475467",
  fontSize: "14px",
  marginTop: "10px",
};

const reservaStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "13px",
  marginTop: "10px",
};

const serviciosAsignadosBoxStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  background: "#f9fafb",
  borderRadius: "10px",
};

const chipsStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const chipStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "#ffffff",
  border: "1px solid #d0d5dd",
  fontSize: "13px",
};

const chipCerrarStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#b42318",
  cursor: "pointer",
  fontSize: "17px",
  lineHeight: 1,
  padding: 0,
};

const selectServicioStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  background: "#ffffff",
};

const accionesStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: "150px",
};

const botonPrincipalPequenoStyle: React.CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: "600",
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