"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// Publicidad preparada para futuro. Mantener en false hasta tener un anunciante activo.
const MOSTRAR_ESPACIOS_PUBLICITARIOS = false;

type NegocioPublicado = {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  logo_url: string | null;
  cover_url: string | null;
  booking_enabled: boolean;
};

function ubicacionNegocio(negocio: NegocioPublicado) {
  const partes = [negocio.district, negocio.canton, negocio.province].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : "Costa Rica";
}

const features = [
  {
    icon: "📅",
    title: "Agenda inteligente",
    text: "Administre citas, horarios, bloqueos y disponibilidad desde un solo lugar.",
  },
  {
    icon: "👥",
    title: "Clientes",
    text: "Mantenga la información de sus clientes organizada y disponible cuando la necesite.",
  },
  {
    icon: "🔔",
    title: "Recordatorios",
    text: "Reduzca ausencias con confirmaciones y recordatorios automáticos por WhatsApp.",
  },
  {
    icon: "✂️",
    title: "Servicios",
    text: "Configure precios, duración, fotos y los profesionales que realizan cada servicio.",
  },
  {
    icon: "👤",
    title: "Equipo",
    text: "Asigne servicios y horarios a cada profesional y controle su disponibilidad.",
  },
  {
    icon: "📊",
    title: "Control del negocio",
    text: "Consulte citas próximas, clientes y actividad desde un panel simple y claro.",
  },
];

const businessTypes = [
  {
    title: "Barberías",
    slug: "barberias",
    text: "Cortes, barba y servicios especializados.",
    image:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Salones de belleza",
    slug: "salones-de-belleza",
    text: "Cabello, color, tratamientos y estilismo.",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Uñas y estética",
    slug: "unas-y-estetica",
    text: "Manicure, pedicure y servicios de belleza.",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Tatuajes y piercing",
    slug: "tatuajes-y-piercing",
    text: "Sesiones, consultas y reservas por profesional.",
    image:
      "https://images.unsplash.com/photo-1732440290046-cc29dfe9f6c2?auto=format&fit=crop&w=1200&q=85",
  },
];

const steps = [
  {
    number: "01",
    title: "Configure su negocio",
    text: "Agregue su logo, portada, servicios, precios, equipo y horarios.",
  },
  {
    number: "02",
    title: "Comparta su enlace",
    text: "Cada negocio obtiene su propia página pública para recibir reservas.",
  },
  {
    number: "03",
    title: "Reciba citas",
    text: "Sus clientes eligen servicio, profesional, fecha y hora desde cualquier dispositivo.",
  },
];

