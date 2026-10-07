"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type EstadoPago =
  | "LOADING"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "NOT_FOUND"
  | "ERROR";

export default function PagoResultadoClient() {
  const searchParams = useSearchParams();

  const greenpay = searchParams.get("greenpay");
  const orderReference = searchParams.get("orderReference");

  const [estado, setEstado] =
    useState<EstadoPago>("LOADING");

  const [plan, setPlan] =
    useState<string | null>(null);

  const [fechaFin, setFechaFin] =
    useState<string | null>(null);

  useEffect(() => {
    if (!greenpay || !orderReference) {
      setEstado("NOT_FOUND");
      return;
    }

    let intentos = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelado = false;

    const consultarPago = async () => {
      try {
        intentos++;

        const respuesta = await fetch(
          `/api/greenpay/payment-status?orderReference=${encodeURIComponent(
            orderReference
          )}`,
          {
            cache: "no-store",
          }
        );

        const datos = await respuesta.json();

        if (cancelado) {
          return;
        }

        if (!respuesta.ok) {
          setEstado("ERROR");
          return;
        }

        if (datos.subscription?.plan_code) {
          setPlan(datos.subscription.plan_code);
        }

        if (datos.subscription?.subscription_ends_at) {
          setFechaFin(
            datos.subscription.subscription_ends_at
          );
        }

        if (datos.status === "PAID") {
          setEstado("PAID");
          return;
        }

        if (datos.status === "FAILED") {
          setEstado("FAILED");
          return;
        }

        if (datos.status === "NOT_FOUND") {
          /*
           * Puede ocurrir por unos segundos si el usuario
           * regresa desde GreenPay antes de que el webhook
           * termine de actualizar Supabase.
           */
          setEstado("PENDING");

          if (intentos < 10) {
            timer = setTimeout(
              consultarPago,
              3000
            );
          }

          return;
        }

        setEstado("PENDING");

        if (intentos < 10) {
          timer = setTimeout(
            consultarPago,
            3000
          );
        }
      } catch (error) {
        console.error(
          "Error consultando estado del pago:",
          error
        );

        if (!cancelado) {
          setEstado("ERROR");
        }
      }
    };

    consultarPago();

    return () => {
      cancelado = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [greenpay, orderReference]);

  const formatearFecha = (fecha: string) => {
    return new Intl.DateTimeFormat("es-CR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(fecha));
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl border border-slate-200">

        {estado === "LOADING" ||
        estado === "PENDING" ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>

            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Verificando pago
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Estamos confirmando tu pago
            </h1>

            <p className="mt-4 text-slate-600">
              GreenPay ya devolvió la respuesta a CitaTica.
              Estamos verificando la transacción antes de
              activar o actualizar tu plan.
            </p>

            <p className="mt-3 text-sm text-slate-500">
              Esto normalmente tarda solo unos segundos.
            </p>
          </div>
        ) : null}

        {estado === "PAID" ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>

            <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
              Pago confirmado
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              ¡Tu plan ya está activo! 🎉
            </h1>

            {plan ? (
              <p className="mt-4 text-lg text-slate-700">
                Plan{" "}
                <span className="font-semibold capitalize">
                  {plan.toLowerCase()}
                </span>
              </p>
            ) : null}

            {fechaFin ? (
              <p className="mt-2 text-slate-600">
                Próxima renovación:{" "}
                <span className="font-semibold">
                  {formatearFecha(fechaFin)}
                </span>
              </p>
            ) : null}

            <p className="mt-5 text-slate-600">
              Ya puedes utilizar las funciones incluidas
              en tu nuevo plan de CitaTica.
            </p>

            <Link
              href="/panel"
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Ir a mi panel
            </Link>
          </div>
        ) : null}

        {estado === "FAILED" ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
              ×
            </div>

            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
              Pago no procesado
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              No pudimos completar el pago
            </h1>

            <p className="mt-4 text-slate-600">
              La transacción no fue aprobada. Puedes
              intentarlo nuevamente desde la sección de
              planes.
            </p>

            <Link
              href="/planes"
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Intentar nuevamente
            </Link>
          </div>
        ) : null}

        {estado === "NOT_FOUND" ||
        estado === "ERROR" ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              No pudimos verificar el pago
            </h1>

            <p className="mt-4 text-slate-600">
              Puedes ingresar a tu panel y revisar si el
              plan ya fue actualizado.
            </p>

            <Link
              href="/panel"
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Ir a mi panel
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}