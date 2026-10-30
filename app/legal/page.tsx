import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Información Legal | CitaTica",
  description:
    "Términos y Condiciones, Política de Cancelaciones y Devoluciones y Política de Privacidad de CitaTica.",
};

export default function LegalPage() {
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
        <h1 style={titleStyle}>Información Legal de CitaTica</h1>
        <p style={updatedStyle}>Última actualización: octubre 2026</p>

        <div style={noticeStyle}>
          <strong style={{ color: "#042A6B" }}>Documento legal único</strong>
          <p style={{ margin: "8px 0 0" }}>
            En esta misma página se presentan de forma íntegra los Términos y
            Condiciones, la Política de Cancelaciones y Devoluciones y la
            Política de Privacidad aplicables al uso y contratación de CitaTica.
          </p>
        </div>

        <div style={identificationStyle}>
          <strong style={{ color: "#042A6B" }}>Operador del servicio</strong>
          <p style={{ margin: "8px 0 0" }}>
            CitaTica es un servicio operado en Costa Rica por{" "}
            <strong>Bryan Bermúdez González</strong>, cédula{" "}
            <strong>5-0359-0142</strong>, persona física dedicada a Servicios de
            Tecnologías de Información.
          </p>
        </div>

        <h2 style={documentTitleStyle}>TÉRMINOS Y CONDICIONES</h2>

        <Section title="1. Objeto">
          <p>
            Estos Términos y Condiciones regulan el acceso, registro,
            contratación y uso de CitaTica, una plataforma tecnológica para la
            gestión de citas, clientes, servicios, profesionales, horarios,
            reservas en línea, recordatorios y otras herramientas relacionadas
            con la administración de negocios que trabajan mediante citas.
          </p>
          <p>
            Al crear una cuenta, utilizar la plataforma o contratar alguno de
            sus planes, la persona usuaria declara haber leído, comprendido y
            aceptado estos Términos y Condiciones.
          </p>
        </Section>

        <Section title="2. Identificación del proveedor">
          <p>
            El servicio CitaTica es operado por Bryan Bermúdez González, cédula
            5-0359-0142, en la República de Costa Rica.
          </p>
          <p>
            La actividad principal del operador corresponde al sector de
            Servicios de Tecnologías de Información.
          </p>
          <p>
            Los medios oficiales de contacto y atención al usuario serán los
            publicados dentro del sitio web y de la plataforma CitaTica.
          </p>
        </Section>

        <Section title="3. Usuarios de CitaTica">
          <p>
            CitaTica está dirigida principalmente a negocios, emprendimientos y
            profesionales que ofrecen servicios mediante citas.
          </p>
          <p>
            La persona que registra un negocio declara tener autorización
            suficiente para administrarlo y utilizar CitaTica en su nombre.
          </p>
        </Section>

        <Section title="4. Cuenta y seguridad">
          <p>
            Cada usuario es responsable de mantener la confidencialidad de sus
            credenciales de acceso y de las actividades realizadas desde su
            cuenta.
          </p>
          <p>
            El usuario deberá proporcionar información veraz, actualizada y
            suficiente para la correcta prestación del servicio.
          </p>
          <p>
            CitaTica podrá implementar mecanismos de confirmación de correo,
            recuperación de contraseña y otras medidas razonables de seguridad.
          </p>
        </Section>

        <Section title="5. Planes y funcionalidades">
          <p>
            CitaTica puede ofrecer diferentes planes con precios, límites y
            funcionalidades distintas, incluyendo cantidad de clientes,
            servicios, profesionales, reservas, sucursales, mensajería,
            estadísticas y otras herramientas.
          </p>
          <p>
            Las características, límites y precios vigentes de cada plan serán
            mostrados en la página de planes antes de su contratación.
          </p>
          <p>
            CitaTica podrá modificar en el futuro sus planes, precios o
            características. Cuando un cambio afecte de forma relevante una
            suscripción activa, se procurará comunicarlo previamente al usuario.
          </p>
        </Section>

        <Section title="6. Prueba Premium de 15 días">
          <p>
            Los negocios nuevos podrán recibir una prueba gratuita de las
            funcionalidades del plan Emprende durante quince (15) días, salvo
            que CitaTica indique otra condición promocional al momento del
            registro.
          </p>
          <p>
            La prueba no requiere tarjeta de pago y no genera cobros automáticos
            al finalizar.
          </p>
          <p>
            Durante la prueba podrán existir límites específicos, incluyendo un
            número máximo de mensajes de WhatsApp u otros recursos.
          </p>
          <p>
            Al finalizar la prueba, si el usuario no contrata un plan de pago,
            su negocio continuará en el plan Gratis y quedará sujeto a los
            límites correspondientes a dicho plan.
          </p>
        </Section>

        <Section title="7. Pagos, renovaciones y cambios de plan">
          <p>
            Cuando CitaTica habilite planes de pago, el precio, periodicidad,
            impuestos aplicables, métodos de pago y condiciones de renovación
            serán informados antes de que el usuario confirme la contratación.
            Los pagos de suscripción se realizan a través de Cargos Recurrentes.
          </p>
          <p>
            CitaTica no realizará cobros automáticos que no hayan sido
            previamente informados y aceptados por el usuario.
          </p>
          <p>
            Los cambios entre planes podrán modificar los límites y
            funcionalidades disponibles para el negocio.
          </p>
        </Section>

        <Section title="8. Mensajería y WhatsApp">
          <p>
            Algunos planes pueden incluir confirmaciones, recordatorios y otras
            comunicaciones relacionadas con citas mediante WhatsApp u otros
            canales.
          </p>
          <p>
            El negocio es responsable de utilizar estas herramientas únicamente
            para comunicaciones legítimas relacionadas con sus clientes y de
            contar con la autorización o base correspondiente cuando resulte
            necesaria.
          </p>
          <p>
            El funcionamiento de estas funciones puede depender de servicios de
            terceros y de sus condiciones técnicas, comerciales y de
            disponibilidad.
          </p>
        </Section>

        <Section title="9. Usos prohibidos">
          <p>No está permitido utilizar CitaTica para:</p>
          <ul style={listStyle}>
            <li>realizar actividades ilícitas;</li>
            <li>enviar comunicaciones abusivas o no autorizadas;</li>
            <li>acceder a información de otros usuarios sin permiso;</li>
            <li>intentar vulnerar la seguridad de la plataforma;</li>
            <li>introducir código malicioso;</li>
            <li>
              utilizar la plataforma de manera que afecte su funcionamiento o
              el de otros usuarios;
            </li>
            <li>
              utilizar información personal para fines distintos de aquellos
              legítimamente relacionados con el servicio.
            </li>
          </ul>
        </Section>

        <Section title="10. Disponibilidad del servicio">
          <p>
            CitaTica procurará mantener la plataforma disponible y operativa.
            Sin embargo, pueden producirse interrupciones temporales por
            mantenimiento, actualizaciones, fallos de proveedores, problemas de
            conectividad, situaciones de fuerza mayor u otras causas técnicas.
          </p>
          <p>
            Cuando sea razonablemente posible, CitaTica procurará comunicar
            mantenimientos programados o incidencias relevantes.
          </p>
        </Section>

        <Section title="11. Servicios de terceros">
          <p>
            CitaTica puede utilizar servicios tecnológicos de terceros para
            funciones como alojamiento, autenticación, almacenamiento, correo
            electrónico, mensajería, procesamiento de pagos u otras
            funcionalidades. No se almacenan datos sensibles de las tarjetas de
            crédito o débito, tales como la numeración completa del plástico, la
            fecha de vencimiento y el código de seguridad (CVV), garantizando así
            el tratamiento seguro de la información de los usuarios.
          </p>
          <p>
            Algunas funciones pueden estar sujetas adicionalmente a los
            términos, políticas y disponibilidad de dichos proveedores.
          </p>
        </Section>

        <Section title="12. Cancelación y cierre de cuenta">
          <p>
            El usuario podrá solicitar la cancelación de su suscripción o el
            cierre de su cuenta conforme a los mecanismos disponibles en
            CitaTica.
          </p>
          <p>
            La cancelación de una suscripción de pago no implica necesariamente
            la eliminación inmediata de la cuenta o de los datos asociados al
            negocio.
          </p>
          <p>
            Las solicitudes relacionadas con eliminación de datos se atenderán
            conforme a la Política de Privacidad y a la legislación aplicable.
          </p>
        </Section>

        <Section title="13. Suspensión">
          <p>
            CitaTica podrá suspender temporalmente una cuenta cuando exista uso
            abusivo, fraude, riesgo de seguridad, incumplimiento de estos
            términos o actividades que puedan afectar a otros usuarios o a la
            plataforma.
          </p>
        </Section>

        <Section title="14. Responsabilidad del negocio">
          <p>
            CitaTica proporciona herramientas tecnológicas para la gestión de
            citas y negocios, pero no participa en la prestación del servicio
            que cada negocio ofrece a sus clientes.
          </p>
          <p>
            Cada negocio es responsable de sus precios, horarios,
            disponibilidad, servicios, profesionales, atención, cancelaciones,
            cumplimiento de citas y demás relaciones con sus clientes.
          </p>
        </Section>

        <Section title="15. Propiedad intelectual">
          <p>
            El nombre CitaTica, su identidad gráfica, software, diseño,
            funcionalidades, documentación y demás elementos propios de la
            plataforma se encuentran protegidos por la legislación aplicable.
          </p>
          <p>
            Cada negocio conserva los derechos que le correspondan sobre sus
            propias marcas, logos, fotografías y contenidos.
          </p>
        </Section>

        <Section title="16. Modificaciones de estos términos">
          <p>
            Estos términos pueden ser actualizados para reflejar cambios en
            CitaTica, nuevas funcionalidades, cambios legales, técnicos o
            comerciales.
          </p>
          <p>
            La fecha de la última actualización se mostrará al inicio de este
            documento. Cuando corresponda, CitaTica podrá solicitar al usuario
            una nueva aceptación de las condiciones actualizadas.
          </p>
        </Section>

        <Section title="17. Legislación aplicable">
          <p>
            Estos términos se interpretarán conforme al ordenamiento jurídico de
            la República de Costa Rica, sin perjuicio de los derechos
            reconocidos por la normativa de protección al consumidor y de
            protección de datos personales.
          </p>
        </Section>

        <Divider />

        <h2 style={documentTitleStyle}>
          POLÍTICA DE CANCELACIONES Y DEVOLUCIONES
        </h2>

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
            Si el usuario no contrata un plan de pago al finalizar la prueba, su
            negocio continuará en el plan Gratis, sujeto a las funciones y
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
            Cuando corresponda una devolución, se realizará al mismo medio
            utilizado para el pago original, es decir, a la misma tarjeta con la
            que se realizó la compra.
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

        <Divider />

        <h2 style={documentTitleStyle}>POLÍTICA DE PRIVACIDAD</h2>

        <section style={introBoxStyle}>
          <h3 style={{ ...sectionTitleStyle, marginTop: 0 }}>
            Información de clientes y protección de datos personales
          </h3>
          <div style={sectionBodyStyle}>
            <p>
              CitaTica tratará los datos personales conforme a esta Política de
              Privacidad y a la legislación costarricense aplicable.
            </p>
            <p>
              Los usuarios deberán utilizar los datos personales a los que
              tengan acceso únicamente para fines legítimos relacionados con la
              operación de su negocio y la gestión de citas.
            </p>
            <p>
              Los negocios pueden registrar información necesaria para
              administrar sus citas, como nombres, teléfonos, WhatsApp,
              direcciones de correo electrónico, servicios solicitados y datos
              relacionados con las reservas.
            </p>
            <p>
              Cada negocio es responsable de utilizar la información de sus
              clientes de manera legítima, proporcional y relacionada con la
              prestación de sus servicios.
            </p>
          </div>
        </section>

        <Section title="1. Responsable del tratamiento">
          <p>
            CitaTica es un servicio operado en Costa Rica por Bryan Bermúdez
            González, cédula 5-0359-0142, persona física dedicada a servicios de
            tecnologías de información.
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
            Esta política describe cómo CitaTica recopila, utiliza y protege la
            información personal de las personas que crean una cuenta,
            administran un negocio o utilizan las herramientas de la plataforma.
          </p>
          <p>
            También explica el tratamiento de información que los negocios
            registran sobre sus propios clientes para gestionar citas y
            servicios. No se almacenan datos sensibles de las tarjetas de
            crédito o débito, tales como la numeración completa del plástico, la
            fecha de vencimiento y el código de seguridad (CVV), garantizando así
            el tratamiento seguro de la información de los usuarios.
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
            <li>datos de facturación o transacción cuando se habiliten pagos.</li>
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
            proporcionar las funcionalidades contratadas por el negocio. La
            información recopilada no será compartida, comercializada ni
            transferida a terceros sin la debida autorización del titular o sin
            el sustento legal correspondiente.
          </p>
        </Section>

        <Section title="5. Finalidades del tratamiento">
          <p>La información puede utilizarse para:</p>
          <ul style={listStyle}>
            <li>crear y administrar cuentas de usuario;</li>
            <li>crear y operar espacios de negocio en CitaTica;</li>
            <li>gestionar citas, clientes, servicios y profesionales;</li>
            <li>generar disponibilidad y reservas en línea;</li>
            <li>
              enviar confirmaciones y recordatorios relacionados con citas;
            </li>
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
            autenticación, correo electrónico, mensajería, procesamiento de
            pagos, análisis técnico y otras funciones necesarias para prestar el
            servicio.
          </p>
        </Section>

        <Section title="8. Conservación de la información">
          <p>
            La información se conservará mientras la cuenta o el negocio se
            mantengan activos y durante el tiempo adicional que resulte
            razonablemente necesario para cumplir obligaciones legales, resolver
            disputas, mantener seguridad, prevenir fraude o atender solicitudes
            relacionadas con la cuenta.
          </p>
          <p>
            La cancelación de un plan de pago no implica por sí sola la
            eliminación inmediata de la cuenta o de la información del negocio.
          </p>
          <p>
            El comercio no almacena datos sensibles de las tarjetas de crédito o
            débito utilizadas.
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

        <div style={finalBoxStyle}>
          <strong style={{ color: "#042A6B" }}>
            Aceptación de la información legal
          </strong>
          <p style={{ margin: "10px 0 0" }}>
            Al utilizar CitaTica, crear una cuenta o contratar un plan, la
            persona usuaria declara haber leído, comprendido y aceptado el
            contenido completo de este documento legal único.
          </p>
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
      <h3 style={sectionTitleStyle}>{title}</h3>
      <div style={sectionBodyStyle}>{children}</div>
    </section>
  );
}

