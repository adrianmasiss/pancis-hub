/**
 * «No cerrar sesión» al entrar.
 *
 * Supabase escribe sus cookies con 400 días de vida siempre, así que el
 * interruptor no tenía efecto: desmarcado, la sesión seguía viva al cerrar el
 * navegador. Ahora el login deja esta marca cuando va DESMARCADO, y los tres
 * clientes (servidor, proxy y navegador) quitan la caducidad a las cookies de
 * auth mientras exista: quedan como cookies de sesión y mueren con el
 * navegador (o con la app instalada al cerrarla del todo).
 *
 * Marcado no deja marca: es el comportamiento de siempre, y el proxy renueva
 * las cookies desde el servidor en cada visita —en iOS, las que escribe
 * JavaScript caducan a los 7 días; las del servidor no—.
 */
export const REMEMBER_COOKIE = "pc-sin-recordar";

type CookieOptions = { maxAge?: number; expires?: Date };

/** Las opciones con las que se escribe una cookie de auth. */
export function authCookieOptions<T extends CookieOptions>(
  options: T,
  remember: boolean,
): T {
  // `maxAge: 0` es un borrado: se respeta siempre.
  if (remember || options.maxAge === 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