export default function Home() {
  const [negociosPublicados, setNegociosPublicados] = useState<NegocioPublicado[]>([]);
  const [cargandoNegocios, setCargandoNegocios] = useState(true);
  const [errorNegocios, setErrorNegocios] = useState("");
  const [indiceCarrusel, setIndiceCarrusel] = useState(0);
  const [pausarCarrusel, setPausarCarrusel] = useState(false);

  useEffect(() => {
    cargarNegociosPublicados();
  }, []);

  useEffect(() => {
    if (negociosPublicados.length <= 5 || pausarCarrusel) return;

    const timer = window.setInterval(() => {
      setIndiceCarrusel((actual) =>
        negociosPublicados.length > 0
          ? (actual + 1) % negociosPublicados.length
          : 0
      );
    }, 4500);

    return () => window.clearInterval(timer);
  }, [negociosPublicados.length, pausarCarrusel]);

  async function cargarNegociosPublicados() {
    setCargandoNegocios(true);
    setErrorNegocios("");

    try {
      const { data: publicaciones, error: publicacionesError } = await supabase
        .from("business_settings")
        .select("business_id, booking_enabled")
        .eq("is_published", true);

      if (publicacionesError) throw publicacionesError;

      const publicados = new Map<string, boolean>();
      for (const item of publicaciones || []) {
        publicados.set(item.business_id, Boolean(item.booking_enabled));
      }

      const businessIds = Array.from(publicados.keys());

      if (businessIds.length === 0) {
        setNegociosPublicados([]);
        return;
      }

      const { data: negociosData, error: negociosError } = await supabase
        .from("businesses")
        .select(`
          id,
          business_name,
          slug,
          description,
          province,
          canton,
          district,
          logo_url,
          cover_url
        `)
        .in("id", businessIds)
        .order("business_name", { ascending: true });

      if (negociosError) throw negociosError;

      const lista: NegocioPublicado[] = (negociosData || []).map((negocio) => ({
        ...negocio,
        booking_enabled: publicados.get(negocio.id) ?? false,
      }));

      setNegociosPublicados(lista);
    } catch (error) {
      console.error("Error cargando negocios publicados:", error);
      setErrorNegocios("No fue posible cargar los negocios publicados en este momento.");
    } finally {
      setCargandoNegocios(false);
    }
  }

  const cantidadCarrusel = Math.min(5, negociosPublicados.length);
  const negociosCarrusel = Array.from({ length: cantidadCarrusel }, (_, offset) =>
    negociosPublicados.length > 0
      ? negociosPublicados[(indiceCarrusel + offset) % negociosPublicados.length]
      : null
  ).filter(Boolean) as NegocioPublicado[];

  const claseAnchoTarjeta =
    negociosPublicados.length >= 5
      ? "xl:w-[18.5%]"
      : negociosPublicados.length === 4
      ? "xl:w-[23.5%]"
      : negociosPublicados.length === 3
      ? "xl:w-[31.5%]"
      : negociosPublicados.length === 2
      ? "xl:w-[48.5%]"
      : "xl:w-full";

  function avanzarCarrusel() {
    if (negociosPublicados.length <= 5) return;
    setIndiceCarrusel((actual) => (actual + 1) % negociosPublicados.length);
  }

  function retrocederCarrusel() {
    if (negociosPublicados.length <= 5) return;
    setIndiceCarrusel((actual) =>
      (actual - 1 + negociosPublicados.length) % negociosPublicados.length
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F9FF] text-[#042A6B]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/citatica-logo.png"
              alt="CitaTica"
              width={220}
              height={70}
              priority
              className="h-auto w-[170px] md:w-[195px]"
            />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#funciones" className="transition hover:text-slate-950">
              Funciones
            </a>
            <a href="#como-funciona" className="transition hover:text-slate-950">
              Cómo funciona
            </a>
            <a href="#negocios-publicados" className="transition hover:text-slate-950">
              Explorar negocios
            </a>
            <a href="#publicar" className="transition hover:text-slate-950">
              Para emprendedores
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/planes"
              className="rounded-xl bg-[#042A6B] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#07377f]"
            >
              Crear mi negocio
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(18,168,224,0.12),_transparent_34%),radial-gradient(circle_at_85%_20%,_rgba(16,24,40,0.07),_transparent_26%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D7E9FF] bg-[#EEF7FF] px-4 py-2 text-sm font-bold text-[#042A6B]">
              <span className="h-2 w-2 rounded-full bg-[#0066FF]" />
              Hecho para negocios de Costa Rica
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.04] tracking-[-0.04em] text-[#042A6B] md:text-6xl lg:text-7xl">
              Tus citas. Tu negocio.
              <span className="block text-[#0066FF]">Todo en un solo lugar.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              CitaTica ayuda a barberías, salones, uñas, tatuajes y otros negocios a recibir reservas las 24 horas, organizar su agenda y atender mejor a sus clientes.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/planes"
                className="inline-flex items-center justify-center rounded-2xl bg-[#042A6B] px-6 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[#07377f]"
              >
                Crear mi página
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
              <span>✓ Reservas online</span>
              <span>✓ Página personalizada</span>
              <span>✓ Recordatorios</span>
              <span>✓ Agenda y equipo</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-[#22C1F6]/30 blur-3xl" />
            <div className="absolute -right-10 bottom-10 h-36 w-36 rounded-full bg-[#3EE6A4]/25 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/15">
              <img
                src="https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1400&q=85"
                alt="Profesional atendiendo a un cliente"
                className="h-[520px] w-full rounded-[25px] object-cover"
              />

              <div className="absolute bottom-7 left-7 right-7 rounded-3xl border border-white/60 bg-white/95 p-5 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0066FF]">
                      Nueva reserva
                    </p>
                    <h3 className="mt-1 text-lg font-black">Corte de cabello</h3>
                    <p className="mt-1 text-sm text-slate-500">Hoy · 2:15 p. m. · Bryan</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9FFF6] text-xl">
                    ✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="funciones" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0066FF]">Todo en un solo lugar</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Menos tiempo organizando. Más tiempo atendiendo.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Las herramientas esenciales para administrar citas sin complicaciones.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-xl font-black">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="negocios-publicados" className="scroll-mt-24 bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0066FF]">Negocios en CitaTica</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Descubra negocios y reserve directamente.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Aquí aparecen los negocios que han sido publicados en CitaTica y están disponibles para sus clientes.
              </p>
            </div>
            <a
              href="#negocios"
              className="inline-flex w-fit items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#042A6B] transition hover:bg-slate-50"
            >
              Explorar por categoría
            </a>
          </div>

          {cargandoNegocios ? (
            <div className="mt-10 flex gap-5 overflow-hidden">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-[390px] w-[85%] shrink-0 animate-pulse rounded-3xl bg-slate-100 sm:w-[48%] lg:w-[31.5%] xl:w-[18.5%]"
                />
              ))}
            </div>
          ) : errorNegocios ? (
            <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
              {errorNegocios}
            </div>
          ) : negociosPublicados.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-slate-200 bg-[#F6F9FF] p-8 text-center">
              <h3 className="text-xl font-black">Próximamente más negocios</h3>
              <p className="mt-2 text-slate-600">Los negocios publicados aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <div
              className="mt-12"
              onMouseEnter={() => setPausarCarrusel(true)}
              onMouseLeave={() => setPausarCarrusel(false)}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-500">
                  {negociosPublicados.length > 5
                    ? `Mostrando 5 de ${negociosPublicados.length} negocios`
                    : `${negociosPublicados.length} negocio${negociosPublicados.length === 1 ? "" : "s"} publicado${negociosPublicados.length === 1 ? "" : "s"}`}
                </p>

                {negociosPublicados.length > 5 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={retrocederCarrusel}
                      aria-label="Ver negocios anteriores"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-[#042A6B] shadow-sm transition hover:bg-slate-50"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={avanzarCarrusel}
                      aria-label="Ver más negocios"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-[#042A6B] shadow-sm transition hover:bg-slate-50"
                    >
                      →
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden">
                <div className="flex gap-5">
                  {negociosCarrusel.map((negocio) => (
                    <Link
                      key={negocio.id}
                      href={`/reservar/${negocio.slug}`}
                      className={`group flex w-[85%] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl sm:w-[48%] lg:w-[31.5%] ${claseAnchoTarjeta}`}
                    >
                      <div
                        className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#DDEEFF] to-[#F6F9FF]"
                        style={{ height: "220px" }}
                      >
                        {negocio.cover_url || negocio.logo_url ? (
                          <img
                            src={negocio.cover_url || negocio.logo_url || ""}
                            alt={negocio.business_name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#EEF7FF] to-white px-6 text-center">
                            <Image
                              src="/brand/citatica-logo.png"
                              alt="CitaTica"
                              width={170}
                              height={56}
                              className="h-auto w-[140px] opacity-70"
                            />
                            <span className="text-sm font-bold text-slate-400">
                              {negocio.business_name}
                            </span>
                          </div>
                        )}

                        {negocio.cover_url && negocio.logo_url ? (
                          <div className="absolute bottom-4 left-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
                            <img
                              src={negocio.logo_url}
                              alt={`Logo de ${negocio.business_name}`}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-lg font-black leading-6 text-[#042A6B]">
                              {negocio.business_name}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                              {ubicacionNegocio(negocio)}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            negocio.booking_enabled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {negocio.booking_enabled ? "Reservas activas" : "Ver negocio"}
                          </span>
                        </div>

                        <p className="mt-4 line-clamp-2 min-h-[44px] text-sm leading-5 text-slate-600">
                          {negocio.description || "Conozca sus servicios, profesionales y disponibilidad en CitaTica."}
                        </p>

                        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                          <span className="text-sm font-black text-[#0066FF]">Ver y reservar</span>
                          <span className="text-xl text-[#0066FF] transition group-hover:translate-x-1">→</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {negociosPublicados.length > 5 ? (
                <div className="mt-5 flex justify-center gap-1.5">
                  {negociosPublicados.map((negocio, index) => (
                    <button
                      key={negocio.id}
                      type="button"
                      onClick={() => setIndiceCarrusel(index)}
                      aria-label={`Ir al negocio ${index + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        index === indiceCarrusel
                          ? "w-6 bg-[#0066FF]"
                          : "w-2 bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <AdSlot slot="home-negocios-banner" />
        </div>
      </section>

      <section id="negocios" className="scroll-mt-24 bg-[#042A6B] py-20 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#22C1F6]">Para muchos tipos de negocio</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Una plataforma que se adapta a tu forma de trabajar.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Cada negocio puede mostrar su propia marca, servicios, equipo, precios y disponibilidad.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {businessTypes.map((item) => (
              <Link
                key={item.title}
                href={`/negocios/${item.slug}`}
                className="group overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/10"
                aria-label={`Ver negocios de ${item.title}`}
              >
                <div className="overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-black">{item.title}</h3>
                    <span className="text-xl text-[#22C1F6] transition group-hover:translate-x-1">→</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                  <p className="mt-4 text-sm font-bold text-[#22C1F6]">Ver emprendedores</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-24 bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0066FF]">Así funciona</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Empiece en tres pasos.</h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="relative rounded-3xl border border-slate-200 bg-[#f8fafc] p-8">
                <span className="text-5xl font-black text-sky-100">{step.number}</span>
                <h3 className="mt-4 text-2xl font-black">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="grid overflow-hidden rounded-[36px] bg-gradient-to-br from-[#EEF7FF] via-white to-[#F6F9FF] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-14">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0066FF]">Tu marca, tu página</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Una página de reservas que también representa tu negocio.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Personalice logo, portada, colores, servicios y profesionales. Comparta su enlace y permita que sus clientes reserven desde el teléfono.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold text-slate-700">
              {['Logo', 'Portada', 'Colores', 'Servicios', 'Equipo'].map((item) => (
                <span key={item} className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden bg-[#eef2f7] p-6 md:p-10">
            <div className="mx-auto max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
              <div className="h-32 bg-[url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=85')] bg-cover bg-center" />
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-black text-white">B</div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Reservas en CitaTica</p>
                    <h3 className="text-2xl font-black">Barbería Central</h3>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-[#B9D8FF] bg-[#EEF7FF] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black">Corte clásico</h4>
                      <p className="mt-1 text-sm text-slate-500">30 min · ₡5.000</p>
                    </div>
                    <div className="h-5 w-5 rounded-full border-[5px] border-[#0066FF] bg-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="publicar" className="scroll-mt-24 border-y border-slate-200 bg-white py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0066FF]">Para emprendedores</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-[#042A6B] md:text-5xl">
              Publique su negocio y empiece a recibir reservas.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Cree su perfil, agregue servicios, profesionales y horarios. Cuando esté listo, comparta su enlace y permita que nuevos clientes también lo encuentren por categoría en CitaTica.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/planes"
                className="inline-flex items-center justify-center rounded-2xl bg-[#0066FF] px-6 py-4 font-black text-white shadow-lg shadow-[#0066FF]/20 transition hover:-translate-y-0.5 hover:bg-[#0058dc]"
              >
                Publicar mi negocio
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Ya tengo una cuenta
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["01", "Cree su perfil", "Nombre, categoría, logo y datos del negocio."],
              ["02", "Agregue sus servicios", "Precios, duración y profesionales disponibles."],
              ["03", "Defina sus horarios", "Días de atención, disponibilidad y bloqueos."],
              ["04", "Publique y comparta", "Enlace propio, WhatsApp y presencia por categoría."],
            ].map(([numero, titulo, texto]) => (
              <div key={numero} className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6">
                <span className="text-sm font-black text-[#0066FF]">{numero}</span>
                <h3 className="mt-3 text-xl font-black text-[#042A6B]">{titulo}</h3>
                <p className="mt-2 leading-7 text-slate-600">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-5 text-center lg:px-8">
          <div className="rounded-[36px] bg-[#042A6B] px-7 py-14 text-white md:px-14 md:py-16">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#22C1F6]">CitaTica</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
              Empiece a recibir reservas online para su negocio.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Cree su página, configure su agenda y comparta su enlace con sus clientes.
            </p>
            <div className="mt-8">
              <Link
                href="/planes"
                className="inline-flex rounded-2xl bg-[#0066FF] px-7 py-4 font-black text-white shadow-lg shadow-[#0066FF]/20 transition hover:-translate-y-0.5 hover:bg-[#0058dc]"
              >
                Crear mi negocio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
        <AdSlot slot="home-footer-banner" compact />
      </div>

      <footer className="border-t border-slate-200 bg-[#031f50] text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Image
                src="/brand/citatica-logo.png"
                alt="CitaTica"
                width={190}
                height={60}
                className="h-auto w-[155px] brightness-0 invert"
              />
              <p className="mt-5 max-w-xs text-sm leading-6 text-slate-300">
                Tus citas, tu negocio, en un solo lugar. Reservas fáciles para negocios y clientes de Costa Rica.
              </p>
            </div>

            <div>
              <h3 className="font-black">Explorar</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/negocios/barberias" className="hover:text-white">Barberías</Link>
                <Link href="/negocios/salones-de-belleza" className="hover:text-white">Salones de belleza</Link>
                <Link href="/negocios/unas-y-estetica" className="hover:text-white">Uñas y estética</Link>
                <Link href="/negocios/tatuajes-y-piercing" className="hover:text-white">Tatuajes y piercing</Link>
              </div>
            </div>

            <div>
              <h3 className="font-black">Para negocios</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/planes" className="hover:text-white">Publicar mi negocio</Link>
                <a href="#como-funciona" className="hover:text-white">Cómo funciona</a>
                <Link href="/planes" className="hover:text-white">Planes</Link>
                <Link href="/login" className="hover:text-white">Iniciar sesión</Link>
              </div>
            </div>

            <div>
              <h3 className="font-black">Legal y ayuda</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
                <Link href="/terminos" className="hover:text-white">Términos y condiciones</Link>
                <Link href="/privacidad" className="hover:text-white">Política de privacidad</Link>
                <Link href="/cookies" className="hover:text-white">Política de cookies</Link>
                <Link href="/cancelaciones-y-devoluciones" className="hover:text-white">Cancelaciones y devoluciones</Link>
                <Link href="/preguntas-frecuentes" className="hover:text-white">Preguntas frecuentes</Link>
                <Link href="/contacto" className="hover:text-white">Contacto y soporte</Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 CitaTica. Todos los derechos reservados.</span>
            <span>Hecho para negocios de Costa Rica 🇨🇷</span>
          </div>
        </div>
      </footer>
    </main>
  );
}


function AdSlot({ slot, compact = false }: { slot: string; compact?: boolean }) {
  if (!MOSTRAR_ESPACIOS_PUBLICITARIOS) return null;

  return (
    <aside
      data-ad-slot={slot}
      aria-label="Espacio publicitario"
      className={`mt-12 flex items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center ${
        compact ? "min-h-[110px] px-6 py-6" : "min-h-[140px] px-6 py-8"
      }`}
    >
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
          Espacio publicitario
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Área reservada para futuros patrocinadores o campañas de CitaTica.
        </p>
      </div>
    </aside>
  );
}
