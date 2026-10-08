import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida o vencida." },
        { status: 401 }
      );
    }

    const { data: admin, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("role", "SUPERADMIN")
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: "No tiene permisos de SUPERADMIN." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const businessId = String(body?.businessId || "").trim();
    const isPublished = Boolean(body?.isPublished);

    if (!businessId) {
      return NextResponse.json(
        { error: "Falta el identificador del negocio." },
        { status: 400 }
      );
    }

    const { data: negocio, error: negocioError } = await supabaseAdmin
      .from("businesses")
      .select("id, business_name")
      .eq("id", businessId)
      .maybeSingle();

    if (negocioError || !negocio) {
      return NextResponse.json(
        { error: "No se encontró el negocio." },
        { status: 404 }
      );
    }

    const { data: configuracionExistente, error: configuracionError } =
      await supabaseAdmin
        .from("business_settings")
        .select("business_id")
        .eq("business_id", businessId)
        .maybeSingle();

    if (
      configuracionError &&
      configuracionError.code !== "PGRST116"
    ) {
      return NextResponse.json(
        {
          error: `No se pudo consultar la configuración: ${configuracionError.message}`,
        },
        { status: 500 }
      );
    }

    if (configuracionExistente) {
      const { error: updateError } = await supabaseAdmin
        .from("business_settings")
        .update({
          is_published: isPublished,
        })
        .eq("business_id", businessId);

      if (updateError) {
        return NextResponse.json(
          {
            error: `No se pudo actualizar la publicación: ${updateError.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("business_settings")
        .insert({
          business_id: businessId,
          is_published: isPublished,
        });

      if (insertError) {
        return NextResponse.json(
          {
            error: `El negocio todavía no tiene una configuración válida: ${insertError.message}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      businessId,
      businessName: negocio.business_name,
      isPublished,
    });
  } catch (error) {
    console.error("ADMIN PUBLICACION ERROR:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado al actualizar el negocio." },
      { status: 500 }
    );
  }
}
