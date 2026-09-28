import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | CitaTica",
  description:
    "Política de privacidad y tratamiento de datos personales de CitaTica.",
};

export default function PrivacidadPage() {
  return (
    <main style={mainStyle}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Link href="/">
            <Image
              src="/brand/citatica-logo.png"
              alt="CitaTica"
              width={180}
              height={60}
              priority
              style={{ width: "160px", height: "auto" }}
            />
          </Link>

          <Link href="/" style={headerLinkStyle}>
            Volver al inicio
          </Link>
        </div>
      </header>

      <article style={articleStyle}>
        <p style={eyebrowStyle}>CITATICA</p>

        <h1 style={titleStyle}>Política de Privacidad</h1>

        <p style={updatedStyle}>
          Última actualización: 28 de septiembre de 2026
        </p>

        <Section title="1. Responsable del tratamiento">
          <p>
            CitaTica es un servicio operado en Costa Rica por Bryan Bermúdez
            González, cédula 5-0359-0142, persona física dedicada a servicios
            de tecnologías de información.
          </p>

          <p>
            Para efectos de esta Política de Privacidad, CitaTica actúa como
            responsable del tratamiento de los datos relacionados con las
            cuentas de usuario, administración de la plataforma, soporte,
            facturación, seguridad y funcionamiento general del servicio.
          </p>
        </Section>

        <Section title="2. Alcance de esta política">
          <p>
            Esta política describe cómo CitaTica recopila, utiliza, almacena y
            protege la información personal de las personas que crean una
            cuenta, administran un negocio o utilizan las herramientas de la
            plataforma.
          </p>

          <p>
            También explica el tratamiento de información que los negocios
            registran sobre sus propios clientes para gestionar citas y
            servicios.
          </p>
        </Section>

        <Section title="3. Información que podemos tratar">
          <p>Dependiendo del uso de CitaTica, podemos tratar información como:</p>

          <ul style={listStyle}>
            <li>nombre y apellidos;</li>
            <li>correo electrónico;</li>
            <li>teléfono y número de WhatsApp;</li>
            <li>datos del negocio y sus sucursales;</li>
            <li>servicios, profesionales, horarios y disponibilidad;</li>
            <li>información de citas y reservas;</li>
            <li>información necesaria para soporte y atención al usuario;</li>
            <li>
              información técnica básica relacionada con el acceso y uso de la
              plataforma;
            </li>
            <li>
              datos de facturación o transacción cuando se habiliten pagos.
            </li>
          </ul>
        </Section>

        <Section title="4. Información de los clientes de cada negocio">
          <p>
            Los negocios que utilizan CitaTica pueden registrar información de
            sus clientes, incluyendo nombres, teléfonos, WhatsApp, correo
            electrónico, servicios reservados, fechas de citas y notas
            relacionadas con la atención.
          </p>

          <p>
            En estos casos, el negocio que recopila y utiliza la información es
            responsable de hacerlo de manera legítima y conforme a la normativa
            aplicable. CitaTica procesa dicha información únicamente para
            proporcionar las funcionalidades contratadas por el negocio.
          </p>
        </Section>

        <Section title="5. Finalidades del tratamiento">
          <p>La información puede utilizarse para:</p>

          <ul style={listStyle}>
            <li>crear y administrar cuentas de usuario;</li>
            <li>crear y operar espacios de negocio en CitaTica;</li>
            <li>gestionar citas, clientes, servicios y profesionales;</li>
            <li>generar disponibilidad y reservas en línea;</li>
            <li>enviar confirmaciones y recordatorios relacionados con citas;</li>
            <li>prestar soporte técnico y atención al usuario;</li>
            <li>mantener la seguridad y estabilidad de la plataforma;</li>
            <li>prevenir fraude, abuso o accesos no autorizados;</li>
            <li>administrar planes, suscripciones y pagos;</li>
            <li>cumplir obligaciones legales aplicables.</li>
          </ul>
        </Section>

        <Section title="6. WhatsApp y comunicaciones relacionadas con citas">
          <p>
            Algunos planes pueden permitir el envío de mensajes de confirmación,
            reprogramación, cancelación o recordatorio mediante WhatsApp u otros
            medios de comunicación.
          </p>

          <p>
            Estos mensajes deben estar relacionados con la gestión de citas o
            servicios del negocio. Cada negocio es responsable de utilizar estas
            funciones de forma legítima y respetando las preferencias de sus
            clientes.
          </p>
        </Section>

        <Section title="7. Proveedores tecnológicos">
          <p>
            CitaTica puede utilizar proveedores externos para infraestructura,
            autenticación, almacenamiento, correo electrónico, mensajería,
            procesamiento de pagos, análisis técnico y otras funciones
            necesarias para prestar el servicio.
          </p>

          <p>
            Cuando sea necesario compartir información con estos proveedores,
            se procurará limitarla a lo necesario para la prestación del
            servicio correspondiente.
          </p>
        </Section>

        <Section title="8. Conservación de la información">
          <p>
            La información se conservará mientras la cuenta o el negocio se
            mantengan activos y durante el tiempo adicional que resulte
            razonablemente necesario para cumplir obligaciones legales,
            resolver disputas, mantener seguridad, prevenir fraude o atender
            solicitudes relacionadas con la cuenta.
          </p>

          <p>
            La cancelación de un plan de pago no implica por sí sola la
            eliminación inmediata de la cuenta o de la información del negocio.
          </p>
        </Section>

        <Section title="9. Seguridad">
          <p>
            CitaTica adopta medidas técnicas y organizativas razonables para
            reducir riesgos de acceso no autorizado, pérdida, alteración o uso
            indebido de la información.
          </p>

          <p>
            Ningún sistema conectado a Internet puede garantizar seguridad
            absoluta. Los usuarios también deben proteger sus credenciales y
            utilizar contraseñas seguras.
          </p>
        </Section>

        <Section title="10. Derechos de las personas titulares">
          <p>
            Las personas titulares de datos personales pueden solicitar, según
            corresponda y conforme a la legislación aplicable, acceso,
            rectificación, actualización o supresión de sus datos personales.
          </p>

          <p>
            Las solicitudes relacionadas directamente con información de
            clientes almacenada por un negocio pueden requerir coordinación con
            dicho negocio, cuando este sea quien determine la finalidad y uso de
            esos datos.
          </p>
        </Section>

        <Section title="11. Menores de edad">
          <p>
            CitaTica no está diseñada para que menores de edad creen cuentas de
            negocio por su propia cuenta. Los negocios que atiendan menores son
            responsables de gestionar la información correspondiente de acuerdo
            con la normativa que resulte aplicable.
          </p>
        </Section>

        <Section title="12. Cambios a esta política">
          <p>
            CitaTica podrá actualizar esta Política de Privacidad cuando cambien
            sus funcionalidades, proveedores, procesos o requisitos legales.
          </p>

          <p>
            La fecha de la última actualización se mostrará al inicio de este
            documento.
          </p>
        </Section>

        <Section title="13. Contacto">
          <p>
            Para consultas o solicitudes relacionadas con privacidad y datos
            personales, puede utilizar los medios oficiales de CitaTica.
          </p>

          <p>
            <strong>Responsable:</strong> Bryan Bermúdez González
            <br />
            <strong>Cédula:</strong> 5-0359-0142
            <br />
            <strong>Nombre comercial:</strong> CitaTica
            <br />
            <strong>País:</strong> Costa Rica
            <br />
            <strong>Correo:</strong> soporte@citatica.com
          </p>
        </Section>

        <div style={linksBoxStyle}>
          <strong style={{ color: "#042A6B" }}>Documentos relacionados</strong>

          <div style={linksRowStyle}>
            <Link href="/terminos" style={linkStyle}>
              Términos y Condiciones
            </Link>

            <Link href="/cancelaciones-y-devoluciones" style={linkStyle}>
              Cancelaciones y Devoluciones
            </Link>
          </div>
        </div>

        <div style={legalNoticeStyle}>
          Esta es una versión inicial preparada para el lanzamiento de CitaTica.
          Conviene realizar una revisión jurídica profesional antes de iniciar
          cobros comerciales a usuarios finales.
        </div>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: "34px" }}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <div style={sectionBodyStyle}>{children}</div>
    </section>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F6F9FF",
  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  color: "#344054",
};

const headerStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderBottom: "1px solid #E6EEF8",
};

const headerInnerStyle: React.CSSProperties = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "18px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
};

const headerLinkStyle: React.CSSProperties = {
  color: "#0066FF",
  fontWeight: "700",
  textDecoration: "none",
};

const articleStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "60px 24px 90px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#0066FF",
  fontWeight: "800",
  fontSize: "13px",
  letterSpacing: "1px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "42px",
  lineHeight: "1.1",
  color: "#042A6B",
  marginBottom: "12px",
};

const updatedStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "14px",
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#042A6B",
  fontSize: "21px",
  marginBottom: "12px",
};

const sectionBodyStyle: React.CSSProperties = {
  lineHeight: "1.75",
  fontSize: "15px",
  color: "#475467",
};

const listStyle: React.CSSProperties = {
  paddingLeft: "22px",
  lineHeight: "1.8",
};

const linksBoxStyle: React.CSSProperties = {
  marginTop: "46px",
  padding: "22px",
  borderRadius: "16px",
  background: "#FFFFFF",
  border: "1px solid #D7E9FF",
};

const linksRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "18px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const linkStyle: React.CSSProperties = {
  color: "#0066FF",
  fontWeight: "700",
  textDecoration: "none",
};

const legalNoticeStyle: React.CSSProperties = {
  marginTop: "24px",
  padding: "18px 20px",
  borderRadius: "14px",
  background: "#EEF7FF",
  border: "1px solid #D7E9FF",
  color: "#475467",
  lineHeight: "1.6",
  fontSize: "13px",
};
