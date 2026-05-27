export type Permisos = {
  usuarios?: boolean;
  iglesias?: boolean;
  ministerios?: boolean;
  directorio?: boolean;
  anuncios?: boolean;
  aprobarAnuncios?: boolean;
  envios?: boolean;
  historial?: boolean;
  evidencias?: boolean;
  poa?: boolean;
  reportes?: boolean;
};

export function tienePermiso(
  usuario: any,
  permiso: keyof Permisos
) {
  if (!usuario) return false;

  if (usuario.activo === false) return false;

  if (usuario.rol === "admin") return true;

  return Boolean(usuario.permisos?.[permiso]);
}