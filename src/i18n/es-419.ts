/**
 * Textos de la aplicacion en espanol latinoamericano (es-419).
 *
 * Unica fuente de verdad de strings visibles. La estructura por claves
 * permite migrar a una libreria de i18n (por ejemplo next-intl) sin
 * reescribir componentes: solo cambiaria el mecanismo de resolucion.
 */
export const messages = {
  app: {
    name: "Pancis Hub",
    tagline:
      "Nutricion, entrenamiento y seguimiento para recomposicion corporal",
    description:
      "Plataforma para mejorar la composicion corporal mediante nutricion, entrenamiento y seguimiento personalizado basado en evidencia cientifica.",
  },
  legal: {
    disclaimer:
      "Pancis Hub es una herramienta educativa y de seguimiento. No sustituye la evaluacion, el diagnostico ni el tratamiento de profesionales de la salud.",
  },
  nav: {
    home: "Inicio",
    nutrition: "Nutricion",
    recipes: "Recetas",
    training: "Entrenamiento",
    trainingShort: "Entrenar",
    progress: "Progreso",
    checkins: "Diario",
    academy: "Academia",
    assistant: "Asistente",
    settings: "Configuracion",
    more: "Mas",
    moreDescription: "Otras secciones de Pancis Hub",
  },
  common: {
    loading: "Cargando…",
    save: "Guardar",
    cancel: "Cancelar",
    continue: "Continuar",
    back: "Atras",
    confirm: "Confirmar",
    edit: "Editar",
    delete: "Eliminar",
    close: "Cerrar",
    retry: "Reintentar",
    optional: "Opcional",
    signOut: "Cerrar sesion",
    openMenu: "Abrir menu",
    mainNavigation: "Navegacion principal",
    themeToggle: "Cambiar tema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystem: "Sistema",
    genericError: "Ocurrio un error inesperado. Intenta de nuevo.",
  },
  emptyStates: {
    dashboard: {
      title: "Tu resumen aparecera aqui",
      description:
        "Cuando completes tu perfil y registres comidas, entrenamientos y mediciones, veras aqui tu dia de un vistazo.",
    },
    nutrition: {
      title: "Aun no hay plan nutricional",
      description:
        "Aqui veras tus comidas del dia, tus macros objetivo y lo que te falta por registrar.",
    },
    recipes: {
      title: "Aun no hay recetas",
      description:
        "Explora, crea y guarda recetas con sus macros calculados desde los ingredientes.",
    },
    training: {
      title: "Aun no hay rutinas",
      description:
        "Crea tu rutina, registra tus series y consulta tu historial de entrenamiento.",
    },
    progress: {
      title: "Aun no hay mediciones",
      description:
        "Registra tu peso y tus medidas para ver tendencias y promedios moviles.",
    },
    checkins: {
      title: "Aun no hay registros del diario",
      description:
        "Completa tu diario en menos de un minuto: sueno, hambre, energia, estres y mas.",
    },
    academy: {
      title: "Contenido educativo en camino",
      description:
        "Articulos basados en evidencia sobre nutricion, entrenamiento y recuperacion.",
    },
    assistant: {
      title: "Tu asistente contextual",
      description:
        "Preguntas como “no tengo arroz” o “dormi poco” tendran respuestas con contexto de tus datos.",
    },
    settings: {
      title: "Configuracion",
      description:
        "Aqui podras editar tu perfil, unidades, tema y preferencias.",
    },
  },
  errorState: {
    title: "Algo salio mal",
    description: "No pudimos cargar esta seccion. Intenta de nuevo.",
  },
} as const;

export type Messages = typeof messages;