function Divider() {
  return <div style={dividerStyle} />;
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
  position: "sticky",
  top: 0,
  zIndex: 20,
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

const noticeStyle: React.CSSProperties = {
  marginTop: "28px",
  padding: "22px",
  borderRadius: "16px",
  background: "#EEF7FF",
  border: "1px solid #CFE5FF",
  lineHeight: "1.7",
};

const identificationStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "22px",
  borderRadius: "16px",
  background: "#FFFFFF",
  border: "1px solid #D7E9FF",
  lineHeight: "1.7",
};

const documentTitleStyle: React.CSSProperties = {
  marginTop: "58px",
  paddingBottom: "16px",
  borderBottom: "3px solid #0066FF",
  color: "#042A6B",
  fontSize: "28px",
  lineHeight: "1.2",
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

const introBoxStyle: React.CSSProperties = {
  marginTop: "28px",
  padding: "22px",
  borderRadius: "16px",
  background: "#FFFFFF",
  border: "1px solid #D7E9FF",
};

const dividerStyle: React.CSSProperties = {
  margin: "70px 0 0",
  height: "1px",
  background: "#D7E9FF",
};

const finalBoxStyle: React.CSSProperties = {
  marginTop: "50px",
  padding: "24px",
  borderRadius: "16px",
  background: "#FFFFFF",
  border: "1px solid #D7E9FF",
  lineHeight: "1.7",
};
