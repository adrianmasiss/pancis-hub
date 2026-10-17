/**
 * El nombre de usuario: la regla, en un solo sitio.
 *
 * La misma expresion vive tambien en la base (`profiles_username_format`), y
 * eso es a proposito: el formulario da el mensaje y la base da la garantia. Si
 * un dia cambia, hay que cambiarla en los dos, y por eso se escribe aqui igual
 * que alla, caracter por caracter.
 *
 *   3 a 20 caracteres, minusculas, digitos, punto y guion bajo, y el primero
 *   no puede ser signo.
 *
 * Sin arroba: es lo que permite decidir, mirando lo que se escribio, si quien
 * entra puso un correo o un usuario, sin preguntarselo ni obligarle a elegir
 * una pestaña.
 */
export const USERNAME_REGEX = /^[a-z0-9][a-z0-9._]{2,19}$/;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

/** Minusculas y sin espacios alrededor: como se guarda y como se compara. */
export function normalizarUsuario(valor: string): string {
  return valor.trim().toLowerCase();
}

export function esUsuarioValido(valor: string): boolean {
  return USERNAME_REGEX.test(normalizarUsuario(valor));
}

/**
 * Que escribio quien entra. La arroba decide, porque el formato de usuario no
 * la admite: si hay arroba solo puede ser un intento de correo, y tratarlo
 * como usuario daria "usuario no encontrado" donde lo honesto es "ese correo o
 * esa contraseña no son".
 */
export function pareceCorreo(identificador: string): boolean {
  return identificador.includes("@");
}
