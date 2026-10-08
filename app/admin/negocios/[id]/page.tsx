"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Negocio = {
  id: string;
  business_name: string;
  slug: string;
  timezone: string | null;
  created_at?: string | null;
};

type ConfiguracionNegocio = {
  business_id: string;
  is_published?: boolean | null;
};

type Suscripcion = {
  business_id: string;
  plan_code?: string | null;
  status?: string | null;
  billing_cycle?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  subscription_started_at?: string | null;
  subscription_ends_at?: string | null;
};

type Resumen = {
  clientes: number;
  servicios: number;
  profesionales: number;
  citas: number;
  pagos: number;
};


type PreviewEliminacion = {
  businessId: string;
  businessName: string;
  slug: string;
  createdAt: string | null;
  counts: {
    miembros: number;
    clientes: number;
    servicios: number;
    profesionales: number;
    citas: number;
    pagos: number;
    suscripciones: number;
    configuraciones: number;
  };
};

const resumenInicial: Resumen = {
  clientes: 0,
  servicios: 0,
  profesionales: 0,
  citas: 0,
  pagos: 0,
};

export default function AdminNegocioDetallePage() {
  const router = useRouter();
  const params = useParams();

  const businessId = Array.isArray(params?.id)
    ? params.id[0]
    : String(params?.id || "");

  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");

  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [configuracion, setConfiguracion] =
    useState<ConfiguracionNegocio | null>(null);
  const [suscripcion, setSuscripcion] =
    useState<Suscripcion | null>(null);
  const [resumen, setResumen] =
    useState<Resumen>(resumenInicial);

  const [guardandoPublicacion, setGuardandoPublicacion] =
    useState(false);
  const [mensajeAccion, setMensajeAccion] = useState("");

  const [planSeleccionado, setPlanSeleccionado] =
    useState("EMPRENDE");
  const [estadoSeleccionado, setEstadoSeleccionado] =
    useState("TRIAL");
  const [cicloSeleccionado, setCicloSeleccionado] =
    useState("MONTHLY");
  const [guardandoSuscripcion, setGuardandoSuscripcion] =
    useState(false);
  const [cambiandoEstadoNegocio, setCambiandoEstadoNegocio] =
    useState(false);
  const [previewEliminacion, setPreviewEliminacion] =
    useState<PreviewEliminacion | null>(null);
  const [confirmacionNombre, setConfirmacionNombre] = useState("");
  const [preparandoEliminacion, setPreparandoEliminacion] =
    useState(false);
  const [eliminandoNegocio, setEliminandoNegocio] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    verificarAccesoYCargar();
  }, [businessId]);

  async function verificarAccesoYCargar() {
    setCargando(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !admin) {
      router.replace("/panel");
      return;
    }

    setAutorizado(true);
    await cargarNegocio();
    setCargando(false);
  }

  async function cargarNegocio() {
    const [
      negocioResultado,
      configuracionResultado,
      suscripcionResultado,
      clientesResultado,
      serviciosResultado,
      profesionalesResultado,
      citasResultado,
      pagosResultado,
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, business_name, slug, timezone, created_at")
        .eq("id", businessId)
        .maybeSingle(),

      supabase
        .from("business_settings")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle(),

      supabase
        .from("business_subscriptions")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle(),

      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),

      supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),

      supabase
        .from("professionals")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),

      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),

      supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),
    ]);

    if (negocioResultado.error) {
      setError(
        `No se pudo cargar el negocio: ${negocioResultado.error.message}`
      );
      return;
    }

    if (!negocioResultado.data) {
      setError("No se encontró el negocio solicitado.");
      return;
    }

    setNegocio(negocioResultado.data as Negocio);

    setConfiguracion(
      (configuracionResultado.data as ConfiguracionNegocio | null) ||
        null
    );

    const suscripcionData =
      (suscripcionResultado.data as Suscripcion | null) || null;

    setSuscripcion(suscripcionData);

    if (suscripcionData?.plan_code) {
      setPlanSeleccionado(suscripcionData.plan_code);
    }

    if (suscripcionData?.status) {
      setEstadoSeleccionado(suscripcionData.status);
    }

    if (suscripcionData?.billing_cycle) {
      setCicloSeleccionado(suscripcionData.billing_cycle);
    }

    setResumen({
      clientes: clientesResultado.count || 0,
      servicios: serviciosResultado.count || 0,
      profesionales: profesionalesResultado.count || 0,
      citas: citasResultado.count || 0,
      pagos: pagosResultado.count || 0,
    });
  }

  async function obtenerAccessToken() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return null;
    }

    return session.access_token;
  }

  async function cambiarPublicacion() {
    if (!negocio || guardandoPublicacion) return;

    setGuardandoPublicacion(true);
    setMensajeAccion("");

    try {
      const accessToken = await obtenerAccessToken();

      if (!accessToken) {
        setMensajeAccion(
          "No encontramos una sesión válida. Inicie sesión nuevamente."
        );
        return;
      }

      const nuevoEstado =
        !Boolean(configuracion?.is_published);

      const respuesta = await fetch(
        "/api/admin/negocios/publicacion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            businessId: negocio.id,
            isPublished: nuevoEstado,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeAccion(
          resultado?.error ||
            "No se pudo actualizar la publicación."
        );
        return;
      }

      setConfiguracion((actual) => ({
        ...(actual || { business_id: negocio.id }),
        is_published: nuevoEstado,
      }));

      setMensajeAccion(
        nuevoEstado
          ? "Negocio publicado correctamente."
          : "Negocio ocultado correctamente."
      );
    } catch (error) {
      console.error("Error cambiando publicación:", error);
      setMensajeAccion(
        "Ocurrió un error al actualizar la publicación."
      );
    } finally {
      setGuardandoPublicacion(false);
    }
  }

  async function guardarSuscripcion() {
    if (!negocio || guardandoSuscripcion) return;

    setGuardandoSuscripcion(true);
    setMensajeAccion("");

    try {
      const accessToken = await obtenerAccessToken();

      if (!accessToken) {
        setMensajeAccion(
          "No encontramos una sesión válida. Inicie sesión nuevamente."
        );
        return;
      }

      const respuesta = await fetch(
        "/api/admin/negocios/suscripcion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            businessId: negocio.id,
            planCode: planSeleccionado,
            status: estadoSeleccionado,
            billingCycle: cicloSeleccionado,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeAccion(
          resultado?.error ||
            "No se pudo actualizar la suscripción."
        );
        return;
      }

      setSuscripcion((actual) => ({
        business_id: negocio.id,
        ...actual,
        plan_code: resultado.planCode,
        status: resultado.status,
        billing_cycle: resultado.billingCycle,
        trial_started_at: resultado.trialStartedAt,
        trial_ends_at: resultado.trialEndsAt,
        subscription_started_at:
          resultado.subscriptionStartedAt,
        subscription_ends_at:
          resultado.subscriptionEndsAt,
      }));

      setMensajeAccion(
        "Suscripción actualizada correctamente."
      );
    } catch (error) {
      console.error("Error cambiando suscripción:", error);
      setMensajeAccion(
        "Ocurrió un error al actualizar la suscripción."
      );
    } finally {
      setGuardandoSuscripcion(false);
    }
  }


  async function cambiarEstadoNegocio() {
    if (!negocio || cambiandoEstadoNegocio) return;

    const suspendido = suscripcion?.status === "SUSPENDED";
    const accion = suspendido ? "REACTIVATE" : "SUSPEND";

    const confirmado = window.confirm(
      suspendido
        ? `¿Desea reactivar el negocio "${negocio.business_name}"?`
        : `¿Desea suspender el negocio "${negocio.business_name}"? Al suspenderlo también se ocultará de la página pública.`
    );

    if (!confirmado) return;

    setCambiandoEstadoNegocio(true);
    setMensajeAccion("");

    try {
      const accessToken = await obtenerAccessToken();

      if (!accessToken) {
        setMensajeAccion(
          "No encontramos una sesión válida. Inicie sesión nuevamente."
        );
        return;
      }

      const respuesta = await fetch(
        "/api/admin/negocios/estado",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            businessId: negocio.id,
            action: accion,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeAccion(
          resultado?.error ||
            "No se pudo cambiar el estado del negocio."
        );
        return;
      }

      setSuscripcion((actual) => ({
        business_id: negocio.id,
        ...actual,
        status: resultado.status,
      }));

      if (resultado.isPublished === false) {
        setConfiguracion((actual) => ({
          ...(actual || { business_id: negocio.id }),
          is_published: false,
        }));
      }

      setEstadoSeleccionado(resultado.status);

      setMensajeAccion(
        resultado.status === "SUSPENDED"
          ? "Negocio suspendido correctamente."
          : "Negocio reactivado correctamente."
      );
    } catch (error) {
      console.error("Error cambiando estado del negocio:", error);
      setMensajeAccion(
        "Ocurrió un error al cambiar el estado del negocio."
      );
    } finally {
      setCambiandoEstadoNegocio(false);
    }
  }

  async function prepararEliminacion() {
    if (!negocio || preparandoEliminacion) return;

    setPreparandoEliminacion(true);
    setMensajeAccion("");
    setConfirmacionNombre("");

    try {
      const accessToken = await obtenerAccessToken();

      if (!accessToken) {
        setMensajeAccion(
          "No encontramos una sesión válida. Inicie sesión nuevamente."
        );
        return;
      }

      const respuesta = await fetch(
        "/api/admin/negocios/eliminar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            businessId: negocio.id,
            action: "PREVIEW",
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeAccion(
          resultado?.error || "No se pudo preparar la eliminación."
        );
        return;
      }

      setPreviewEliminacion(resultado.preview as PreviewEliminacion);
    } catch (error) {
      console.error("Error preparando eliminación:", error);
      setMensajeAccion(
        "Ocurrió un error al preparar la eliminación."
      );
    } finally {
      setPreparandoEliminacion(false);
    }
  }

  async function eliminarNegocio() {
    if (!negocio || !previewEliminacion || eliminandoNegocio) return;

    if (confirmacionNombre !== negocio.business_name) {
      setMensajeAccion(
        "Escriba exactamente el nombre del negocio para continuar."
      );
      return;
    }

    const confirmado = window.confirm(
      `ÚLTIMA CONFIRMACIÓN\n\nVa a eliminar permanentemente "${negocio.business_name}".\n\nEsta acción no se puede deshacer.\n\n¿Desea continuar?`
    );

    if (!confirmado) return;

    setEliminandoNegocio(true);
    setMensajeAccion("");

    try {
      const accessToken = await obtenerAccessToken();

      if (!accessToken) {
        setMensajeAccion(
          "No encontramos una sesión válida. Inicie sesión nuevamente."
        );
        return;
      }

      const respuesta = await fetch(
        "/api/admin/negocios/eliminar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            businessId: negocio.id,
            action: "DELETE",
            confirmName: confirmacionNombre,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeAccion(
          resultado?.error || "No se pudo eliminar el negocio."
        );
        return;
      }

      router.replace("/admin/negocios");
    } catch (error) {
      console.error("Error eliminando negocio:", error);
      setMensajeAccion("Ocurrió un error al eliminar el negocio.");
    } finally {
      setEliminandoNegocio(false);
    }
  }

  if (cargando) {
    return (
      <main style={pantallaCargaStyle}>
        <p>Cargando negocio...</p>
      </main>
    );
  }

  if (!autorizado) {
    return null;
  }

  if (error || !negocio) {
    return (
      <main style={mainStyle}>
        <div style={contenedorStyle}>
          <button
            type="button"
            onClick={() =>
              router.push("/admin/negocios")
            }
            style={volverStyle}
          >
            ← Volver a negocios
          </button>

          <div style={errorStyle}>
            {error || "No se pudo cargar el negocio."}
          </div>
        </div>
      </main>
    );
  }

  const publicado =
    Boolean(configuracion?.is_published);

  return (
    <main style={mainStyle}>
      <div style={contenedorStyle}>
        <header style={encabezadoStyle}>
          <div>
            <button
              type="button"
              onClick={() =>
                router.push("/admin/negocios")
              }
              style={volverStyle}
            >
              ← Volver a negocios
            </button>

            <p style={marcaStyle}>CitaTica Admin</p>

            <h1 style={tituloStyle}>
              {negocio.business_name}
            </h1>

            <p style={descripcionStyle}>
              Administración y resumen general del negocio.
            </p>
          </div>

          <div style={badgeStyle}>SUPERADMIN</div>
        </header>

        <section style={resumenGridStyle}>
          <Resumen titulo="Clientes" valor={String(resumen.clientes)} />
          <Resumen titulo="Servicios" valor={String(resumen.servicios)} />
          <Resumen titulo="Profesionales" valor={String(resumen.profesionales)} />
          <Resumen titulo="Citas" valor={String(resumen.citas)} />
          <Resumen titulo="Pagos" valor={String(resumen.pagos)} />
        </section>

        <div style={detalleGridStyle}>
          <section style={panelStyle}>
            <div style={panelTituloFilaStyle}>
              <div>
                <p style={etiquetaStyle}>INFORMACIÓN</p>
                <h2 style={subtituloStyle}>Datos del negocio</h2>
              </div>

              <span style={publicado ? publicadoStyle : ocultoStyle}>
                {publicado ? "Publicado" : "Oculto"}
              </span>
            </div>

            <Dato etiqueta="Nombre" valor={negocio.business_name} />
            <Dato etiqueta="Slug" valor={negocio.slug} />
            <Dato etiqueta="Página pública" valor={`/reservar/${negocio.slug}`} />
            <Dato etiqueta="Zona horaria" valor={negocio.timezone || "Sin definir"} />
            <Dato etiqueta="Creado" valor={formatearFecha(negocio.created_at)} />
          </section>

          <section style={panelStyle}>
            <p style={etiquetaStyle}>SUSCRIPCIÓN</p>
            <h2 style={subtituloStyle}>Plan actual</h2>

            <div style={planPrincipalStyle}>
              <span style={planTituloStyle}>
                {formatearTexto(
                  suscripcion?.plan_code || "SIN PLAN"
                )}
              </span>

              <span
                style={{
                  ...estadoBadgeStyle,
                  ...obtenerEstiloEstado(
                    suscripcion?.status ||
                      "SIN SUSCRIPCIÓN"
                  ),
                }}
              >
                {formatearTexto(
                  suscripcion?.status ||
                    "SIN SUSCRIPCIÓN"
                )}
              </span>
            </div>

            <Dato
              etiqueta="Ciclo de facturación"
              valor={
                suscripcion?.billing_cycle
                  ? formatearTexto(
                      suscripcion.billing_cycle
                    )
                  : "No aplica"
              }
            />

            <Dato
              etiqueta="Inicio de prueba"
              valor={formatearFecha(
                suscripcion?.trial_started_at
              )}
            />

            <Dato
              etiqueta="Fin de prueba"
              valor={formatearFecha(
                suscripcion?.trial_ends_at
              )}
            />

            <Dato
              etiqueta="Inicio de suscripción"
              valor={formatearFecha(
                suscripcion?.subscription_started_at
              )}
            />

            <Dato
              etiqueta="Fin de suscripción"
              valor={formatearFecha(
                suscripcion?.subscription_ends_at
              )}
            />
          </section>
        </div>

        <section style={panelStyle}>
          <p style={etiquetaStyle}>ADMINISTRACIÓN</p>
          <h2 style={subtituloStyle}>Acciones del negocio</h2>

          <div style={accionesGridStyle}>
            <div style={accionStyle}>
              <strong style={accionTituloStyle}>
                Publicación
              </strong>

              <span style={accionDescripcionStyle}>
                {publicado
                  ? "El negocio está visible públicamente."
                  : "El negocio no está publicado."}
              </span>

              <button
                type="button"
                onClick={cambiarPublicacion}
                disabled={guardandoPublicacion}
                style={{
                  ...botonAccionStyle,
                  ...(publicado
                    ? botonOcultarStyle
                    : botonPublicarStyle),
                  opacity: guardandoPublicacion
                    ? 0.65
                    : 1,
                }}
              >
                {guardandoPublicacion
                  ? "Guardando..."
                  : publicado
                    ? "Ocultar negocio"
                    : "Publicar negocio"}
              </button>
            </div>

            <div style={accionStyle}>
              <strong style={accionTituloStyle}>
                Suscripción
              </strong>

              <span style={accionDescripcionStyle}>
                Cambie manualmente el plan, estado y ciclo.
              </span>

              <label style={campoLabelStyle}>
                Plan
                <select
                  value={planSeleccionado}
                  onChange={(event) =>
                    setPlanSeleccionado(
                      event.target.value
                    )
                  }
                  style={selectStyle}
                >
                  <option value="FREE">Gratis</option>
                  <option value="EMPRENDE">Emprende</option>
                  <option value="NEGOCIO">Negocio</option>
                  <option value="PRO">Pro</option>
                </select>
              </label>

              <label style={campoLabelStyle}>
                Estado
                <select
                  value={estadoSeleccionado}
                  onChange={(event) =>
                    setEstadoSeleccionado(
                      event.target.value
                    )
                  }
                  style={selectStyle}
                >
                  <option value="TRIAL">Prueba</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </label>

              <label style={campoLabelStyle}>
                Ciclo
                <select
                  value={cicloSeleccionado}
                  onChange={(event) =>
                    setCicloSeleccionado(
                      event.target.value
                    )
                  }
                  style={selectStyle}
                >
                  <option value="MONTHLY">Mensual</option>
                  <option value="ANNUAL">Anual</option>
                </select>
              </label>

              <button
                type="button"
                onClick={guardarSuscripcion}
                disabled={guardandoSuscripcion}
                style={{
                  ...botonAccionStyle,
                  ...botonGuardarPlanStyle,
                  opacity: guardandoSuscripcion
                    ? 0.65
                    : 1,
                }}
              >
                {guardandoSuscripcion
                  ? "Guardando..."
                  : "Guardar suscripción"}
              </button>
            </div>

            <div style={accionStyle}>
              <strong style={accionTituloStyle}>
                Estado del negocio
              </strong>

              <span style={accionDescripcionStyle}>
                {suscripcion?.status === "SUSPENDED"
                  ? "El negocio está suspendido."
                  : "El negocio puede operar normalmente."}
              </span>

              <button
                type="button"
                onClick={cambiarEstadoNegocio}
                disabled={
                  cambiandoEstadoNegocio ||
                  !suscripcion
                }
                style={{
                  ...botonAccionStyle,
                  ...(suscripcion?.status === "SUSPENDED"
                    ? botonReactivarStyle
                    : botonSuspenderStyle),
                  opacity:
                    cambiandoEstadoNegocio || !suscripcion
                      ? 0.65
                      : 1,
                }}
              >
                {cambiandoEstadoNegocio
                  ? "Procesando..."
                  : suscripcion?.status === "SUSPENDED"
                    ? "Reactivar negocio"
                    : "Suspender negocio"}
              </button>

              {!suscripcion ? (
                <span style={ayudaStyle}>
                  Asigne primero una suscripción.
                </span>
              ) : null}
            </div>

            <div style={accionStyle}>
              <strong style={accionTituloStyle}>
                Pagos
              </strong>

              <span style={accionDescripcionStyle}>
                {resumen.pagos} registro
                {resumen.pagos === 1 ? "" : "s"} de pago
              </span>
            </div>
          </div>

          {mensajeAccion ? (
            <div style={mensajeStyle}>
              {mensajeAccion}
            </div>
          ) : null}
        </section>

        <section style={zonaPeligroStyle}>
          <p style={peligroEtiquetaStyle}>ZONA DE PELIGRO</p>

          <h2 style={peligroTituloStyle}>
            Eliminar negocio de prueba
          </h2>

          <p style={peligroTextoStyle}>
            Utilice esta opción únicamente para negocios de prueba. La
            eliminación es permanente. La cuenta del usuario no se elimina
            automáticamente.
          </p>

          {!previewEliminacion ? (
            <button
              type="button"
              onClick={prepararEliminacion}
              disabled={preparandoEliminacion}
              style={{
                ...prepararEliminarStyle,
                opacity: preparandoEliminacion ? 0.65 : 1,
              }}
            >
              {preparandoEliminacion
                ? "Revisando datos..."
                : "Preparar eliminación"}
            </button>
          ) : (
            <div style={confirmacionEliminarStyle}>
              <div style={conteosEliminarGridStyle}>
                <ConteoEliminar titulo="Miembros" valor={previewEliminacion.counts.miembros} />
                <ConteoEliminar titulo="Clientes" valor={previewEliminacion.counts.clientes} />
                <ConteoEliminar titulo="Servicios" valor={previewEliminacion.counts.servicios} />
                <ConteoEliminar titulo="Profesionales" valor={previewEliminacion.counts.profesionales} />
                <ConteoEliminar titulo="Citas" valor={previewEliminacion.counts.citas} />
                <ConteoEliminar titulo="Pagos" valor={previewEliminacion.counts.pagos} />
              </div>

              <p style={advertenciaEliminarStyle}>
                Para confirmar, escriba exactamente:
                <strong> {negocio.business_name}</strong>
              </p>

              <input
                type="text"
                value={confirmacionNombre}
                onChange={(event) =>
                  setConfirmacionNombre(event.target.value)
                }
                placeholder={negocio.business_name}
                style={confirmacionInputStyle}
              />

              <div style={botonesEliminarStyle}>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewEliminacion(null);
                    setConfirmacionNombre("");
                  }}
                  style={cancelarEliminarStyle}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={eliminarNegocio}
                  disabled={
                    eliminandoNegocio ||
                    confirmacionNombre !== negocio.business_name
                  }
                  style={{
                    ...eliminarDefinitivoStyle,
                    opacity:
                      eliminandoNegocio ||
                      confirmacionNombre !== negocio.business_name
                        ? 0.5
                        : 1,
                    cursor:
                      eliminandoNegocio ||
                      confirmacionNombre !== negocio.business_name
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {eliminandoNegocio
                    ? "Eliminando..."
                    : "Eliminar definitivamente"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Resumen({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div style={resumenStyle}>
      <span style={resumenTituloStyle}>{titulo}</span>
      <strong style={resumenValorStyle}>{valor}</strong>
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
    <div style={datoFilaStyle}>
      <span style={datoEtiquetaStyle}>{etiqueta}</span>
      <strong style={datoValorStyle}>{valor}</strong>
    </div>
  );
}

function ConteoEliminar({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div style={conteoEliminarStyle}>
      <span style={conteoEliminarTituloStyle}>{titulo}</span>
      <strong style={conteoEliminarValorStyle}>{valor}</strong>
    </div>
  );
}

function formatearTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) =>
      letra.toUpperCase()
    );
}

function formatearFecha(valor?: string | null) {
  if (!valor) return "No disponible";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "No disponible";
  }

  return fecha.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function obtenerEstiloEstado(
  estado: string
): React.CSSProperties {
  const valor = estado.toUpperCase();

  if (valor === "ACTIVE") {
    return {
      background: "#ecfdf3",
      color: "#067647",
    };
  }

  if (valor === "TRIAL") {
    return {
      background: "#eff8ff",
      color: "#175cd3",
    };
  }

  if (
    valor === "PAST_DUE" ||
    valor === "SUSPENDED"
  ) {
    return {
      background: "#fff6ed",
      color: "#c4320a",
    };
  }

  if (valor === "CANCELLED") {
    return {
      background: "#fef3f2",
      color: "#b42318",
    };
  }

  return {
    background: "#f2f4f7",
    color: "#344054",
  };
}

const pantallaCargaStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fb",
  color: "#667085",
  fontFamily: "Arial, sans-serif",
};

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "35px clamp(12px, 4vw, 20px) 70px",
  fontFamily: "Arial, sans-serif",
};

