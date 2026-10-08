import Image from "next/image";
import Link from "next/link";

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
    title: "Médicos",
    slug: "medicos",
    text: "Consulta general, especialistas y atención por cita.",
    image:
      "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Nutrición",
    slug: "nutricion",
    text: "Valoraciones, seguimiento y planes nutricionales.",
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Odontología",
    slug: "odontologia",
    text: "Consultas, limpiezas, tratamientos y seguimiento.",
    image:
      "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Fisioterapia",
    slug: "fisioterapia",
    text: "Terapia física, rehabilitación y recuperación funcional.",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85",
  },
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
            <a href="#negocios" className="transition hover:text-slate-950">
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
              CitaTica ayuda a clínicas, consultorios, barberías, salones, gimnasios y otros negocios a recibir reservas las 24 horas, organizar su agenda y atender mejor a sus clientes.
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

      <section id="funciones" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
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

      <section id="negocios" className="bg-[#042A6B] py-20 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#22C1F6]">Salud, belleza y mucho más</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Una plataforma para profesionales, clínicas y negocios que trabajan con citas.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Desde medicina, nutrición y odontología hasta barberías, estética y bienestar. Cada negocio mantiene su propia marca, servicios, profesionales, horarios y disponibilidad.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
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

      <section id="como-funciona" className="bg-white py-20 lg:py-24">
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

      <section id="publicar" className="border-y border-slate-200 bg-white py-20 lg:py-24">
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
                <Link href="/negocios/medicos" className="hover:text-white">Médicos</Link>
                <Link href="/negocios/nutricion" className="hover:text-white">Nutrición</Link>
                <Link href="/negocios/odontologia" className="hover:text-white">Odontología</Link>
                <Link href="/negocios/fisioterapia" className="hover:text-white">Fisioterapia</Link>
                <Link href="/negocios/barberias" className="hover:text-white">Barberías</Link>
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
                <Link href="/cancelaciones" className="hover:text-white">Política de cancelaciones</Link>
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
