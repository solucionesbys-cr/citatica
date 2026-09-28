"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function PruebaSupabase() {
  const [estado, setEstado] = useState("Probando conexión...");

  useEffect(() => {
    async function probarConexion() {
      try {
        const supabase = createClient();

        const { error } = await supabase.auth.getSession();

        if (error) {
          setEstado("❌ Error: " + error.message);
          return;
        }

        setEstado("✅ CitaTica está conectado correctamente con Supabase");
      } catch (error) {
        setEstado(
          "❌ Error de conexión: " +
            (error instanceof Error ? error.message : "Error desconocido")
        );
      }
    }

    probarConexion();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>CitaTica</h1>
        <h2>Prueba de conexión con Supabase</h2>
        <p>{estado}</p>
      </div>
    </main>
  );
}