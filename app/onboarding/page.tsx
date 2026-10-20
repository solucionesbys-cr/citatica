"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { createClient } from "@/utils/supabase/client";

type Categoria = {
  id: string;
  name: string;
  slug: string;
};

type Plan = {
  code: string;
  name: string;
  monthly_price: number;
  annual_price: number;
};

const CATEGORIAS_AUTORIZADAS_BNCR = [
  "Barbería",
  "Peluquería",
  "Uñas",
  "Pestañas",
  "Maquillaje",
  "Estética",
  "Spa",
  "Masajes",
  "Tatuajes",
  "Piercing",
  "Entrenamiento personal",
  "Bienestar",
  "Otro",
];

const ACTIVIDADES_NO_ACEPTABLES_BNCR = [
  "Fraudes",
  "Evasión fiscal",
  "Narcotráfico",
  "Arbitraje internacional de divisas",
  "Casas de apuesta por Internet (sportbooks, entre otros)",
  "Operación transaccional relacionada con ingreso o salida de fondos con origen en negocios asociados a Casas de Apuestas por Internet (sportbooks, entre otros)",
  "Extorsiones",
  "Secuestros",
  "Robos",
  "Remisión y pago de remesas familiares, efectuados por otros operadores.",
  "Negoción informal de divisas.",
  "Homicidios",
  "Prostitución en general y por cualquier medio.",
  "Actos terroristas, financiamiento al terrorismo",
  "Casas de cambio no reguladas",
  "Trata de personas",
  "Corporaciones financieras offshore o entidades financieras localizadas en paraísos fiscales.",
  "Tráfico ilegal de armas",
  "Piratería y contrabando",
  "Operación transaccional, administración o desarrollo de tecnologías relacionadas con criptomonedas o monedas virtuales que no permitan conocer al beneficiario de estas y la actividad económica o acto comercial que origina los fondos.",
  "Soborno, corrupción",
  "Lavado de dinero",
  "Delitos informáticos",
  "Negocios de luz roja (por ejemplo: salas de masaje con fines sexuales, night club, casas de citas, establecimientos afines) promoción y venta de pornografía",
  "Sujetos obligados por cualquiera de las Superintendencias que ofrecen sus cuentas y plataforma con el BNCR, a sus propios clientes para realizar transacciones diversas.",
  "Servicios postales o de entrega rápida para movilizar dinero en efectivo y/o Títulos valores",
];

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<PantallaCarga />}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createClient(), []);

  const codigoPlan = searchParams.get("plan") || "";
  const [billingCycle, setBillingCycle] = useState<
    "MONTHLY" | "ANNUAL"
  >(
    searchParams.get("billing") === "ANNUAL"
      ? "ANNUAL"
      : "MONTHLY"
  );

  const [categorias, setCategorias] = useState<Categoria[]>(
    []
  );

  const [plan, setPlan] = useState<Plan | null>(null);

  const [nombreNegocio, setNombreNegocio] =
    useState("");

  const [categoriaId, setCategoriaId] =
    useState("");

  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<
    "error" | "success" | ""
  >("");

  const [cargando, setCargando] = useState(false);
  const [cargandoPagina, setCargandoPagina] =
    useState(true);

  const [aceptaTerminos, setAceptaTerminos] =
    useState(false);

  const [otraActividad, setOtraActividad] =
    useState("");

  const [aceptaDeclaracionBncr, setAceptaDeclaracionBncr] =
    useState(false);

  const categoriaSeleccionada = useMemo(
    () =>
      categorias.find(
        (categoria) => categoria.id === categoriaId
      ) || null,
    [categorias, categoriaId]
  );

  const esCategoriaOtro =
    normalizarTexto(categoriaSeleccionada?.name || "") ===
    "otro";

  const cumplimientoBncrCompleto =
    !esCategoriaOtro ||
    (otraActividad.trim().length >= 5 &&
      aceptaDeclaracionBncr);

  useEffect(() => {
    async function cargarPagina() {
      setCargandoPagina(true);
      setMensaje("");
      setTipoMensaje("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const queryActual = searchParams.toString();
        const destino = queryActual
          ? `/onboarding?${queryActual}`
          : "/onboarding";

        router.push(
          `/login?next=${encodeURIComponent(destino)}`
        );
        return;
      }

      const { data: membresia } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membresia?.business_id) {
        router.push("/panel");
        return;
      }

      const {
        data: categoriasData,
        error: categoriasError,
      } = await supabase
        .from("business_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order");

      if (categoriasError) {
        setMensaje(
          "No se pudieron cargar las categorías."
        );
        setTipoMensaje("error");
        setCargandoPagina(false);
        return;
      }

      const ordenCategorias = new Map(
        CATEGORIAS_AUTORIZADAS_BNCR.map(
          (nombre, index) => [normalizarTexto(nombre), index]
        )
      );

      const categoriasPermitidas = (categoriasData || [])
        .filter((categoria) =>
          ordenCategorias.has(normalizarTexto(categoria.name))
        )
        .sort((a, b) => {
          const ordenA =
            ordenCategorias.get(normalizarTexto(a.name)) ?? 999;
          const ordenB =
            ordenCategorias.get(normalizarTexto(b.name)) ?? 999;

          return ordenA - ordenB;
        });

      setCategorias(categoriasPermitidas);

      if (codigoPlan) {
        const { data: planData, error: planError } =
          await supabase
            .from("plans")
            .select(
              "code, name, monthly_price, annual_price"
            )
            .eq("code", codigoPlan)
            .maybeSingle();

        if (!planError && planData) {
          setPlan(planData);
        }
      }

      setCargandoPagina(false);
    }

    cargarPagina();
  }, [codigoPlan, router, supabase]);

  function generarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function crearNegocio(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMensaje("");
    setTipoMensaje("");

    if (!codigoPlan) {
      setMensaje(
        "Primero debe seleccionar un plan."
      );
      setTipoMensaje("error");
      return;
    }

    if (!nombreNegocio.trim()) {
      setMensaje(
        "Ingrese el nombre del negocio."
      );
      setTipoMensaje("error");
      return;
    }

    if (!categoriaId) {
      setMensaje("Seleccione una categoría.");
      setTipoMensaje("error");
      return;
    }

    if (esCategoriaOtro && otraActividad.trim().length < 5) {
      setMensaje(
        "Describa claramente la actividad económica de su negocio para utilizar la categoría Otro."
      );
      setTipoMensaje("error");
      return;
    }

    if (esCategoriaOtro && !aceptaDeclaracionBncr) {
      setMensaje(
        "Debe confirmar que la actividad económica no corresponde a ninguna actividad no aceptable por el BNCR."
      );
      setTipoMensaje("error");
      return;
    }

    if (!aceptaTerminos) {
      setMensaje(
        "Debe leer y aceptar los Términos y Condiciones para continuar."
      );
      setTipoMensaje("error");
      return;
    }

    setCargando(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMensaje(
        "No se pudo identificar al usuario."
      );
      setTipoMensaje("error");
      setCargando(false);
      return;
    }

    const { data: membresiaExistente } =
      await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (membresiaExistente?.business_id) {
      router.push("/panel");
      return;
    }

    const slugBase = generarSlug(
      nombreNegocio.trim()
    );

    const slug = `${slugBase}-${user.id.slice(
      0,
      6
    )}`;

    const { error } = await supabase.rpc(
      "create_business_with_defaults",
      {
        p_business_name: nombreNegocio.trim(),
        p_slug: slug,
        p_category_id: categoriaId,
        p_phone: telefono.trim() || null,
        p_whatsapp: whatsapp.trim() || null,
      }
    );

    if (error) {
      setMensaje(
        "Error al crear el negocio: " +
          error.message
      );
      setTipoMensaje("error");
      setCargando(false);
      return;
    }

    const { data: membresiaCreada, error: membresiaError } =
      await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (membresiaError || !membresiaCreada?.business_id) {
      setMensaje(
        "El negocio se creó, pero no pudimos identificarlo para continuar."
      );
      setTipoMensaje("error");
      setCargando(false);
      return;
    }

    const businessId = membresiaCreada.business_id;

    if (esCategoriaOtro) {
      const { error: declaracionError } = await supabase
        .from("businesses")
        .update({
          other_business_activity: otraActividad.trim(),
          bncr_activity_declaration: true,
          bncr_activity_declaration_at:
            new Date().toISOString(),
        })
        .eq("id", businessId)
        .eq("owner_user_id", user.id);

      if (declaracionError) {
        setMensaje(
          "El negocio se creó, pero no pudimos guardar la declaración requerida para la categoría Otro. No continúe al pago y contacte soporte."
        );
        setTipoMensaje("error");
        setCargando(false);
        return;
      }
    }

    window.localStorage.setItem(
      "citatica:selected-plan",
      codigoPlan
    );

    window.localStorage.setItem(
      "citatica:billing-cycle",
      billingCycle
    );

    const requierePago =
      codigoPlan === "NEGOCIO" || codigoPlan === "PRO";

    if (!requierePago) {
      setMensaje(
        codigoPlan === "EMPRENDE"
          ? "¡Negocio creado! Tu prueba de 15 días ya está lista."
          : "¡Negocio creado correctamente!"
      );
      setTipoMensaje("success");
      setCargando(false);

      setTimeout(() => {
        router.push("/panel");
      }, 700);

      return;
    }

    setMensaje(
      "Negocio creado. Preparando el pago seguro con GreenPay..."
    );
    setTipoMensaje("success");

    const respuestaPago = await fetch(
      "/api/greenpay/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          planCode: codigoPlan,
          billingCycle,
          customer: {
            name:
              user.user_metadata?.full_name ||
              user.email ||
              "Cliente CitaTica",
            email: user.email || undefined,
          },
        }),
      }
    );

    const pago = await respuestaPago.json();

    if (!respuestaPago.ok || !pago?.session) {
      setMensaje(
        pago?.error ||
          "El negocio se creó, pero no pudimos iniciar el pago. Puedes intentarlo nuevamente desde tu panel."
      );
      setTipoMensaje("error");
      setCargando(false);
      return;
    }

    const checkoutUrl =
      `https://checkoutform.greenpaysbx.me/v2/${pago.session}`;

    window.location.href = checkoutUrl;
  }

  if (cargandoPagina) {
    return <PantallaCarga />;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)",
        padding: "30px 20px 70px",
        fontFamily:
          "var(--font-geist-sans), Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <Link href="/">
            <Image
              src="/brand/citatica-logo.png"
              alt="CitaTica"
              width={210}
              height={70}
              priority
              style={{
                width: "180px",
                height: "auto",
              }}
            />
          </Link>
        </div>

        {plan ? (
          <div
            style={{
              marginBottom: "18px",
              padding: "16px 20px",
              borderRadius: "16px",
              background: "#EEF7FF",
              border: "1px solid #D7E9FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#0066FF",
                  marginBottom: "4px",
                }}
              >
                PLAN SELECCIONADO
              </div>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#042A6B",
                }}
              >
                {plan.name}
              </strong>

              <span
                style={{
                  marginLeft: "10px",
                  color: "#667085",
                }}
              >
                ₡
                {Number(
                  billingCycle === "ANNUAL"
                    ? plan.annual_price
                    : plan.monthly_price
                ).toLocaleString("es-CR")}
                {billingCycle === "ANNUAL"
                  ? "/año"
                  : "/mes"}
              </span>

              {(codigoPlan === "NEGOCIO" ||
                codigoPlan === "PRO") ? (
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setBillingCycle("MONTHLY")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border:
                        billingCycle === "MONTHLY"
                          ? "2px solid #0066FF"
                          : "1px solid #D0D5DD",
                      background:
                        billingCycle === "MONTHLY"
                          ? "#EEF5FF"
                          : "#FFFFFF",
                      color: "#042A6B",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Mensual · ₡
                    {Number(plan.monthly_price).toLocaleString(
                      "es-CR"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingCycle("ANNUAL")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border:
                        billingCycle === "ANNUAL"
                          ? "2px solid #0066FF"
                          : "1px solid #D0D5DD",
                      background:
                        billingCycle === "ANNUAL"
                          ? "#EEF5FF"
                          : "#FFFFFF",
                      color: "#042A6B",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Anual · ₡
                    {Number(plan.annual_price).toLocaleString(
                      "es-CR"
                    )}
                  </button>
                </div>
              ) : null}
            </div>

            <Link
              href="/planes"
              style={{
                color: "#0066FF",
                fontWeight: "700",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Cambiar plan
            </Link>
          </div>
        ) : (
          <div
            style={{
              marginBottom: "18px",
              padding: "16px 20px",
              borderRadius: "16px",
              background: "#FFF8E8",
              border: "1px solid #F5D785",
              color: "#7A5700",
            }}
          >
            No se encontró un plan seleccionado.{" "}
            <Link
              href="/planes"
              style={{
                fontWeight: "800",
                color: "#0066FF",
              }}
            >
              Elegir un plan
            </Link>
          </div>
        )}

        <div
          style={{
            background: "#FFFFFF",
            padding: "clamp(24px, 5vw, 42px)",
            borderRadius: "24px",
            border: "1px solid #D7E9FF",
            boxShadow:
              "0 18px 50px rgba(4,42,107,0.08)",
          }}
        >
          <div
            style={{
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                color: "#0066FF",
                fontSize: "13px",
                fontWeight: "800",
                letterSpacing: "1px",
                marginBottom: "8px",
              }}
            >
              ÚLTIMO PASO
            </div>

            <h1
              style={{
                fontSize: "36px",
                lineHeight: "1.1",
                color: "#042A6B",
                margin: "0 0 12px",
              }}
            >
              Configura tu negocio
            </h1>

            <p
              style={{
                color: "#667085",
                fontSize: "16px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              Esta información se utilizará para
              crear tu espacio y tu página de
              reservas en CitaTica.
            </p>
          </div>

          <form onSubmit={crearNegocio}>
            <label style={labelStyle}>
              Nombre del negocio
            </label>

            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) =>
                setNombreNegocio(e.target.value)
              }
              placeholder="Ej. Barbería Central"
              required
              style={inputStyle}
            />

            <label style={labelStyle}>
              Tipo de negocio
            </label>

            <select
              value={categoriaId}
              onChange={(e) => {
                const nuevoId = e.target.value;
                setCategoriaId(nuevoId);

                const nuevaCategoria = categorias.find(
                  (categoria) => categoria.id === nuevoId
                );

                if (
                  normalizarTexto(nuevaCategoria?.name || "") !==
                  "otro"
                ) {
                  setOtraActividad("");
                  setAceptaDeclaracionBncr(false);
                }
              }}
              required
              style={inputStyle}
            >
              <option value="">
                Selecciona una categoría
              </option>

              {categorias.map((categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.name}
                </option>
              ))}
            </select>

            {esCategoriaOtro && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "18px",
                  border: "1px solid #F5D785",
                  borderRadius: "14px",
                  background: "#FFFBEB",
                }}
              >
                <div
                  style={{
                    color: "#7A5700",
                    fontWeight: "800",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                >
                  Categoría “Otro”
                </div>

                <p
                  style={{
                    margin: "0 0 16px",
                    color: "#7A5700",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}
                >
                  Esta categoría únicamente puede utilizarse para
                  actividades permitidas por el Banco Nacional de
                  Costa Rica. Describa claramente la actividad
                  económica que realiza su negocio.
                </p>

                <label
                  style={{
                    ...labelStyle,
                    marginTop: 0,
                    color: "#5F4500",
                  }}
                >
                  Describa su actividad económica
                </label>

                <textarea
                  value={otraActividad}
                  onChange={(e) =>
                    setOtraActividad(e.target.value)
                  }
                  placeholder="Ej. reparación de electrodomésticos, fotografía, clases particulares..."
                  required
                  minLength={5}
                  maxLength={300}
                  disabled={cargando}
                  style={textareaStyle}
                />

                <div
                  style={{
                    marginTop: "8px",
                    textAlign: "right",
                    color: "#8A6D1D",
                    fontSize: "12px",
                  }}
                >
                  {otraActividad.length}/300
                </div>

                <details
                  style={{
                    marginTop: "16px",
                    borderTop: "1px solid #F5D785",
                    paddingTop: "14px",
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      color: "#7A5700",
                      fontWeight: "800",
                      fontSize: "14px",
                    }}
                  >
                    Ver actividades económicas no aceptables por el
                    BNCR
                  </summary>

                  <ul
                    style={{
                      margin: "14px 0 0",
                      paddingLeft: "22px",
                      color: "#694F00",
                      fontSize: "13px",
                      lineHeight: "1.6",
                    }}
                  >
                    {ACTIVIDADES_NO_ACEPTABLES_BNCR.map(
                      (actividad) => (
                        <li
                          key={actividad}
                          style={{ marginBottom: "7px" }}
                        >
                          {actividad}
                        </li>
                      )
                    )}
                  </ul>
                </details>

                <label
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    cursor: "pointer",
                    marginTop: "18px",
                    paddingTop: "16px",
                    borderTop: "1px solid #F5D785",
                    color: "#5F4500",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    fontWeight: "600",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={aceptaDeclaracionBncr}
                    onChange={(e) =>
                      setAceptaDeclaracionBncr(
                        e.target.checked
                      )
                    }
                    disabled={cargando}
                    style={{
                      marginTop: "3px",
                      width: "18px",
                      height: "18px",
                      flexShrink: 0,
                    }}
                  />

                  <span>
                    Declaro que la actividad económica de mi negocio
                    no corresponde a ninguna de las actividades no
                    aceptables indicadas por el Banco Nacional de
                    Costa Rica y que la información suministrada es
                    verdadera.
                  </span>
                </label>
              </div>
            )}

            <label style={labelStyle}>
              Teléfono
            </label>

            <input
              type="tel"
              value={telefono}
              onChange={(e) =>
                setTelefono(e.target.value)
              }
              placeholder="Ej. 8813-2725"
              style={inputStyle}
            />

            <label style={labelStyle}>
              WhatsApp
            </label>

            <input
              type="tel"
              value={whatsapp}
              onChange={(e) =>
                setWhatsapp(e.target.value)
              }
              placeholder="Ej. 8813-2725"
              style={inputStyle}
            />

            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                border: "1px solid #D7E9FF",
                borderRadius: "12px",
                background: "#F8FBFF",
              }}
            >
              <label
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  cursor: "pointer",
                  color: "#475467",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) =>
                    setAceptaTerminos(e.target.checked)
                  }
                  disabled={cargando}
                  style={{
                    marginTop: "4px",
                    width: "18px",
                    height: "18px",
                    flexShrink: 0,
                  }}
                />

                <span>
                  He leído y acepto los{" "}
                  <Link
                    href="/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0066FF",
                      fontWeight: "800",
                    }}
                  >
                    Términos y Condiciones
                  </Link>{" "}
                  vigentes de CitaTica.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={
                cargando ||
                !codigoPlan ||
                !aceptaTerminos ||
                !cumplimientoBncrCompleto
              }
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "18px",
                border: "none",
                borderRadius: "12px",
                background:
                  cargando ||
                  !codigoPlan ||
                  !aceptaTerminos ||
                  !cumplimientoBncrCompleto
                    ? "#98A2B3"
                    : "#0066FF",
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: "800",
                cursor:
                  cargando ||
                  !codigoPlan ||
                  !aceptaTerminos ||
                  !cumplimientoBncrCompleto
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {cargando
                ? codigoPlan === "NEGOCIO" ||
                  codigoPlan === "PRO"
                  ? "Preparando pago..."
                  : "Creando tu negocio..."
                : codigoPlan === "NEGOCIO" ||
                  codigoPlan === "PRO"
                ? "Crear mi negocio y continuar al pago"
                : "Crear mi negocio"}
            </button>
          </form>

          {mensaje && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                borderRadius: "12px",
                lineHeight: "1.5",
                background:
                  tipoMensaje === "success"
                    ? "#ECFDF3"
                    : "#FFF1F0",
                color:
                  tipoMensaje === "success"
                    ? "#067647"
                    : "#B42318",
                border:
                  tipoMensaje === "success"
                    ? "1px solid #ABEFC6"
                    : "1px solid #FECDCA",
              }}
            >
              {mensaje}
            </div>
          )}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
          }}
        >
          <Link
            href="/planes"
            style={{
              color: "#667085",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Volver a los planes
          </Link>
        </div>
      </div>
    </main>
  );
}

function PantallaCarga() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F6F9FF",
        fontFamily:
          "var(--font-geist-sans), Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Image
          src="/brand/citatica-icon.png"
          alt="CitaTica"
          width={70}
          height={70}
        />

        <p
          style={{
            color: "#667085",
            marginTop: "18px",
          }}
        >
          Preparando tu espacio...
        </p>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  marginTop: "20px",
  fontWeight: "700",
  color: "#344054",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "110px",
  boxSizing: "border-box",
  padding: "14px 15px",
  border: "1px solid #D0D5DD",
  borderRadius: "11px",
  fontSize: "15px",
  lineHeight: "1.5",
  background: "#FFFFFF",
  color: "#101828",
  outline: "none",
  resize: "vertical",
  fontFamily: "inherit",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 15px",
  border: "1px solid #D0D5DD",
  borderRadius: "11px",
  fontSize: "15px",
  background: "#FFFFFF",
  color: "#101828",
  outline: "none",
};