const contenedorStyle: React.CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto",
};

const encabezadoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "28px",
};

const volverStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  marginBottom: "18px",
  color: "#475467",
  cursor: "pointer",
  fontWeight: "600",
};

const marcaStyle: React.CSSProperties = {
  margin: 0,
  color: "#0066ff",
  fontWeight: "700",
  fontSize: "14px",
};

const tituloStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#101828",
  fontSize: "34px",
};

const descripcionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#667085",
  fontSize: "15px",
};

const badgeStyle: React.CSSProperties = {
  background: "#eef4ff",
  color: "#004eeb",
  border: "1px solid #c7d7fe",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "800",
};

const resumenGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: "14px",
  marginBottom: "24px",
};

const resumenStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "15px",
  padding: "20px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
};

const resumenTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "13px",
};

const resumenValorStyle: React.CSSProperties = {
  display: "block",
  marginTop: "8px",
  color: "#101828",
  fontSize: "28px",
};

const detalleGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 390px), 1fr))",
  gap: "18px",
  marginBottom: "24px",
};

const panelStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "clamp(18px, 4vw, 26px)",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  marginBottom: "24px",
  minWidth: 0,
};

const panelTituloFilaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  flexWrap: "wrap",
};

const etiquetaStyle: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#0066ff",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.8px",
};

