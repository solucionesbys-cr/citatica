"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const BUSINESS_ASSETS_BUCKET = "business-assets";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Negocio = {
  id: string;
  business_name: string;
  legal_name: string | null;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  country_code: string;
  province: string | null;
  canton: string | null;
  district: string | null;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  timezone: string;
  currency_code: string;
  language_code: string;
  custom_domain: string | null;
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

export default function ConfiguracionPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [province, setProvince] = useState("");
  const [canton, setCanton] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");

  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);

  const [primaryColor, setPrimaryColor] = useState("#0EA5E9");
  const [secondaryColor, setSecondaryColor] = useState("#0F172A");
  const [accentColor, setAccentColor] = useState("#FFFFFF");

  const [timezone, setTimezone] = useState("America/Costa_Rica");
  const [currencyCode, setCurrencyCode] = useState("CRC");
  const [languageCode, setLanguageCode] = useState("es-CR");

  const [customDomain, setCustomDomain] = useState("");

  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [showTeam, setShowTeam] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  const [showSocialLinks, setShowSocialLinks] = useState(true);

  const [minimumBookingNoticeMinutes, setMinimumBookingNoticeMinutes] =
    useState(60);

  const [maximumBookingDays, setMaximumBookingDays] = useState(90);

  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [bookingConfirmationMessage, setBookingConfirmationMessage] =
    useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  async function cargarConfiguracion() {
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

    const { data: negocio, error: negocioError } = await supabase
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
        country_code,
        province,
        canton,
        district,
        address,
        logo_url,
        cover_url,
        primary_color,
        secondary_color,
        accent_color,
        timezone,
        currency_code,
        language_code,
        custom_domain,
        status
      `)
      .eq("id", idNegocio)
      .single();

    if (negocioError || !negocio) {
      setError(
        negocioError?.message || "No se pudo cargar el negocio."
      );
      setCargando(false);
      return;
    }

    cargarNegocioEnFormulario(negocio as Negocio);

    const { data: configuracion, error: configuracionError } =
      await supabase
        .from("business_settings")
        .select(`
          business_id,
          booking_enabled,
          show_prices,
          show_team,
          show_reviews,
          show_location,
          show_social_links,
          minimum_booking_notice_minutes,
          maximum_booking_days,
          cancellation_policy,
          booking_confirmation_message
        `)
        .eq("business_id", idNegocio)
        .maybeSingle();

    if (configuracionError) {
      setError(configuracionError.message);
      setCargando(false);
      return;
    }

    if (configuracion) {
      cargarSettingsEnFormulario(configuracion as Configuracion);
    } else {
      const { error: crearSettingsError } = await supabase
        .from("business_settings")
        .insert({
          business_id: idNegocio,
        });

      if (crearSettingsError) {
        setError(crearSettingsError.message);
        setCargando(false);
        return;
      }
    }

    setCargando(false);
  }

  function cargarNegocioEnFormulario(negocio: Negocio) {
    setBusinessName(negocio.business_name || "");
    setLegalName(negocio.legal_name || "");
    setSlug(negocio.slug || "");
    setDescription(negocio.description || "");

    setEmail(negocio.email || "");
    setPhone(negocio.phone || "");
    setWhatsapp(negocio.whatsapp || "");

    setProvince(negocio.province || "");
    setCanton(negocio.canton || "");
    setDistrict(negocio.district || "");
    setAddress(negocio.address || "");

    setLogoUrl(negocio.logo_url || "");
    setCoverUrl(negocio.cover_url || "");
    setLogoPreview(negocio.logo_url || "");
    setCoverPreview(negocio.cover_url || "");
    setLogoFile(null);
    setCoverFile(null);
    setRemoveLogo(false);
    setRemoveCover(false);

    setPrimaryColor(negocio.primary_color || "#0EA5E9");
    setSecondaryColor(negocio.secondary_color || "#0F172A");
    setAccentColor(negocio.accent_color || "#FFFFFF");

    setTimezone(negocio.timezone || "America/Costa_Rica");
    setCurrencyCode(negocio.currency_code || "CRC");
    setLanguageCode(negocio.language_code || "es-CR");

    setCustomDomain(negocio.custom_domain || "");
  }

  function cargarSettingsEnFormulario(configuracion: Configuracion) {
    setBookingEnabled(configuracion.booking_enabled);
    setShowPrices(configuracion.show_prices);
    setShowTeam(configuracion.show_team);
    setShowReviews(configuracion.show_reviews);
    setShowLocation(configuracion.show_location);
    setShowSocialLinks(configuracion.show_social_links);

    setMinimumBookingNoticeMinutes(
      configuracion.minimum_booking_notice_minutes
    );

    setMaximumBookingDays(configuracion.maximum_booking_days);

    setCancellationPolicy(configuracion.cancellation_policy || "");

    setBookingConfirmationMessage(
      configuracion.booking_confirmation_message || ""
    );
  }

  function validarImagen(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Solo se permiten imágenes JPG, PNG o WebP.");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("La imagen no puede superar los 5 MB.");
    }
  }

  function seleccionarLogo(file: File | null) {
    if (!file) return;

    try {
      validarImagen(file);
      setError("");
      setLogoFile(file);
      setRemoveLogo(false);
      setLogoPreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo seleccionar el logo.");
    }
  }

  function seleccionarPortada(file: File | null) {
    if (!file) return;

    try {
      validarImagen(file);
      setError("");
      setCoverFile(file);
      setRemoveCover(false);
      setCoverPreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo seleccionar la portada.");
    }
  }

  function quitarLogo() {
    setLogoFile(null);
    setLogoPreview("");
    setLogoUrl("");
    setRemoveLogo(true);
  }

  function quitarPortada() {
    setCoverFile(null);
    setCoverPreview("");
    setCoverUrl("");
    setRemoveCover(true);
  }

  async function subirImagen(
    tipo: "logo" | "cover",
    file: File
  ) {
    validarImagen(file);

    const path = `${businessId}/${tipo}/${tipo}`;

    const { error: uploadError } = await supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`No se pudo subir ${tipo === "logo" ? "el logo" : "la portada"}: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .getPublicUrl(path);

    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function eliminarImagenGuardada(tipo: "logo" | "cover") {
    const path = `${businessId}/${tipo}/${tipo}`;
    const { error: removeError } = await supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .remove([path]);

    if (removeError) {
      throw new Error(`No se pudo eliminar ${tipo === "logo" ? "el logo" : "la portada"}: ${removeError.message}`);
    }
  }

  async function guardarConfiguracion(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!businessId) {
      setError("No se encontró el negocio.");
      return;
    }

    if (!businessName.trim()) {
      setError("Ingrese el nombre del negocio.");
      return;
    }

    if (!slug.trim()) {
      setError("Ingrese el slug del negocio.");
      return;
    }

    if (minimumBookingNoticeMinutes < 0) {
      setError(
        "El tiempo mínimo de anticipación no puede ser negativo."
      );
      return;
    }

    if (maximumBookingDays < 1) {
      setError(
        "La cantidad máxima de días para reservar debe ser mayor que cero."
      );
      return;
    }

    setGuardando(true);

    let finalLogoUrl = logoUrl.trim() || null;
    let finalCoverUrl = coverUrl.trim() || null;

    try {
      if (logoFile) {
        finalLogoUrl = await subirImagen("logo", logoFile);
      } else if (removeLogo) {
        await eliminarImagenGuardada("logo");
        finalLogoUrl = null;
      }

      if (coverFile) {
        finalCoverUrl = await subirImagen("cover", coverFile);
      } else if (removeCover) {
        await eliminarImagenGuardada("cover");
        finalCoverUrl = null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar las imágenes.");
      setGuardando(false);
      return;
    }

    const { error: negocioError } = await supabase
      .from("businesses")
      .update({
        business_name: businessName.trim(),
        legal_name: legalName.trim() || null,
        slug: slug.trim(),
        description: description.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        province: province.trim() || null,
        canton: canton.trim() || null,
        district: district.trim() || null,
        address: address.trim() || null,
        logo_url: finalLogoUrl,
        cover_url: finalCoverUrl,
        primary_color: primaryColor || null,
        secondary_color: secondaryColor || null,
        accent_color: accentColor || null,
        timezone,
        currency_code: currencyCode,
        language_code: languageCode,
        custom_domain: customDomain.trim() || null,
      })
      .eq("id", businessId);

    if (negocioError) {
      setError(negocioError.message);
      setGuardando(false);
      return;
    }

    const { error: settingsError } = await supabase
      .from("business_settings")
      .upsert({
        business_id: businessId,
        booking_enabled: bookingEnabled,
        show_prices: showPrices,
        show_team: showTeam,
        show_reviews: showReviews,
        show_location: showLocation,
        show_social_links: showSocialLinks,
        minimum_booking_notice_minutes: minimumBookingNoticeMinutes,
        maximum_booking_days: maximumBookingDays,
        cancellation_policy: cancellationPolicy.trim() || null,
        booking_confirmation_message:
          bookingConfirmationMessage.trim() || null,
      });

    if (settingsError) {
      setError(settingsError.message);
      setGuardando(false);
      return;
    }

    setLogoUrl(finalLogoUrl || "");
    setCoverUrl(finalCoverUrl || "");
    setLogoPreview(finalLogoUrl || "");
    setCoverPreview(finalCoverUrl || "");
    setLogoFile(null);
    setCoverFile(null);
    setRemoveLogo(false);
    setRemoveCover(false);

    setMensaje("Configuración guardada correctamente.");
    setGuardando(false);
  }

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <p>Cargando configuración...</p>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={contenedorStyle}>
        <button
          type="button"
          onClick={() => router.push("/panel")}
          style={volverStyle}
        >
          ← Volver al panel
        </button>

        <div style={encabezadoStyle}>
          <div>
            <h1 style={tituloStyle}>Configuración</h1>

            <p style={subtituloStyle}>
              Administre los datos, apariencia y reglas de reserva de su
              negocio.
            </p>
          </div>
        </div>

        {error && (
          <div style={errorStyle}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {mensaje && <div style={mensajeStyle}>{mensaje}</div>}

        <form onSubmit={guardarConfiguracion}>
          <section style={seccionStyle}>
            <h2 style={seccionTituloStyle}>
              Información del negocio
            </h2>

            <p style={textoAyudaStyle}>
              Datos generales que identifican su negocio.
            </p>

            <div style={gridDosColumnasStyle}>
              <div>
                <label style={labelStyle}>
                  Nombre comercial *
                </label>

                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Barbería Central"
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Nombre legal
                </label>

                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Razón social"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Slug público *
                </label>

                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  placeholder="barberia-central"
                  style={inputStyle}
                  required
                />

                <p style={ayudaMiniStyle}>
                  Se utilizará después en la página pública de reservas.
                </p>
              </div>

              <div>
                <label style={labelStyle}>
                  Dominio personalizado
                </label>

                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="reservas.minegocio.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>
                  Descripción
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describa brevemente su negocio..."
                  style={{
                    ...inputStyle,
                    minHeight: "100px",
                    resize: "vertical",
                    fontFamily: "Arial, sans-serif",
                  }}
                />
              </div>
            </div>
          </section>

          <section style={seccionStyle}>
            <h2 style={seccionTituloStyle}>
              Contacto
            </h2>

            <p style={textoAyudaStyle}>
              Información de contacto del negocio.
            </p>

            <div style={gridTresColumnasStyle}>
              <div>
                <label style={labelStyle}>
                  Correo electrónico
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@negocio.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Teléfono
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="8888-8888"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  WhatsApp
                </label>

                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="8888-8888"
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <section style={seccionStyle}>
            <h2 style={seccionTituloStyle}>
              Ubicación
            </h2>

            <p style={textoAyudaStyle}>
              Información geográfica que podrá mostrarse en la página pública.
            </p>

            <div style={gridTresColumnasStyle}>
              <div>
                <label style={labelStyle}>
                  Provincia
                </label>

                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Guanacaste"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Cantón
                </label>

                <input
                  type="text"
                  value={canton}
                  onChange={(e) => setCanton(e.target.value)}
                  placeholder="Hojancha"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Distrito
                </label>

                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Hojancha"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>
                  Dirección exacta
                </label>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Señas del negocio..."
                  style={{
                    ...inputStyle,
                    minHeight: "85px",
                    resize: "vertical",
                    fontFamily: "Arial, sans-serif",
                  }}
                />
              </div>
            </div>
          </section>

          <section style={seccionStyle}>
            <h2 style={seccionTituloStyle}>
              Apariencia
            </h2>

            <p style={textoAyudaStyle}>
              Estos datos se utilizarán más adelante en la página pública.
            </p>

            <div style={gridDosColumnasStyle}>
              <ImagenCampo
                inputId="business-logo-upload"
                label="Logo del negocio"
                description="JPG, PNG o WebP. Máximo 5 MB."
                previewUrl={logoPreview}
                variant="logo"
                disabled={guardando}
                onFileSelected={seleccionarLogo}
                onRemove={quitarLogo}
              />

              <ImagenCampo
                inputId="business-cover-upload"
                label="Imagen de portada"
                description="JPG, PNG o WebP. Máximo 5 MB. Recomendado: formato horizontal."
                previewUrl={coverPreview}
                variant="cover"
                disabled={guardando}
                onFileSelected={seleccionarPortada}
                onRemove={quitarPortada}
              />
            </div>

            <div style={coloresGridStyle}>
              <ColorCampo
                label="Color principal"
                value={primaryColor}
                onChange={setPrimaryColor}
              />

              <ColorCampo
                label="Color secundario"
                value={secondaryColor}
                onChange={setSecondaryColor}
              />

              <ColorCampo
                label="Color de acento"
                value={accentColor}
                onChange={setAccentColor}
              />
            </div>
          </section>

          <section style={seccionStyle}>
            <h2 style={seccionTituloStyle}>
              Preferencias regionales
            </h2>

            <div style={gridTresColumnasStyle}>
              <div>
                <label style={labelStyle}>
                  Zona horaria
                </label>

                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={inputStyle}
                >
                  <option value="America/Costa_Rica">
                    Costa Rica
                  </option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Moneda
                </label>

                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  style={inputStyle}
                >
                  <option value="CRC">
                    Colón costarricense (CRC)
                  </option>

                  <option value="USD">
                    Dólar estadounidense (USD)
                  </option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Idioma
                </label>

                <select
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  style={inputStyle}
                >
                  <option value="es-CR">
                    Español - Costa Rica
                  </option>

                  <option value="en-US">
                    English
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section style={seccionStyle}>
            <h2 style={seccionTituloStyle}>
              Reservas en línea
            </h2>

            <p style={textoAyudaStyle}>
              Controle qué información podrá ver el cliente y cómo podrá reservar.
            </p>

            <div style={switchGridStyle}>
              <SwitchCampo
                label="Permitir reservas en línea"
                description="Los clientes podrán crear citas desde la página pública."
                checked={bookingEnabled}
                onChange={setBookingEnabled}
              />

              <SwitchCampo
                label="Mostrar precios"
                description="Mostrar el precio de los servicios."
                checked={showPrices}
                onChange={setShowPrices}
              />

              <SwitchCampo
                label="Mostrar profesionales"
                description="Mostrar el equipo disponible al cliente."
                checked={showTeam}
                onChange={setShowTeam}
              />

              <SwitchCampo
                label="Mostrar reseñas"
                description="Mostrar reseñas cuando incorporemos este módulo."
                checked={showReviews}
                onChange={setShowReviews}
              />

              <SwitchCampo
                label="Mostrar ubicación"
                description="Mostrar la ubicación del negocio."
                checked={showLocation}
                onChange={setShowLocation}
              />

              <SwitchCampo
                label="Mostrar redes sociales"
                description="Mostrar los enlaces sociales del negocio."
                checked={showSocialLinks}
                onChange={setShowSocialLinks}
              />
            </div>
          </section>

          <section style={seccionStyle}>
            <h2 style={seccionTituloStyle}>
              Reglas de reserva
            </h2>

            <div style={gridDosColumnasStyle}>
              <div>
                <label style={labelStyle}>
                  Anticipación mínima
                </label>

                <select
                  value={minimumBookingNoticeMinutes}
                  onChange={(e) =>
                    setMinimumBookingNoticeMinutes(
                      Number(e.target.value)
                    )
                  }
                  style={inputStyle}
                >
                  <option value={0}>
                    Sin límite
                  </option>

                  <option value={30}>
                    30 minutos
                  </option>

                  <option value={60}>
                    1 hora
                  </option>

                  <option value={120}>
                    2 horas
                  </option>

                  <option value={240}>
                    4 horas
                  </option>

                  <option value={720}>
                    12 horas
                  </option>

                  <option value={1440}>
                    1 día
                  </option>

                  <option value={2880}>
                    2 días
                  </option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Reservar hasta
                </label>

                <input
                  type="number"
                  min={1}
                  value={maximumBookingDays}
                  onChange={(e) =>
                    setMaximumBookingDays(Number(e.target.value))
                  }
                  style={inputStyle}
                />

                <p style={ayudaMiniStyle}>
                  Cantidad máxima de días hacia el futuro.
                </p>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>
                  Política de cancelación
                </label>

                <textarea
                  value={cancellationPolicy}
                  onChange={(e) =>
                    setCancellationPolicy(e.target.value)
                  }
                  placeholder="Ej. Las citas deben cancelarse con al menos 24 horas de anticipación."
                  style={{
                    ...inputStyle,
                    minHeight: "100px",
                    resize: "vertical",
                    fontFamily: "Arial, sans-serif",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>
                  Mensaje después de reservar
                </label>

                <textarea
                  value={bookingConfirmationMessage}
                  onChange={(e) =>
                    setBookingConfirmationMessage(e.target.value)
                  }
                  placeholder="Ej. Su cita ha sido recibida. Le esperamos..."
                  style={{
                    ...inputStyle,
                    minHeight: "100px",
                    resize: "vertical",
                    fontFamily: "Arial, sans-serif",
                  }}
                />
              </div>
            </div>
          </section>

          <div style={accionesStyle}>
            <button
              type="button"
              onClick={() => router.push("/panel")}
              style={botonSecundarioStyle}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              style={{
                ...botonGuardarStyle,
                opacity: guardando ? 0.65 : 1,
                cursor: guardando ? "not-allowed" : "pointer",
              }}
            >
              {guardando
                ? "Guardando..."
                : "Guardar configuración"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function ImagenCampo({
  inputId,
  label,
  description,
  previewUrl,
  variant,
  disabled,
  onFileSelected,
  onRemove,
}: {
  inputId: string;
  label: string;
  description: string;
  previewUrl: string;
  variant: "logo" | "cover";
  disabled: boolean;
  onFileSelected: (file: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <div style={imagenCardStyle}>
      <label style={labelStyle}>{label}</label>

      <div
        style={{
          ...imagenPreviewStyle,
          height: variant === "logo" ? "190px" : "190px",
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            style={{
              width: variant === "logo" ? "150px" : "100%",
              height: variant === "logo" ? "150px" : "100%",
              objectFit: variant === "logo" ? "contain" : "cover",
              borderRadius: variant === "logo" ? "18px" : "12px",
            }}
          />
        ) : (
          <div style={imagenPlaceholderStyle}>
            <span style={{ fontSize: "32px" }}>🖼️</span>
            <span>Sin imagen</span>
          </div>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(e) => {
          onFileSelected(e.target.files?.[0] || null);
          e.currentTarget.value = "";
        }}
        style={{ display: "none" }}
      />

      <div style={imagenAccionesStyle}>
        <label
          htmlFor={inputId}
          style={{
            ...botonImagenStyle,
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {previewUrl ? "Cambiar imagen" : "Seleccionar imagen"}
        </label>

        {previewUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            style={{
              ...botonEliminarImagenStyle,
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            Eliminar
          </button>
        )}
      </div>

      <p style={imagenAyudaStyle}>{description}</p>
    </div>
  );
}

function ColorCampo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <div style={colorFilaStyle}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={colorInputStyle}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...inputStyle,
            marginBottom: 0,
          }}
        />
      </div>
    </div>
  );
}

function SwitchCampo({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={switchCardStyle}>
      <div>
        <strong style={switchTituloStyle}>
          {label}
        </strong>

        <span style={switchDescripcionStyle}>
          {description}
        </span>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={checkboxStyle}
      />
    </label>
  );
}

const pantallaCargaStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  color: "#667085",
};

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
  padding: "35px 20px 80px",
};

const contenedorStyle: React.CSSProperties = {
  maxWidth: "1150px",
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

const seccionStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
  marginBottom: "22px",
};

const seccionTituloStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "21px",
  color: "#101828",
};

const textoAyudaStyle: React.CSSProperties = {
  margin: "7px 0 22px",
  color: "#667085",
  fontSize: "14px",
};

const gridDosColumnasStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0 18px",
};

const gridTresColumnasStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0 18px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "7px",
  color: "#344054",
  fontSize: "14px",
  fontWeight: "600",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "9px",
  padding: "12px 13px",
  marginBottom: "17px",
  fontSize: "15px",
  background: "#ffffff",
  color: "#101828",
};

const ayudaMiniStyle: React.CSSProperties = {
  marginTop: "-10px",
  marginBottom: "15px",
  color: "#98a2b3",
  fontSize: "12px",
};

const imagenCardStyle: React.CSSProperties = {
  border: "1px solid #eaecf0",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "18px",
  background: "#ffffff",
};

const imagenPreviewStyle: React.CSSProperties = {
  width: "100%",
  border: "1px dashed #d0d5dd",
  borderRadius: "12px",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  marginBottom: "12px",
};

const imagenPlaceholderStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  color: "#98a2b3",
  fontSize: "13px",
};

const imagenAccionesStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const botonImagenStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#101828",
  borderRadius: "9px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "600",
};

const botonEliminarImagenStyle: React.CSSProperties = {
  border: "1px solid #fecdca",
  background: "#ffffff",
  color: "#b42318",
  borderRadius: "9px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "600",
};

const imagenAyudaStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#98a2b3",
  fontSize: "12px",
};

const coloresGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "18px",
  marginTop: "5px",
};

const colorFilaStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px 1fr",
  gap: "8px",
  alignItems: "center",
};

const colorInputStyle: React.CSSProperties = {
  width: "52px",
  height: "43px",
  border: "1px solid #d0d5dd",
  borderRadius: "9px",
  padding: "4px",
  background: "#ffffff",
  cursor: "pointer",
};

const switchGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const switchCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  border: "1px solid #eaecf0",
  borderRadius: "12px",
  padding: "16px",
  cursor: "pointer",
};

const switchTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#101828",
  fontSize: "14px",
};

const switchDescripcionStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "12px",
  marginTop: "4px",
};

const checkboxStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  cursor: "pointer",
};

const accionesStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const botonSecundarioStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#101828",
  borderRadius: "9px",
  padding: "12px 18px",
  fontWeight: "600",
  cursor: "pointer",
};

const botonGuardarStyle: React.CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "9px",
  padding: "12px 20px",
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