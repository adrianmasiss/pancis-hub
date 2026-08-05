/**
 * Contratos de la capa de herramientas del copiloto
 * (docs/spec/docs/08_AI_COPILOT_ARCHITECTURE.md).
 *
 * REGLA CRITICA del documento:
 *
 *   "El modelo decide que herramienta usar; la herramienta calcula; el modelo
 *    explica."
 *
 * De ahi salen las tres decisiones de diseno de este modulo:
 *
 * 1. NINGUNA herramienta hace aritmetica propia. Todas envuelven motores
 *    determinsticos que ya existen y ya tienen pruebas. Si un numero sale mal,
 *    sale mal en un sitio y se arregla en un sitio.
 *
 * 2. Las herramientas de ESCRITURA no escriben. Devuelven una propuesta que la
 *    interfaz tiene que confirmar. No es una convencion que el modelo pueda
 *    saltarse: la funcion no recibe cliente de base de datos, asi que aunque el
 *    modelo decidiera aplicar algo por su cuenta, no tiene con que. Es RF-013
 *    garantizado por construccion.
 *
 * 3. Todo resultado puede llevar FUENTES. Es lo que separa a este copiloto de
 *    un chatbot: cuando una cifra viene de `formula_versions`, el usuario puede
 *    ver de donde sale y con que grado de evidencia.
 */

/** Referencia mostrable al usuario, resuelta desde `research_sources`. */
export type ToolSource = {
  title: string;
  year: number | null;
  /** PMID, DOI o el identificador que exista. */
  identifier: string | null;
  evidenceGrade: "A" | "B" | "C" | "D" | null;
  /** Poblacion estudiada. Se muestra siempre que exista: importa. */
  population: string | null;
  limitations: string | null;
  /**
   * Papel de la fuente en la cifra: `sustenta`, `matiza`, `contradice`. Sin
   * esto, un metaanalisis que MATIZA el numero se lee como si lo apoyara, que
   * es exactamente lo contrario de lo que dice el registro.
   */
  role: string | null;
  /**
   * Nota escrita al aprobar el claim: por que esta fuente esta en esta cifra.
   * Suele contener el matiz que solo aparece en el texto completo del estudio.
   */
  note: string | null;
  /**
   * true cuando el valor es una decision de producto y no una afirmacion
   * cientifica. La interfaz debe dejar de presentarlo como ciencia.
   */
  isProductParameter: boolean;
};

/**
 * Resultado de una herramienta de LECTURA. Puede consultarse libremente: no
 * modifica nada del usuario.
 */
export type ReadResult<T> = {
  kind: "read";
  data: T;
  sources?: ToolSource[];
  /**
   * Lo que la herramienta NO puede afirmar. Se rellena cuando faltan datos
   * medidos: es preferible decirlo a devolver una estimacion silenciosa.
   */
  caveats?: string[];
};

/**
 * Resultado de una herramienta de ESCRITURA: una propuesta, nunca un hecho.
 *
 * `apply` no vive aqui. La interfaz recibe la propuesta, la muestra, y si el
 * usuario confirma llama a la server action correspondiente, que es la unica
 * que toca la base.
 */
export type ProposalResult<T> = {
  kind: "proposal";
  /** Que se propone, en lenguaje que la interfaz pueda mostrar tal cual. */
  summary: string;
  /** Datos estructurados para que la interfaz arme la confirmacion. */
  proposal: T;
  /** Server action que aplicaria esto, si el usuario confirma. */
  appliedBy: string;
  sources?: ToolSource[];
  caveats?: string[];
};

export type ToolResult<T> = ReadResult<T> | ProposalResult<T>;

export function readResult<T>(
  data: T,
  extra?: { sources?: ToolSource[]; caveats?: string[] },
): ReadResult<T> {
  return { kind: "read", data, ...extra };
}

export function proposalResult<T>(
  summary: string,
  proposal: T,
  appliedBy: string,
  extra?: { sources?: ToolSource[]; caveats?: string[] },
): ProposalResult<T> {
  return { kind: "proposal", summary, proposal, appliedBy, ...extra };
}

/** true si el resultado requiere confirmacion del usuario antes de aplicarse. */
export function requiresConfirmation(
  result: ToolResult<unknown>,
): result is ProposalResult<unknown> {
  return result.kind === "proposal";
}
