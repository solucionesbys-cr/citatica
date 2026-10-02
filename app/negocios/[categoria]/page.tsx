"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type CategoriaConfig = {
  titulo: string;
  descripcion: string;
  slugs: string[];
};

type Negocio = {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  business_category_id: string;
  booking_enabled: boolean;
};

const categorias: Record<string, CategoriaConfig> = {
  barberias: {
    titulo: "Barberías",
    descripcion:
      "Encuentra barberías disponibles en CitaTica y reserva tu próxima cita.",
    slugs: ["barberia"],
  },
  "salones-de-belleza": {
    titulo: "Salones de belleza",
    descripcion:
      "Descubre salones de belleza, servicios de cabello y profesionales disponibles.",
    slugs: ["peluqueria"],
  },
  "unas-y-estetica": {
    titulo: "Uñas y estética",
    descripcion:
      "Encuentra negocios de uñas y estética y reserva directamente con sus profesionales.",
    slugs: ["unas", "estetica"],
  },
  "tatuajes-y-piercing": {
    titulo: "Tatuajes y piercing",
    descripcion:
      "Descubre estudios y profesionales de tatuajes y piercing disponibles en CitaTica.",
    slugs: ["tatuajes", "piercing"],
  },
  barberia: {
    titulo: "Barberías",
    descripcion: "Encuentra barberías disponibles en CitaTica.",
    slugs: ["barberia"],
  },
  peluqueria: {
    titulo: "Peluquerías",
    descripcion: "Encuentra peluquerías y profesionales disponibles en CitaTica.",
    slugs: ["peluqueria"],
  },
  unas: {
    titulo: "Uñas",
    descripcion: "Encuentra servicios de uñas disponibles en CitaTica.",
    slugs: ["unas"],
  },
  estetica: {
    titulo: "Estética",
    descripcion: "Encuentra centros y profesionales de estética en CitaTica.",
    slugs: ["estetica"],
  },
  maquillaje: {
    titulo: "Maquillaje",
    descripcion: "Encuentra profesionales y servicios de maquillaje.",
    slugs: ["maquillaje"],
  },
  pestanas: {
    titulo: "Pestañas",
    descripcion: "Encuentra especialistas en pestañas y reserva tu cita.",
    slugs: ["pestanas"],
  },
  spa: {
    titulo: "Spa",
    descripcion: "Encuentra opciones de spa y bienestar en CitaTica.",
    slugs: ["spa"],
  },
  masajes: {
    titulo: "Masajes",
    descripcion: "Encuentra profesionales y centros de masajes.",
    slugs: ["masajes"],
  },
  tatuajes: {
    titulo: "Tatuajes",
    descripcion: "Encuentra estudios y artistas de tatuajes.",
    slugs: ["tatuajes"],
  },
  piercing: {
    titulo: "Piercing",
    descripcion: "Encuentra estudios y profesionales de piercing.",
    slugs: ["piercing"],
  },
  "entrenamiento-personal": {
    titulo: "Entrenamiento personal",
    descripcion: "Encuentra entrenadores personales disponibles en CitaTica.",
    slugs: ["entrenamiento-personal"],
  },
  bienestar: {
    titulo: "Bienestar",
    descripcion: "Encuentra servicios y profesionales de bienestar.",
    slugs: ["bienestar"],
  },
};

function ubicacionNegocio(negocio: Negocio) {
  const partes = [negocio.district, negocio.canton, negocio.province].filter(Boolean);

  if (partes.length > 0) return partes.join(", ");
  if (negocio.address) return negocio.address;

  return "Costa Rica";
}