const subtituloStyle: React.CSSProperties = {
  margin: "0 0 18px",
  color: "#101828",
  fontSize: "20px",
};

const publicadoStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#ecfdf3",
  color: "#067647",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: "700",
  fontSize: "11px",
};

const ocultoStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#f2f4f7",
  color: "#475467",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: "700",
  fontSize: "11px",
};

const datoFilaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  padding: "13px 0",
  borderBottom: "1px solid #eaecf0",
};

const datoEtiquetaStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "13px",
};

const datoValorStyle: React.CSSProperties = {
  color: "#101828",
  fontSize: "13px",
  textAlign: "right",
  overflowWrap: "anywhere",
};

const planPrincipalStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "10px",
  padding: "15px",
  background: "#f9fafb",
  borderRadius: "12px",
};

const planTituloStyle: React.CSSProperties = {
  color: "#101828",
  fontSize: "20px",
  fontWeight: "800",
};

const estadoBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
};

const accionesGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
  gap: "12px",
};

const accionStyle: React.CSSProperties = {
  border: "1px solid #eaecf0",
  borderRadius: "13px",
  padding: "16px",
  background: "#f9fafb",
};

const accionTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#101828",
  fontSize: "14px",
};

const accionDescripcionStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "12px",
  marginTop: "6px",
  lineHeight: 1.45,
};

