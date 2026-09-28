import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones | CitaTica",
  description:
    "Términos y condiciones de uso de la plataforma CitaTica.",
};

export default function TerminosPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F6F9FF",
        fontFamily:
          "var(--font-geist-sans), Arial, sans-serif",
        color: "#344054",
      }}
    >
      <header
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E6EEF8",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Link href="/">
            <Image
              src="/brand/citatica-logo.png"
              alt="CitaTica"
              width={180}
              height={60}
              priority
              style={{
                width: "160px",
                height: "auto",
              }}
            />
          </Link>

          <Link
            href="/"
            style={{
              color: "#0066FF",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <article
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "60px 24px 90px",
        }}
      >
        <p
          style={{
            color: "#0066FF",
            fontWeight: "800",
            fontSize: "13px",
            letterSpacing: "1px",
          }}
        >
          CITATICA
        </p>

        <h1
          style={{
            fontSize: "42px",
            lineHeight: "1.1",
            color: "#042A6B",
            marginBottom: "12px",
          }}
        >
          Términos y Condiciones
        </h1>

        <p style={actualizacionStyle}>
          Última actualización: 28 de septiembre de 2026
        </p>

        <div style={identificacionStyle}>
          <strong style={{ color: "#042A6B" }}>
            Operador del servicio
          </strong>

          <p style={{ margin: "8px 0 0" }}>
            CitaTica es un servicio operado en Costa Rica por
            <strong> Bryan Bermúdez González</strong>, cédula
            <strong> 5-0359-0142</strong>, persona física dedicada a
            Servicios de Tecnologías de Información.
          </p>
        </div>

        <Seccion titulo="1. Objeto">
          <p>
            Estos Términos y Condiciones regulan el acceso, registro,
            contratación y uso de CitaTica, una plataforma tecnológica
            para la gestión de citas, clientes, servicios,
            profesionales, horarios, reservas en línea, recordatorios
            y otras herramientas relacionadas con la administración de
            negocios que trabajan mediante citas.
          </p>

          <p>
            Al crear una cuenta, utilizar la plataforma o contratar
            alguno de sus planes, la persona usuaria declara haber
            leído, comprendido y aceptado estos Términos y Condiciones.
          </p>
        </Seccion>

        <Seccion titulo="2. Identificación del proveedor">
          <p>
            El servicio CitaTica es operado por Bryan Bermúdez
            González, cédula 5-0359-0142, en la República de Costa
            Rica.
          </p>

          <p>
            La actividad principal del operador corresponde al sector
            de Servicios de Tecnologías de Información.
          </p>

          <p>
            Los medios oficiales de contacto y atención al usuario
            serán los publicados dentro del sitio web y de la
            plataforma CitaTica.
          </p>
        </Seccion>

        <Seccion titulo="3. Usuarios de CitaTica">
          <p>
            CitaTica está dirigida principalmente a negocios,
            emprendimientos y profesionales que ofrecen servicios
            mediante citas.
          </p>

          <p>
            La persona que registra un negocio declara tener
            autorización suficiente para administrarlo y utilizar
            CitaTica en su nombre.
          </p>
        </Seccion>

        <Seccion titulo="4. Cuenta y seguridad">
          <p>
            Cada usuario es responsable de mantener la confidencialidad
            de sus credenciales de acceso y de las actividades
            realizadas desde su cuenta.
          </p>

          <p>
            El usuario deberá proporcionar información veraz,
            actualizada y suficiente para la correcta prestación del
            servicio.
          </p>

          <p>
            CitaTica podrá implementar mecanismos de confirmación de
            correo, recuperación de contraseña y otras medidas
            razonables de seguridad.
          </p>
        </Seccion>

        <Seccion titulo="5. Planes y funcionalidades">
          <p>
            CitaTica puede ofrecer diferentes planes con precios,
            límites y funcionalidades distintas, incluyendo cantidad
            de clientes, servicios, profesionales, reservas,
            sucursales, mensajería, estadísticas y otras herramientas.
          </p>

          <p>
            Las características, límites y precios vigentes de cada
            plan serán mostrados en la página de planes antes de su
            contratación.
          </p>

          <p>
            CitaTica podrá modificar en el futuro sus planes, precios o
            características. Cuando un cambio afecte de forma
            relevante una suscripción activa, se procurará comunicarlo
            previamente al usuario.
          </p>
        </Seccion>

        <Seccion titulo="6. Prueba Premium de 15 días">
          <p>
            Los negocios nuevos podrán recibir una prueba gratuita de
            las funcionalidades del plan Emprende durante quince (15)
            días, salvo que CitaTica indique otra condición promocional
            al momento del registro.
          </p>

          <p>
            La prueba no requiere tarjeta de pago y no genera cobros
            automáticos al finalizar.
          </p>

          <p>
            Durante la prueba podrán existir límites específicos,
            incluyendo un número máximo de mensajes de WhatsApp u otros
            recursos.
          </p>

          <p>
            Al finalizar la prueba, si el usuario no contrata un plan
            de pago, su negocio continuará en el plan Gratis y quedará
            sujeto a los límites correspondientes a dicho plan.
          </p>
        </Seccion>

        <Seccion titulo="7. Pagos, renovaciones y cambios de plan">
          <p>
            Cuando CitaTica habilite planes de pago, el precio,
            periodicidad, impuestos aplicables, métodos de pago y
            condiciones de renovación serán informados antes de que el
            usuario confirme la contratación.
          </p>

          <p>
            CitaTica no realizará cobros automáticos que no hayan sido
            previamente informados y aceptados por el usuario.
          </p>

          <p>
            Los cambios entre planes podrán modificar los límites y
            funcionalidades disponibles para el negocio.
          </p>
        </Seccion>

        <Seccion titulo="8. Cancelaciones, retracto y devoluciones">
          <p>
            Las reglas aplicables a cancelaciones, derecho de retracto,
            cobros incorrectos, reembolsos y devoluciones se encuentran
            detalladas en nuestra{" "}
            <Link
              href="/cancelaciones-y-devoluciones"
              style={linkStyle}
            >
              Política de Cancelaciones y Devoluciones
            </Link>
            , la cual forma parte integral de estos Términos y
            Condiciones.
          </p>
        </Seccion>

        <Seccion titulo="9. Mensajería y WhatsApp">
          <p>
            Algunos planes pueden incluir confirmaciones,
            recordatorios y otras comunicaciones relacionadas con citas
            mediante WhatsApp u otros canales.
          </p>

          <p>
            El negocio es responsable de utilizar estas herramientas
            únicamente para comunicaciones legítimas relacionadas con
            sus clientes y de contar con la autorización o base
            correspondiente cuando resulte necesaria.
          </p>

          <p>
            El funcionamiento de estas funciones puede depender de
            servicios de terceros y de sus condiciones técnicas,
            comerciales y de disponibilidad.
          </p>
        </Seccion>

        <Seccion titulo="10. Información de clientes">
          <p>
            Los negocios pueden registrar información necesaria para
            administrar sus citas, como nombres, teléfonos, WhatsApp,
            direcciones de correo electrónico, servicios solicitados y
            datos relacionados con las reservas.
          </p>

          <p>
            Cada negocio es responsable de utilizar la información de
            sus clientes de manera legítima, proporcional y relacionada
            con la prestación de sus servicios.
          </p>

          <p>
            El tratamiento de datos personales realizado a través de
            CitaTica se regula además por nuestra{" "}
            <Link href="/privacidad" style={linkStyle}>
              Política de Privacidad
            </Link>
            .
          </p>
        </Seccion>

        <Seccion titulo="11. Usos prohibidos">
          <p>No está permitido utilizar CitaTica para:</p>

          <ul style={listaStyle}>
            <li>realizar actividades ilícitas;</li>
            <li>enviar comunicaciones abusivas o no autorizadas;</li>
            <li>acceder a información de otros usuarios sin permiso;</li>
            <li>intentar vulnerar la seguridad de la plataforma;</li>
            <li>introducir código malicioso;</li>
            <li>
              utilizar la plataforma de manera que afecte su
              funcionamiento o el de otros usuarios;
            </li>
            <li>
              utilizar información personal para fines distintos de
              aquellos legítimamente relacionados con el servicio.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="12. Disponibilidad del servicio">
          <p>
            CitaTica procurará mantener la plataforma disponible y
            operativa. Sin embargo, pueden producirse interrupciones
            temporales por mantenimiento, actualizaciones, fallos de
            proveedores, problemas de conectividad, situaciones de
            fuerza mayor u otras causas técnicas.
          </p>

          <p>
            Cuando sea razonablemente posible, CitaTica procurará
            comunicar mantenimientos programados o incidencias
            relevantes.
          </p>
        </Seccion>

        <Seccion titulo="13. Servicios de terceros">
          <p>
            CitaTica puede utilizar servicios tecnológicos de terceros
            para funciones como alojamiento, autenticación,
            almacenamiento, correo electrónico, mensajería,
            procesamiento de pagos u otras funcionalidades.
          </p>

          <p>
            Algunas funciones pueden estar sujetas adicionalmente a
            los términos, políticas y disponibilidad de dichos
            proveedores.
          </p>
        </Seccion>

        <Seccion titulo="14. Cancelación y cierre de cuenta">
          <p>
            El usuario podrá solicitar la cancelación de su suscripción
            o el cierre de su cuenta conforme a los mecanismos
            disponibles en CitaTica.
          </p>

          <p>
            La cancelación de una suscripción de pago no implica
            necesariamente la eliminación inmediata de la cuenta o de
            los datos asociados al negocio.
          </p>

          <p>
            Las solicitudes relacionadas con eliminación de datos se
            atenderán conforme a la Política de Privacidad y a la
            legislación aplicable.
          </p>
        </Seccion>

        <Seccion titulo="15. Suspensión">
          <p>
            CitaTica podrá suspender temporalmente una cuenta cuando
            exista uso abusivo, fraude, riesgo de seguridad,
            incumplimiento de estos términos o actividades que puedan
            afectar a otros usuarios o a la plataforma.
          </p>
        </Seccion>

        <Seccion titulo="16. Responsabilidad del negocio">
          <p>
            CitaTica proporciona herramientas tecnológicas para la
            gestión de citas y negocios, pero no participa en la
            prestación del servicio que cada negocio ofrece a sus
            clientes.
          </p>

          <p>
            Cada negocio es responsable de sus precios, horarios,
            disponibilidad, servicios, profesionales, atención,
            cancelaciones, cumplimiento de citas y demás relaciones con
            sus clientes.
          </p>
        </Seccion>

        <Seccion titulo="17. Propiedad intelectual">
          <p>
            El nombre CitaTica, su identidad gráfica, software, diseño,
            funcionalidades, documentación y demás elementos propios de
            la plataforma se encuentran protegidos por la legislación
            aplicable.
          </p>

          <p>
            Cada negocio conserva los derechos que le correspondan
            sobre sus propias marcas, logos, fotografías y contenidos.
          </p>
        </Seccion>

        <Seccion titulo="18. Protección de datos personales">
          <p>
            CitaTica tratará los datos personales conforme a su{" "}
            <Link href="/privacidad" style={linkStyle}>
              Política de Privacidad
            </Link>{" "}
            y a la legislación costarricense aplicable.
          </p>

          <p>
            Los usuarios deberán utilizar los datos personales a los
            que tengan acceso únicamente para fines legítimos
            relacionados con la operación de su negocio y la gestión de
            citas.
          </p>
        </Seccion>

        <Seccion titulo="19. Modificaciones de estos términos">
          <p>
            Estos términos pueden ser actualizados para reflejar
            cambios en CitaTica, nuevas funcionalidades, cambios
            legales, técnicos o comerciales.
          </p>

          <p>
            La fecha de la última actualización se mostrará al inicio
            de este documento. Cuando corresponda, CitaTica podrá
            solicitar al usuario una nueva aceptación de las
            condiciones actualizadas.
          </p>
        </Seccion>

        <Seccion titulo="20. Legislación aplicable">
          <p>
            Estos términos se interpretarán conforme al ordenamiento
            jurídico de la República de Costa Rica, sin perjuicio de
            los derechos reconocidos por la normativa de protección al
            consumidor y de protección de datos personales.
          </p>
        </Seccion>

        <Seccion titulo="21. Contacto">
          <p>
            Para consultas sobre estos términos, privacidad,
            cancelaciones, cuenta o servicio al cliente, el usuario
            podrá utilizar los medios oficiales de contacto publicados
            por CitaTica.
          </p>
        </Seccion>

        <div style={legalNavStyle}>
          <h2
            style={{
              margin: "0 0 14px",
              color: "#042A6B",
              fontSize: "18px",
            }}
          >
            Documentos relacionados
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <Link href="/privacidad" style={legalButtonStyle}>
              Política de Privacidad
            </Link>

            <Link
              href="/cancelaciones-y-devoluciones"
              style={legalButtonStyle}
            >
              Cancelaciones y Devoluciones
            </Link>
          </div>
        </div>

        <div style={avisoStyle}>
          <strong style={{ color: "#042A6B" }}>
            Nota importante:
          </strong>{" "}
          este documento constituye la base contractual de CitaTica.
          Antes de iniciar el cobro de suscripciones a terceros, es
          recomendable realizar una revisión jurídica profesional de la
          versión final, especialmente de las condiciones de pago,
          facturación, retracto y protección de datos.
        </div>
      </article>
    </main>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: "34px" }}>
      <h2
        style={{
          color: "#042A6B",
          fontSize: "21px",
          marginBottom: "12px",
        }}
      >
        {titulo}
      </h2>

      <div
        style={{
          lineHeight: "1.75",
          fontSize: "15px",
          color: "#475467",
        }}
      >
        {children}
      </div>
    </section>
  );
}

const actualizacionStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "14px",
};

const identificacionStyle: React.CSSProperties = {
  marginTop: "28px",
  padding: "20px",
  borderRadius: "15px",
  background: "#EEF7FF",
  border: "1px solid #D7E9FF",
  color: "#475467",
  lineHeight: "1.65",
};

const listaStyle: React.CSSProperties = {
  paddingLeft: "22px",
  lineHeight: "1.8",
};

const linkStyle: React.CSSProperties = {
  color: "#0066FF",
  fontWeight: "700",
  textDecoration: "none",
};

const legalNavStyle: React.CSSProperties = {
  marginTop: "48px",
  padding: "22px",
  borderRadius: "16px",
  background: "#FFFFFF",
  border: "1px solid #D7E9FF",
};

const legalButtonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "11px 15px",
  borderRadius: "10px",
  background: "#EEF7FF",
  color: "#0066FF",
  fontWeight: "700",
  textDecoration: "none",
  fontSize: "14px",
};

const avisoStyle: React.CSSProperties = {
  marginTop: "28px",
  padding: "20px",
  borderRadius: "15px",
  background: "#FFF9E8",
  border: "1px solid #F5D785",
  color: "#6B5B1E",
  lineHeight: "1.65",
  fontSize: "14px",
};