export default function CategoriaNegociosPage() {
  const params = useParams<{ categoria: string }>();
  const categoriaSlug = params?.categoria || "";

  const config = useMemo(
    () => categorias[categoriaSlug] ?? null,
    [categoriaSlug]
  );

  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!config) {
      setCargando(false);
      return;
    }

    cargarNegocios();
  }, [config]);

  async function cargarNegocios() {
    if (!config) return;

    setCargando(true);
    setError("");

    try {
      const { data: categoriasData, error: categoriasError } = await supabase
        .from("business_categories")
        .select("id, slug")
        .in("slug", config.slugs)
        .eq("is_active", true);

      if (categoriasError) throw categoriasError;

      const categoriaIds = (categoriasData || []).map((item) => item.id);

      if (categoriaIds.length === 0) {
        setNegocios([]);
        return;
      }

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
        setNegocios([]);
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
          address,
          logo_url,
          cover_url,
          business_category_id
        `)
        .in("business_category_id", categoriaIds)
        .in("id", businessIds)
        .order("business_name", { ascending: true });

      if (negociosError) throw negociosError;

      const lista: Negocio[] = (negociosData || []).map((negocio) => ({
        ...negocio,
        booking_enabled: publicados.get(negocio.id) ?? false,
      }));

      setNegocios(lista);
    } catch (err) {
      console.error("Error cargando negocios:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los negocios en este momento."
      );
    } finally {
      setCargando(false);
    }
  }

  if (!config) {
    return (
      <main className="min-h-screen bg-[#F6F9FF] text-[#042A6B]">
        <Header />
        <section className="mx-auto max-w-4xl px-5 py-24 text-center lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0066FF]">
              CitaTica
            </p>
            <h1 className="mt-4 text-4xl font-black">Categoría no encontrada</h1>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Esta categoría no está disponible o todavía no forma parte del directorio.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-2xl bg-[#042A6B] px-6 py-3 font-bold text-white"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F9FF] text-[#042A6B]">
      <Header />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <Link
            href="/#negocios"
            className="text-sm font-bold text-[#0066FF] transition hover:text-[#004fc4]"
          >
            ← Explorar categorías
          </Link>

          <div className="mt-7 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0066FF]">
              Encuentra dónde reservar
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
              {config.titulo}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {config.descripcion}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        {cargando ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#0066FF]" />
            <p className="mt-5 text-slate-600">Buscando negocios...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">
              No pudimos cargar los negocios
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">{error}</p>
            <button
              type="button"
              onClick={cargarNegocios}
              className="mt-7 rounded-xl bg-[#042A6B] px-5 py-3 font-bold text-white"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : negocios.length === 0 ? (
          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-5xl">🔎</div>
            <h2 className="mt-5 text-2xl font-black">
              Todavía no hay negocios publicados aquí
            </h2>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">
              Muy pronto podrás descubrir nuevos emprendimientos de {config.titulo.toLowerCase()} en CitaTica.
            </p>
            <Link
              href="/planes"
              className="mt-8 inline-flex rounded-2xl bg-[#0066FF] px-6 py-3 font-black text-white transition hover:bg-[#0058dc]"
            >
              Publicar mi negocio
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Negocios disponibles
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {negocios.length} {negocios.length === 1 ? "negocio encontrado" : "negocios encontrados"}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {negocios.map((negocio) => (
                <article
                  key={negocio.id}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {negocio.cover_url ? (
                      <img
                        src={negocio.cover_url}
                        alt={`Portada de ${negocio.business_name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#EEF7FF] to-[#F6F9FF] text-5xl">
                        ✨
                      </div>
                    )}

                    <div className="absolute -bottom-8 left-6">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#042A6B] text-xl font-black text-white shadow-lg">
                        {negocio.logo_url ? (
                          <img
                            src={negocio.logo_url}
                            alt={`Logo de ${negocio.business_name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          negocio.business_name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-12">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          {negocio.business_name}
                        </h3>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          📍 {ubicacionNegocio(negocio)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${
                          negocio.booking_enabled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {negocio.booking_enabled
                          ? "Reservas activas"
                          : "Perfil público"}
                      </span>
                    </div>

                    {negocio.description && (
                      <p className="mt-4 line-clamp-3 leading-7 text-slate-600">
                        {negocio.description}
                      </p>
                    )}

                    <div className="mt-6">
                      <Link
                        href={`/reservar/${negocio.slug}`}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-[#042A6B] px-5 py-3.5 font-black text-white transition hover:bg-[#07377f]"
                      >
                        {negocio.booking_enabled
                          ? "Ver negocio y reservar"
                          : "Ver negocio"}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Header() {
  return (
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

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/planes"
            className="rounded-xl bg-[#042A6B] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#07377f]"
          >
            Publicar mi negocio
          </Link>
        </div>
      </div>
    </header>
  );
}
