export default function ConfirmadoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "45px 40px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "#dcfce7",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "34px",
            margin: "0 auto 22px",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontSize: "32px",
            marginBottom: "12px",
            color: "#111827",
          }}
        >
          ¡Cuenta confirmada!
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: "16px",
            lineHeight: "1.6",
            marginBottom: "30px",
          }}
        >
          Su correo electrónico fue confirmado correctamente.
          Ya puede ingresar a CitaTica.
        </p>

        <a
          href="/login"
          style={{
            display: "block",
            padding: "14px",
            borderRadius: "10px",
            background: "#111827",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Iniciar sesión
        </a>
      </div>
    </main>
  );
}