const campoLabelStyle: React.CSSProperties = {
  display: "block",
  marginTop: "12px",
  color: "#475467",
  fontSize: "12px",
  fontWeight: "700",
};

const selectStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "6px",
  padding: "10px 11px",
  border: "1px solid #d0d5dd",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#101828",
  fontSize: "13px",
};

const botonAccionStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "14px",
  borderRadius: "9px",
  padding: "10px 12px",
  fontWeight: "700",
  cursor: "pointer",
};

const botonPublicarStyle: React.CSSProperties = {
  border: "1px solid #a6f4c5",
  background: "#ecfdf3",
  color: "#067647",
};

const botonOcultarStyle: React.CSSProperties = {
  border: "1px solid #fecdca",
  background: "#fef3f2",
  color: "#b42318",
};

const botonGuardarPlanStyle: React.CSSProperties = {
  border: "1px solid #c7d7fe",
  background: "#0066ff",
  color: "#ffffff",
};


const botonSuspenderStyle: React.CSSProperties = {
  border: "1px solid #fedf89",
  background: "#fffaeb",
  color: "#b54708",
};

const botonReactivarStyle: React.CSSProperties = {
  border: "1px solid #a6f4c5",
  background: "#ecfdf3",
  color: "#067647",
};

const ayudaStyle: React.CSSProperties = {
  display: "block",
  marginTop: "8px",
  color: "#98a2b3",
  fontSize: "11px",
};

const mensajeStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#eff8ff",
  color: "#175cd3",
  fontSize: "13px",
  fontWeight: "600",
};

const zonaPeligroStyle: React.CSSProperties = {
  background: "#fffafa",
  border: "1px solid #fecdca",
  borderRadius: "18px",
  padding: "clamp(18px, 4vw, 26px)",
  boxShadow: "0 6px 20px rgba(180,35,24,0.06)",
  marginBottom: "24px",
};

const peligroEtiquetaStyle: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#b42318",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.8px",
};

const peligroTituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#7a271a",
  fontSize: "20px",
};

const peligroTextoStyle: React.CSSProperties = {
  margin: "8px 0 18px",
  color: "#667085",
  fontSize: "13px",
  lineHeight: 1.6,
  maxWidth: "820px",
};

const prepararEliminarStyle: React.CSSProperties = {
  border: "1px solid #fecdca",
  background: "#ffffff",
  color: "#b42318",
  borderRadius: "9px",
  padding: "10px 14px",
  fontWeight: "700",
  cursor: "pointer",
};

const confirmacionEliminarStyle: React.CSSProperties = {
  marginTop: "10px",
  padding: "16px",
  borderRadius: "13px",
  background: "#ffffff",
  border: "1px solid #fecdca",
};

const conteosEliminarGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
  gap: "9px",
  marginBottom: "16px",
};

const conteoEliminarStyle: React.CSSProperties = {
  padding: "11px",
  background: "#f9fafb",
  borderRadius: "10px",
  border: "1px solid #eaecf0",
};

const conteoEliminarTituloStyle: React.CSSProperties = {
  display: "block",
  color: "#667085",
  fontSize: "11px",
};

const conteoEliminarValorStyle: React.CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#101828",
  fontSize: "20px",
};

const advertenciaEliminarStyle: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#7a271a",
  fontSize: "13px",
  lineHeight: 1.5,
};

const confirmacionInputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  padding: "10px 12px",
  border: "1px solid #fda29b",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#101828",
  fontSize: "13px",
};

const botonesEliminarStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "14px",
};

const cancelarEliminarStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  borderRadius: "9px",
  padding: "10px 14px",
  fontWeight: "700",
  cursor: "pointer",
};

const eliminarDefinitivoStyle: React.CSSProperties = {
  border: "1px solid #b42318",
  background: "#b42318",
  color: "#ffffff",
  borderRadius: "9px",
  padding: "10px 14px",
  fontWeight: "700",
};

const errorStyle: React.CSSProperties = {
  background: "#fef3f2",
  color: "#b42318",
  borderRadius: "12px",
  padding: "18px",
};
