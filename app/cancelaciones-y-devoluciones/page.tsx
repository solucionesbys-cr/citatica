import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Cancelaciones y Devoluciones | CitaTica",
  description:
    "Política de cancelación, retracto y devoluciones de CitaTica.",
};

export default function CancelacionesYDevolucionesPage() {
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

        <h1 style={titleStyle}>Cancelaciones y Devoluciones</h1>

        <p style={updatedStyle}>
          Última actualización: 28 de septiembre de 2026
        </p>

        <Section title="1. Alcance">
          <p>
            Esta política establece las condiciones generales aplicables a la
            cancelación de planes, cambios de suscripción, solicitudes de
            devolución, cobros incorrectos y demás situaciones relacionadas con
            pagos realizados por servicios de CitaTica.
          </p>
        </Section>

        <Section title="2. Prueba Premium de 15 días">
          <p>
            Los nuevos negocios pueden recibir una prueba gratuita de las
            funcionalidades del plan Emprende durante quince (15) días.
          </p>

          <p>
            La prueba no requiere tarjeta de pago y no genera un cobro
            automático al finalizar.
          </p>

          <p>
            Si el usuario no contrata un plan de pago al finalizar la prueba,
            su negocio continuará en el plan Gratis, sujeto a las funciones y
            límites vigentes de dicho plan.
          </p>
        </Section>

        <Section title="3. Cancelación de una suscripción de pago">
          <p>
            El usuario podrá solicitar la cancelación de su suscripción en
            cualquier momento mediante los mecanismos habilitados por CitaTica.
          </p>

          <p>
            Salvo que se indique algo distinto al momento de contratar, la
            cancelación impedirá futuras renovaciones y el usuario podrá
            continuar utilizando las funcionalidades del plan contratado hasta
            el final del periodo ya pagado.
          </p>

          <p>
            Finalizado ese periodo, el negocio podrá continuar en el plan Gratis
            o en el plan que corresponda según su estado de suscripción.
          </p>
        </Section>

        <Section title="4. Derecho de retracto">
          <p>
            Cuando resulte aplicable conforme a la legislación costarricense de
            protección al consumidor y a la naturaleza del servicio contratado,
            el usuario podrá ejercer el derecho de retracto dentro del plazo
            legal correspondiente.
          </p>

          <p>
            Cuando el servicio ya haya comenzado a ejecutarse, la evaluación de
            la solicitud podrá considerar la parte del servicio efectivamente
            utilizada, en los casos en que así corresponda legalmente.
          </p>
        </Section>

        <Section title="5. Solicitudes de devolución">
          <p>
            Fuera de los casos en que exista un derecho legal de devolución o
            retracto, los periodos ya utilizados normalmente no son
            reembolsables.
          </p>

          <p>
            Sin embargo, CitaTica podrá aprobar una devolución total o parcial
            cuando exista, entre otras situaciones:
          </p>

          <ul style={listStyle}>
            <li>un cobro duplicado;</li>
            <li>un cobro incorrecto atribuible a CitaTica;</li>
            <li>un error comprobado en el procesamiento del pago;</li>
            <li>
              una indisponibilidad sustancial del servicio atribuible a CitaTica
              que afecte de manera significativa el periodo contratado;
            </li>
            <li>
              cualquier otra situación en la que la normativa aplicable exija
              una devolución.
            </li>
          </ul>
        </Section>

        <Section title="6. Cambios de plan">
          <p>
            Cuando se habiliten cambios entre planes de pago, CitaTica informará
            antes de confirmar el cambio cualquier ajuste de precio,
            periodicidad, vigencia o condiciones aplicables.
          </p>

          <p>
            Los cambios de plan podrán aplicarse inmediatamente o al siguiente
            periodo de facturación, según la modalidad que se muestre al usuario
            antes de confirmar la operación.
          </p>
        </Section>

        <Section title="7. Cobros duplicados o incorrectos">
          <p>
            Si el usuario identifica un cobro duplicado, monto incorrecto o pago
            que no reconoce relacionado con CitaTica, deberá comunicarlo a la
            mayor brevedad posible para que pueda ser revisado.
          </p>

          <p>Para facilitar la revisión, se podrá solicitar:</p>

          <ul style={listStyle}>
            <li>nombre del titular de la cuenta;</li>
            <li>correo electrónico asociado a CitaTica;</li>
            <li>nombre del negocio;</li>
            <li>fecha del cobro;</li>
            <li>monto cobrado;</li>
            <li>comprobante de pago;</li>
            <li>descripción del problema.</li>
          </ul>
        </Section>

        <Section title="8. Método de devolución">
          <p>
            Cuando corresponda una devolución, se procurará realizarla por el
            mismo medio utilizado para el pago original, cuando sea técnicamente
            posible y permitido por el proveedor de pagos.
          </p>

          <p>
            Los tiempos de acreditación pueden depender de bancos, emisores de
            tarjetas, procesadores de pago u otros terceros.
          </p>
        </Section>

        <Section title="9. Cancelar un plan no elimina automáticamente la cuenta">
          <p>
            La cancelación de una suscripción de pago no implica la eliminación
            inmediata del negocio, su cuenta o la información almacenada en
            CitaTica.
          </p>

          <p>
            Si el usuario desea eliminar su cuenta o solicitar la supresión de
            información, deberá utilizar el procedimiento correspondiente o
            contactar a CitaTica.
          </p>
        </Section>

        <Section title="10. Suspensión por incumplimiento">
          <p>
            CitaTica podrá suspender una cuenta en casos de fraude, abuso,
            riesgos de seguridad, incumplimiento de los Términos y Condiciones o
            uso que perjudique a otros usuarios o a la plataforma.
          </p>

          <p>
            La existencia de una suspensión no limita los derechos que la
            legislación aplicable reconozca al consumidor.
          </p>
        </Section>

        <Section title="11. Contacto para solicitudes">
          <p>
            Las solicitudes relacionadas con cancelaciones, pagos o
            devoluciones pueden enviarse por los medios oficiales de CitaTica.
          </p>

          <p>
            <strong>Operador:</strong> Bryan Bermúdez González
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

            <Link href="/privacidad" style={linkStyle}>
              Política de Privacidad
            </Link>
          </div>
        </div>

        <div style={legalNoticeStyle}>
          Esta política es una versión inicial preparada para CitaTica. Antes de
          iniciar cobros comerciales, conviene realizar una revisión jurídica y
          ajustarla al proveedor de pagos que finalmente utilice la plataforma.
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
