import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type NotificationType =
  | "CONFIRMATION"
  | "REMINDER_24H"
  | "REMINDER_2H"
  | "APPOINTMENT_CHANGED"
  | "CANCELLATION";

type Channel = "EMAIL" | "WHATSAPP";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: timezone || "America/Costa_Rica",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: timezone || "America/Costa_Rica",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function subjectFor(type: NotificationType, businessName: string) {
  switch (type) {
    case "CONFIRMATION":
      return `Cita confirmada en ${businessName}`;
    case "REMINDER_24H":
      return `Recordatorio de su cita en ${businessName}`;
    case "REMINDER_2H":
      return `Su cita es dentro de 2 horas`;
    case "APPOINTMENT_CHANGED":
      return `Su cita en ${businessName} fue actualizada`;
    case "CANCELLATION":
      return `Su cita en ${businessName} fue cancelada`;
  }
}

function introFor(type: NotificationType) {
  switch (type) {
    case "CONFIRMATION":
      return "Su cita fue registrada correctamente.";
    case "REMINDER_24H":
      return "Le recordamos que tiene una cita programada para mañana.";
    case "REMINDER_2H":
      return "Le recordamos que su cita es dentro de aproximadamente 2 horas.";
    case "APPOINTMENT_CHANGED":
      return "Los datos de su cita fueron actualizados.";
    case "CANCELLATION":
      return "Su cita fue cancelada.";
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // Costa Rica: si se almacenó un número local de 8 dígitos, agregamos 506.
  if (digits.length === 8) return `506${digits}`;

  return digits;
}

function whatsappTemplateName(type: NotificationType) {
  const map: Record<NotificationType, string | undefined> = {
    CONFIRMATION: process.env.WHATSAPP_TEMPLATE_CONFIRMATION,
    REMINDER_24H: process.env.WHATSAPP_TEMPLATE_REMINDER_24H,
    REMINDER_2H: process.env.WHATSAPP_TEMPLATE_REMINDER_2H,
    APPOINTMENT_CHANGED: process.env.WHATSAPP_TEMPLATE_APPOINTMENT_CHANGED,
    CANCELLATION: process.env.WHATSAPP_TEMPLATE_CANCELLATION,
  };

  return map[type];
}

async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ||
    "CitaTica <notificaciones@citatica.com>";

  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Resend respondió ${response.status}.`
    );
  }

  return {
    provider: "RESEND",
    messageId: data?.id ? String(data.id) : null,
  };
}

async function sendWhatsapp(args: {
  to: string;
  type: NotificationType;
  clientName: string;
  businessName: string;
  date: string;
  time: string;
  serviceName: string;
  professionalName: string;
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = whatsappTemplateName(args.type);
  const languageCode =
    process.env.WHATSAPP_TEMPLATE_LANGUAGE || "es";
  const graphVersion =
    process.env.WHATSAPP_GRAPH_VERSION || "v25.0";

  if (!token || !phoneNumberId) {
    throw new Error(
      "Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID."
    );
  }

  if (!templateName) {
    throw new Error(
      `Falta la plantilla de WhatsApp para ${args.type}.`
    );
  }

  const to = normalizeWhatsapp(args.to);

  if (!to) {
    throw new Error("El número de WhatsApp no es válido.");
  }

  /*
   * Las plantillas de Meta usan 6 variables de cuerpo,
   * en este orden:
   * 1 nombre del cliente
   * 2 nombre del negocio
   * 3 fecha
   * 4 hora
   * 5 servicio
   * 6 profesional
   */
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: args.clientName },
                { type: "text", text: args.businessName },
                { type: "text", text: args.date },
                { type: "text", text: args.time },
                { type: "text", text: args.serviceName },
                { type: "text", text: args.professionalName },
              ],
            },
          ],
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `WhatsApp respondió ${response.status}.`
    );
  }

  const messageId =
    data?.messages?.[0]?.id != null
      ? String(data.messages[0].id)
      : null;

  return {
    provider: "META_WHATSAPP",
    messageId,
  };
}

async function whatsappAllowedForBusiness(businessId: string) {
  const { data, error } = await supabaseAdmin.rpc(
    "get_effective_business_plan",
    {
      p_business_id: businessId,
    }
  );

  if (error) {
    throw new Error(
      `No se pudo validar el plan del negocio: ${error.message}`
    );
  }

  const plan = Array.isArray(data) ? data[0] : data;
  return Boolean(plan?.whatsapp_enabled);
}

function emailHtml(args: {
  type: NotificationType;
  clientName: string;
  businessName: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  bookingUrl: string | null;
}) {
  const intro = introFor(args.type);

  const button = args.bookingUrl
    ? `<a href="${escapeHtml(
        args.bookingUrl
      )}" style="display:inline-block;background:#0066ff;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;margin-top:18px;">Ver página de reservas</a>`
    : "";

  return `
    <div style="background:#f5f7fb;padding:28px;font-family:Arial,sans-serif;color:#101828;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;padding:30px;border:1px solid #e6eef8;">
        <div style="font-size:24px;font-weight:800;color:#042a6b;margin-bottom:20px;">CitaTica</div>
        <p style="font-size:16px;line-height:1.6;margin:0 0 10px;">
          Hola <strong>${escapeHtml(args.clientName)}</strong>,
        </p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 22px;">
          ${escapeHtml(intro)}
        </p>

        <div style="background:#f8fafc;border-radius:14px;padding:18px;line-height:1.8;">
          <div><strong>Negocio:</strong> ${escapeHtml(args.businessName)}</div>
          <div><strong>Servicio:</strong> ${escapeHtml(args.serviceName)}</div>
          <div><strong>Profesional:</strong> ${escapeHtml(args.professionalName)}</div>
          <div><strong>Fecha:</strong> ${escapeHtml(args.date)}</div>
          <div><strong>Hora:</strong> ${escapeHtml(args.time)}</div>
        </div>

        ${button}

        <p style="color:#667085;font-size:12px;line-height:1.5;margin-top:28px;">
          Este mensaje fue enviado automáticamente por CitaTica.
        </p>
      </div>
    </div>
  `;
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (
    !expectedSecret ||
    authorization !== `Bearer ${expectedSecret}`
  ) {
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 401 }
    );
  }

  const now = new Date().toISOString();

  const { data: notifications, error } = await supabaseAdmin
    .from("notifications")
    .select(`
      id,
      business_id,
      appointment_id,
      channel,
      recipient,
      notification_type,
      scheduled_at,
      attempts,
      appointments (
        id,
        start_at,
        end_at,
        status,
        clients (
          first_name,
          last_name,
          email,
          phone,
          whatsapp
        ),
        professionals (
          name
        ),
        appointment_services (
          service_name_snapshot
        )
      ),
      businesses (
        business_name,
        slug,
        timezone
      )
    `)
    .eq("status", "PENDING")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const results: Array<Record<string, unknown>> = [];

  for (const notification of notifications || []) {
    const appointment = asOne<any>(notification.appointments);
    const business = asOne<any>(notification.businesses);
    const client = asOne<any>(appointment?.clients);
    const professional = asOne<any>(appointment?.professionals);
    const service = Array.isArray(appointment?.appointment_services)
      ? appointment.appointment_services[0] ?? null
      : appointment?.appointment_services ?? null;

    const attempts = Number(notification.attempts || 0);
    const notificationType =
      notification.notification_type as NotificationType;
    const channel = notification.channel as Channel;

    try {
      if (!appointment || !business || !client) {
        throw new Error(
          "No se encontraron todos los datos de la cita."
        );
      }

      if (
        ["CANCELLED", "NO_SHOW", "COMPLETED"].includes(
          appointment.status
        ) &&
        !["CANCELLATION"].includes(notificationType)
      ) {
        await supabaseAdmin
          .from("notifications")
          .update({
            status: "CANCELLED",
            error_message:
              "La cita ya no requiere esta notificación.",
          })
          .eq("id", notification.id);

        results.push({
          id: notification.id,
          status: "CANCELLED",
        });
        continue;
      }

      const clientName =
        [client.first_name, client.last_name]
          .filter(Boolean)
          .join(" ") || "Cliente";

      const businessName =
        business.business_name || "su negocio";
      const serviceName =
        service?.service_name_snapshot || "Servicio";
      const professionalName =
        professional?.name || "Profesional";
      const timezone =
        business.timezone || "America/Costa_Rica";
      const date = formatDate(
        appointment.start_at,
        timezone
      );
      const time = formatTime(
        appointment.start_at,
        timezone
      );

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://citatica.com";

      const bookingUrl = business.slug
        ? `${siteUrl.replace(/\/$/, "")}/reservar/${business.slug}`
        : null;

      let providerResult:
        | { provider: string; messageId: string | null }
        | undefined;

      if (channel === "EMAIL") {
        providerResult = await sendEmail({
          to: notification.recipient,
          subject: subjectFor(
            notificationType,
            businessName
          ),
          html: emailHtml({
            type: notificationType,
            clientName,
            businessName,
            serviceName,
            professionalName,
            date,
            time,
            bookingUrl,
          }),
        });
      } else if (channel === "WHATSAPP") {
        const allowed = await whatsappAllowedForBusiness(
          notification.business_id
        );

        if (!allowed) {
          await supabaseAdmin
            .from("notifications")
            .update({
              status: "SKIPPED_PLAN",
              error_message:
                "El plan actual no incluye WhatsApp.",
            })
            .eq("id", notification.id);

          results.push({
            id: notification.id,
            status: "SKIPPED_PLAN",
          });
          continue;
        }

        providerResult = await sendWhatsapp({
          to: notification.recipient,
          type: notificationType,
          clientName,
          businessName,
          date,
          time,
          serviceName,
          professionalName,
        });
      } else {
        throw new Error(
          `Canal no soportado: ${String(channel)}`
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("notifications")
        .update({
          status: "SENT",
          sent_at: new Date().toISOString(),
          provider: providerResult?.provider || null,
          provider_message_id:
            providerResult?.messageId || null,
          attempts: attempts + 1,
          last_attempt_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", notification.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      results.push({
        id: notification.id,
        status: "SENT",
        channel,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido.";

      const nextAttempts = attempts + 1;
      const finalFailure = nextAttempts >= 3;

      await supabaseAdmin
        .from("notifications")
        .update({
          status: finalFailure ? "FAILED" : "PENDING",
          attempts: nextAttempts,
          last_attempt_at: new Date().toISOString(),
          error_message: message,
        })
        .eq("id", notification.id);

      results.push({
        id: notification.id,
        status: finalFailure ? "FAILED" : "RETRY",
        error: message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
