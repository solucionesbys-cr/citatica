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

export async function GET(request: NextRequest) {
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

    const [
      usuariosResultado,
      miembrosResultado,
      negociosResultado,
      adminsResultado,
    ] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      }),

      supabaseAdmin
        .from("business_members")
        .select("*"),

      supabaseAdmin
        .from("businesses")
        .select("id, business_name, slug"),

      supabaseAdmin
        .from("admin_users")
        .select("user_id, role, is_active"),
    ]);

    if (usuariosResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudieron cargar los usuarios: ${usuariosResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    if (miembrosResultado.error) {
      return NextResponse.json(
        {
          error: `No se pudieron cargar las membresías: ${miembrosResultado.error.message}`,
        },
        { status: 500 }
      );
    }

    const usuariosAuth = usuariosResultado.data.users || [];
    const miembros = miembrosResultado.data || [];
    const negocios = negociosResultado.data || [];
    const admins = adminsResultado.data || [];

    const negocioPorId = new Map(
      negocios.map((negocio) => [negocio.id, negocio])
    );

    const adminPorUsuario = new Map(
      admins.map((item) => [item.user_id, item])
    );

    const membresiasPorUsuario = new Map<string, any[]>();

    for (const miembro of miembros) {
      const lista = membresiasPorUsuario.get(miembro.user_id) || [];
      lista.push(miembro);
      membresiasPorUsuario.set(miembro.user_id, lista);
    }

    const usuarios = usuariosAuth.map((usuario) => {
      const membresias = membresiasPorUsuario.get(usuario.id) || [];
      const adminRegistro = adminPorUsuario.get(usuario.id);

      const negociosUsuario = membresias.map((membresia) => {
        const negocio = negocioPorId.get(membresia.business_id);

        return {
          business_id: membresia.business_id,
          business_name:
            negocio?.business_name || "Negocio no disponible",
          business_slug: negocio?.slug || null,
          member_role:
            membresia.role ||
            membresia.member_role ||
            membresia.business_role ||
            "MIEMBRO",
          membership_created_at:
            membresia.created_at || null,
        };
      });

      const nombreMetadata =
        usuario.user_metadata?.full_name ||
        usuario.user_metadata?.name ||
        usuario.user_metadata?.display_name ||
        null;

      return {
        id: usuario.id,
        email: usuario.email || "",
        phone: usuario.phone || null,
        name: nombreMetadata,
        created_at: usuario.created_at,
        last_sign_in_at: usuario.last_sign_in_at || null,
        email_confirmed_at: usuario.email_confirmed_at || null,
        provider:
          usuario.app_metadata?.provider ||
          (Array.isArray(usuario.app_metadata?.providers)
            ? usuario.app_metadata.providers[0]
            : null) ||
          "email",
        businesses: negociosUsuario,
        is_superadmin:
          adminRegistro?.role === "SUPERADMIN" &&
          adminRegistro?.is_active === true,
        admin_role: adminRegistro?.role || null,
        admin_active: adminRegistro?.is_active || false,
      };
    });

    const resumen = {
      total: usuarios.length,
      conNegocio: usuarios.filter(
        (usuario) => usuario.businesses.length > 0
      ).length,
      sinNegocio: usuarios.filter(
        (usuario) => usuario.businesses.length === 0
      ).length,
      superadmins: usuarios.filter(
        (usuario) => usuario.is_superadmin
      ).length,
      confirmados: usuarios.filter(
        (usuario) => usuario.email_confirmed_at
      ).length,
    };

    return NextResponse.json({
      ok: true,
      usuarios,
      resumen,
    });
  } catch (error) {
    console.error("ADMIN USUARIOS ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al cargar los usuarios.",
      },
      { status: 500 }
    );
  }
}
