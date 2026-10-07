import { Suspense } from "react";
import PagoResultadoClient from "./PagoResultadoClient";

export default function PagoResultadoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl border border-slate-200 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Verificando pago...
            </h1>
          </div>
        </main>
      }
    >
      <PagoResultadoClient />
    </Suspense>
  );
}