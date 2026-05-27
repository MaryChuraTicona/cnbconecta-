import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

type RolUsuario =
  | "admin"
  | "pastor_distrital"
  | "comunicador_distrital"
  | "comunicador_iglesia";

function obtenerPermisosPorRol(rol: RolUsuario) {
  if (rol === "admin") {
    return {
      usuarios: true,
      iglesias: true,
      ministerios: true,
      directorio: true,
      anuncios: true,
      aprobarAnuncios: true,
      envios: true,
      historial: true,
      evidencias: true,
      poa: true,
      reportes: true,
    };
  }

  if (rol === "pastor_distrital") {
    return {
      usuarios: false,
      iglesias: false,
      ministerios: false,
      directorio: true,
      anuncios: true,
      aprobarAnuncios: true,
      envios: false,
      historial: true,
      evidencias: true,
      poa: true,
      reportes: true,
    };
  }

  if (rol === "comunicador_distrital") {
    return {
      usuarios: false,
      iglesias: true,
      ministerios: true,
      directorio: true,
      anuncios: true,
      aprobarAnuncios: false,
      envios: true,
      historial: true,
      evidencias: true,
      poa: true,
      reportes: true,
    };
  }

  return {
    usuarios: false,
    iglesias: false,
    ministerios: false,
    directorio: false,
    anuncios: true,
    aprobarAnuncios: false,
    envios: false,
    historial: false,
    evidencias: true,
    poa: true,
    reportes: false,
  };
}

function formatearCargo(rol: RolUsuario) {
  const cargos: Record<RolUsuario, string> = {
    admin: "Administrador general",
    pastor_distrital: "Pastor distrital",
    comunicador_distrital: "Comunicador distrital",
    comunicador_iglesia: "Comunicador de iglesia",
  };

  return cargos[rol];
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    const adminDoc = await adminDb
      .collection("usuarios")
      .doc(decodedToken.uid)
      .get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: "Usuario sin perfil en Firestore" },
        { status: 403 }
      );
    }

    const adminData = adminDoc.data();

    if (adminData?.rol !== "admin") {
      return NextResponse.json(
        { error: "Solo administradores pueden crear usuarios" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      nombre,
      email,
      password,
      rol,
      iglesiaId,
      iglesiaNombre,
    }: {
      nombre: string;
      email: string;
      password: string;
      rol: RolUsuario;
      iglesiaId?: string | null;
      iglesiaNombre?: string | null;
    } = body;

    const rolesPermitidos: RolUsuario[] = [
      "admin",
      "pastor_distrital",
      "comunicador_distrital",
      "comunicador_iglesia",
    ];

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (!rolesPermitidos.includes(rol)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    if (rol === "comunicador_iglesia" && !iglesiaId) {
      return NextResponse.json(
        { error: "El comunicador de iglesia debe tener una iglesia asignada" },
        { status: 400 }
      );
    }

    let iglesiaFinalId: string | null = null;
    let iglesiaFinalNombre = "Distrito CNB";

    if (rol === "comunicador_iglesia") {
      iglesiaFinalId = iglesiaId || null;
      iglesiaFinalNombre = iglesiaNombre || "Sin iglesia";
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: nombre,
      disabled: false,
    });

    const permisos = obtenerPermisosPorRol(rol);
    const cargo = formatearCargo(rol);

    await adminDb.collection("usuarios").doc(userRecord.uid).set({
      uid: userRecord.uid,
      nombre,
      email,
      rol,
      cargo,
      iglesiaId: iglesiaFinalId,
      iglesiaNombre: iglesiaFinalNombre,
      permisos,
      activo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      creadoPor: decodedToken.uid,
    });

    return NextResponse.json({
      ok: true,
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.log("Error creando usuario:", error);

    return NextResponse.json(
      {
        error: error.message || "Error al crear usuario",
      },
      { status: 500 }
    );
  }
}