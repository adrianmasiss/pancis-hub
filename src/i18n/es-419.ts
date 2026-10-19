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
      "Nutrición, entrenamiento y seguimiento para recomposición corporal",
    description:
      "Plataforma para mejorar la composición corporal mediante nutrición, entrenamiento y seguimiento personalizado basado en evidencia cientifica.",
  },
  legal: {
    disclaimer:
      "Pancis Hub es una herramienta educativa y de seguimiento. No sustituye la evaluación, el diagnostico ni el tratamiento de profesionales de la salud.",
  },
  nav: {
    // "Hoy" y no "Inicio": la pantalla responde que comer, que llevas, que
    // queda y que entrenar HOY (doc 13). El nombre generico no decia nada.
    home: "Hoy",
    nutrition: "Nutrición",
    recipes: "Recetas",
    pantry: "Despensa",
    training: "Entrenamiento",
    trainingShort: "Entrenar",
    progress: "Progreso",
    history: "Historial",
    academy: "Academia",
    assistant: "Asistente",
    evidence: "Evidencia",
    settings: "Configuración",
    more: "Más",
    moreDescription: "Otras secciones de Pancis Hub",
    sections: {
      principal: "Principal",
      nutricion: "Nutrición",
      entrenamiento: "Entrenamiento",
      aprender: "Aprender",
    },
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
    recommended: "Recomendado",
    signOut: "Cerrar sesión",
    openMenu: "Abrir menú",
    moreOptions: "Más opciones",
    mainNavigation: "Navegación principal",
    expandRail: "Desplegar la navegación",
    collapseRail: "Colapsar la navegación",
    skipToContent: "Saltar al contenido",
    themeToggle: "Cambiar tema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystem: "Sistema",
    genericError: "Ocurrio un error inesperado. Intenta de nuevo.",
  },
  emptyStates: {
    dashboard: {
      title: "Tu resumen aparecerá aquí",
      description:
        "Cuando completes tu perfil y registres comidas, entrenamientos y mediciones, verás aquí tu día de un vistazo.",
    },
    nutrition: {
      title: "Aún no hay plan nutricional",
      description:
        "Aquí verás tus comidas del día, tus macros objetivo y lo que te falta por registrar.",
    },
    recipes: {
      title: "Aún no hay recetas",
      description:
        "Explora, crea y guarda recetas con sus macros calculados desde los ingredientes.",
    },
    training: {
      title: "Aún no hay rutinas",
      description:
        "Crea tu rutina, registra tus series y consulta tu historial de entrenamiento.",
    },
    progress: {
      title: "Aún no hay mediciones",
      description:
        "Registra tu peso y tus medidas para ver tendencias y promedios moviles.",
    },
    academy: {
      title: "Contenido educativo en camino",
      description:
        "Articulos basados en evidencia sobre nutrición, entrenamiento y recuperación.",
    },
    assistant: {
      title: "Tu asistente contextual",
      description:
        "Preguntas como “no tengo arroz” o “dormi poco” tendran respuestas con contexto de tus datos.",
    },
    settings: {
      title: "Configuración",
      description:
        "Aquí podrás editar tu perfil, unidades, tema y preferencias.",
    },
  },
  errorState: {
    title: "Algo salio mal",
    description: "No pudimos cargar esta sección. Intenta de nuevo.",
  },
  auth: {
    /** El escenario de acceso: la marca, la introduccion y el conmutador. */
    stage: {
      label: "Acceso a Pancis Hub",
      tagline: "Nutrición · Entrenamiento · Recuperación",
    },
    common: {
      or: "o",
      /** Rotulo del divisor antes de los accesos de terceros. */
      orWith: "O con",
      comingSoon: "Próximamente",
      emailMethod: "Correo",
      phoneMethod: "Teléfono",
    },
    social: {
      google: "Continuar con Google",
      apple: "Continuar con Apple",
      passkey: "Continuar con una llave de acceso",
      /** Rotulo del boton, que ya va dentro de una fila de accesos. */
      passkeyShort: "Llave de acceso",
    },
    splitPanel: {
      toRegister: {
        heading: "¿Nuevo en Pancis Hub?",
        body: "Crea tu cuenta y empieza a seguir tu plan hoy mismo.",
      },
      toLogin: {
        heading: "¿Ya tienes cuenta?",
        body: "Entra para seguir donde quedaste.",
      },
    },
    login: {
      title: "Entra a tu cuenta",
      description: "Bienvenido de vuelta a Pancis Hub.",
      submit: "Iniciar sesión",
      noAccount: "¿No tienes cuenta?",
      registerLink: "Regístrate",
      forgotPassword: "¿Olvidaste tu contraseña?",
      rememberMe: "No cerrar sesión",
      cta: "Entrar",
    },
    register: {
      title: "Crea tu cuenta",
      description: "Empieza a construir tu recomposición corporal.",
      submit: "Crear cuenta",
      hasAccount: "¿Ya tienes cuenta?",
      loginLink: "Inicia sesión",
    },
    recover: {
      title: "Recupera tu contraseña",
      description:
        "Te enviaremos un enlace para restablecer tu contraseña si el correo esta registrado.",
      submit: "Enviar enlace",
      sent: "Si el correo esta registrado, recibiras un enlace en unos minutos.",
      backToLogin: "Volver a iniciar sesión",
    },
    updatePassword: {
      title: "Nueva contraseña",
      description: "Define una nueva contraseña para tu cuenta.",
      submit: "Guardar contraseña",
      success: "Tu contraseña fue actualizada.",
    },
    fields: {
      displayName: "Nombre",
      email: "Correo electrónico",
      identifier: "Correo o usuario",
      username: "Usuario",
      password: "Contraseña",
      passwordConfirm: "Confirmar contraseña",
      emailPlaceholder: "tu correo",
      identifierPlaceholder: "tu correo o tu usuario",
      usernamePlaceholder: "como quieres que te llamen",
      usernameHint: "3 a 20 caracteres: letras, números, punto y guion bajo.",
      passwordPlaceholder: "tu contraseña",
      showPassword: "Mostrar la contraseña",
      hidePassword: "Ocultar la contraseña",
    },
    errors: {
      invalidCredentials: "Esos datos no coinciden con ninguna cuenta.",
      emailInUse: "Ese correo ya está registrado.",
      weakPassword: "La contraseña debe tener al menos 8 caracteres.",
      passwordMismatch: "Las contraseñas no coinciden.",
      invalidEmail: "Ingresa un correo válido.",
      nameRequired: "Ingresa tu nombre.",
      identifierRequired: "Ingresa tu correo o tu usuario.",
      usernameInvalid:
        "El usuario lleva de 3 a 20 caracteres: letras, números, punto y guion bajo, y no empieza por signo.",
      usernameTaken: "Ese usuario ya está tomado. Prueba con otro.",
      sessionExpired: "El enlace expiro o no es válido. Solicita uno nuevo.",
      generic: "No pudimos completar la operación. Intenta de nuevo.",
    },
  },
  onboarding: {
    title: "Configura tu cuenta",
    stepLabel: "Paso",
    ofLabel: "de",
    finish: "Guardar y comenzar",
    estimateNotice:
      "Estos valores son estimaciones iniciales editables, no diagnosticos ni mediciones exactas. Podrás ajustarlos cuando quieras.",
    steps: {
      basics: {
        title: "Información básica",
        description: "Datos minimos para personalizar tus cálculos.",
      },
      goal: {
        title: "Tu objetivo",
        description:
          "La recomposición corporal es el enfoque principal de Pancis Hub.",
      },
      activity: {
        title: "Actividad y entrenamiento",
        description: "Cuentanos como te mueves en una semana normal.",
      },
      nutrition: {
        title: "Preferencias de alimentación",
        description:
          "Restricciones y preferencias para no sugerirte lo que no comes.",
      },
      baseline: {
        title: "Línea base",
        description: "Tu punto de partida. Solo el peso es obligatorio.",
      },
      confirm: {
        title: "Confirma tu información",
        description:
          "Revisa el resumen y tus objetivos estimados antes de guardar.",
      },
    },
    fields: {
      displayName: "Nombre",
      birthDate: "Fecha de nacimiento",
      biologicalSex: "Sexo biologico",
      biologicalSexHelp:
        "Se usa solo para los cálculos fisiologicos de tus estimaciones.",
      male: "Masculino",
      female: "Femenino",
      heightCm: "Altura (cm)",
      unitSystem: "Sistema de unidades",
      metric: "Metrico (kg, cm)",
      imperial: "Imperial (lb, in)",
      timezone: "Zona horaria",
      goal: "Objetivo",
      goalRecomposition: "Recomposición corporal",
      goalRecompositionHelp: "Conservar músculo y reducir grasa a la vez.",
      goalFatLoss: "Pérdida de grasa",
      goalMuscleGain: "Aumento de masa muscular",
      goalMaintenance: "Mantenimiento",
      experienceLevel: "Experiencia entrenando",
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado",
      trainingDays: "Días de entrenamiento por semana",
      trainingType: "Tipo de entrenamiento",
      activityLevel: "Actividad cotidiana",
      sedentary: "Sedentaria",
      light: "Ligera",
      moderate: "Moderada",
      high: "Alta",
      dailySteps: "Pasos diarios aproximados",
      mealsPerDay: "Comidas al día",
      usualTrainingTime: "Horario habitual de entrenamiento",
      allergies: "Alergias",
      restrictions: "Restricciones",
      dislikedFoods: "Alimentos que prefieres evitar",
      preferencesHelp: "Separa cada elemento con una coma.",
      weightKg: "Peso (kg)",
      bodyFatPercentage: "Porcentaje de grasa corporal",
      skeletalMuscleKg: "Masa muscular esqueletica (kg)",
      waistCm: "Cintura (cm)",
      measuredAt: "Fecha de medición",
      measurementSource: "Fuente de la medición",
      sourceManual: "Manual (báscula de casa)",
      sourceInbody: "InBody",
      sourceScale: "Báscula inteligente",
      sourceOther: "Otra",
    },
    summary: {
      profile: "Perfil",
      goal: "Objetivo",
      activity: "Actividad",
      nutrition: "Alimentación",
      baseline: "Línea base",
      targets: "Objetivos nutricionales estimados",
      calories: "Calorías",
      protein: "Proteína",
      carbs: "Carbohidratos",
      fat: "Grasas",
      fiber: "Fibra",
      water: "Agua",
      perDay: "por día",
      none: "Sin registrar",
      /**
       * NUT-008: antes el piso se aplicaba en silencio y el usuario nunca se
       * enteraba de que su configuracion era problematica.
       */
      safetyFloorApplied:
        "Tu objetivo se subió a un mínimo de seguridad porque el cálculo daba más bajo. Ojo: ese mínimo no descuenta lo que gastas entrenando, así que si entrenas fuerte podrías quedarte corta o corto aunque el número parezca correcto. Registra tu composición corporal en Progreso y podremos calcularlo bien.",
    },
    errors: {
      required: "Este campo es obligatorio.",
      invalidDate: "Ingresa una fecha válida.",
      adultRequired: "Debes ser mayor de 18 años para usar Pancis Hub.",
      heightRange: "Ingresa una altura entre 100 y 250 cm.",
      weightRange: "Ingresa un peso entre 30 y 300 kg.",
      percentRange: "Ingresa un porcentaje entre 3 y 60.",
      stepsRange: "Ingresa un número de pasos entre 0 y 50000.",
      toleranceRange: "Ingresa un margen entre 1 y 50 %.",
      saveFailed: "No pudimos guardar tu información. Intenta de nuevo.",
    },
  },
  settings: {
    title: "Configuración",
    profileSection: "Perfil",
    profileDescription: "Tu información básica y preferencias de la cuenta.",
    saved: "Cambios guardados.",
    saveFailed: "No pudimos guardar los cambios. Intenta de nuevo.",
    avatarSection: "Foto de perfil",
    avatarDescription: "Se muestra en el menú y la barra de navegación.",
    avatarUpload: "Subir foto",
    avatarRemove: "Quitar foto",
    avatarUploaded: "Foto de perfil actualizada.",
    avatarRemoved: "Foto de perfil eliminada.",
    avatarUploadFailed:
      "No pudimos subir la imagen. Usa JPG, PNG o WEBP de hasta 5 MB.",
    appearanceSection: "Apariencia",
    appearanceDescription:
      "Pancis es la identidad principal. Gilded se conserva como respaldo. El tema se recuerda en este dispositivo.",
    paletteLabel: "Paleta",
    modeLabel: "Modo",
    usernameSection: "Tu usuario",
    usernameDescription:
      "Con el puedes entrar en lugar del correo. Es único, así que puede estar tomado.",
    usernameLabel: "Usuario",
    usernameCurrent: "Ahora eres",
    usernameSave: "Guardar usuario",
    usernameSaved: "Tu usuario quedó actualizado.",
    usernameUnchanged: "Ese ya es tu usuario.",
    accountSection: "Cuenta",
    accountDescription:
      "La sesión abierta en este dispositivo. Al cerrarla vuelves a la pantalla de acceso.",
    accountEmailLabel: "Sesión iniciada como",
    goalsSection: "Objetivo y actividad",
    // Nombre propio y no "Guardar": hay otro boton "Guardar" en la misma
    // pagina, y dos controles con el mismo nombre accesible obligan a quien
    // navega con lector de pantalla a adivinar cual es cual.
    saveGoals: "Guardar objetivo y actividad",
    tolerances: {
      title: "Tu margen por macro",
      // La redaccion importa: "te avisamos si" es una preferencia, "no debes
      // exceder" seria una afirmacion falsa. Lo dice el doc 01.
      description:
        "Cuanto puedes alejarte de tu objetivo antes de que te avisemos. Es tu criterio, no un límite clínico: subelo si te agobia, bajalo si quieres precisión.",
      calories: "Calorías (%)",
      protein: "Proteína (%)",
      carbs: "Carbohidratos (%)",
      fat: "Grasas (%)",
      fiberNote:
        "La fibra no lleva margen a proposito: es un objetivo de salud a largo plazo, no una cuenta que cuadrar cada día.",
      save: "Guardar mi margen",
      saved: "Margen actualizado.",
    },
    goalsDescription:
      "Cambiar cualquiera de los dos mueve tus calorías y tus macros. No se aplica solo: te lo proponemos y decides tu.",
    targets: {
      title: "Tus objetivos ya no corresponden a tus datos",
      description:
        "Se calcularon con datos que cambiaron. Esta es la estimación con los de hoy; tu plan y tus comidas no se tocan.",
      apply: "Actualizar mis objetivos",
      applied: "Objetivos actualizados.",
      applyFailed: "No pudimos actualizar tus objetivos. Intenta de nuevo.",
      unchanged: "Tus objetivos ya corresponden a tus datos de hoy.",
      auditReason: "Recalculo aceptado desde el aviso de objetivos",
      current: "Ahora",
      proposed: "Con tus datos de hoy",
      // Cada fila del "que cambio": la razon del aviso, no un adorno.
      changedWeight: "Pesabas {from} kg y hoy pesas {to} kg",
      changedHeight: "Tu altura paso de {from} a {to} cm",
      changedAge: "Tu edad paso de {from} a {to} años",
      changedActivity: "Tu actividad cotidiana paso de {from} a {to}",
      changedGoal: "Tu objetivo paso de {from} a {to}",
      noInputHistory:
        "Este objetivo se guardo antes de que registraramos con que datos se cálculo, así que solo podemos mostrarte las cifras.",
      weightMeasured: "Peso del {date}.",
      safetyFloor:
        "La estimación quedaba por debajo de tu metabolismo basal y se subió hasta la guarda. Conviene revisarla con un profesional.",
      estimateNotice:
        "Es una estimación editable, no una prescripción. Puedes ajustarla después en tu plan.",
    },
    assistantMemory: {
      title: "Memoria del asistente",
      description:
        "El asistente recuerda tus conversaciones para no volver a pedirte lo que ya le contaste.",
      stored: "Tienes {count} conversaciones guardadas.",
      empty: "No hay conversaciones guardadas.",
      forget: "Borrar el historial",
      confirm:
        "Se borran todas tus conversaciones con el asistente, sus respuestas y las fuentes que citaron. No se puede deshacer, y tus datos de nutrición y entrenamiento no se tocan.",
      forgotten: "Historial borrado.",
    },
  },
  pwa: {
    offlineTitle: "Sin conexión",
    offlineDescription:
      "No hay internet en este momento. Tus datos están seguros; vuelve a intentarlo cuando recuperes la conexión.",
    retry: "Reintentar",
    wentOffline: "Sin conexión. Algunas acciones no estarán disponibles.",
    backOnline: "Conexión restablecida.",
  },
  academy: {
    title: "Academia",
    subtitle:
      "Contenido educativo basado en evidencia. Aprende el porque detras de tu plan.",
    allCategories: "Todas",
    readingTime: "min de lectura",
    level: "Nivel",
    levels: {
      basico: "Básico",
      intermedio: "Intermedio",
      avanzado: "Avanzado",
    },
    evidenceLabel: "Nivel de evidencia",
    evidenceLevels: {
      alta: "Evidencia alta",
      moderada: "Evidencia moderada",
      baja: "Evidencia baja",
      demostrativo: "Contenido demostrativo",
    },
    demoNotice:
      "Este articulo es contenido demostrativo; sus referencias están pendientes de verificación.",
    keyPointsTitle: "Puntos clave",
    referencesTitle: "Referencias",
    reviewedAt: "Revisado",
    relatedTitle: "Contenido relacionado",
    backToList: "Academia",
    empty: "Aún no hay articulos publicados en esta categoría.",
  },
  evidence: {
    title: "Evidencia",
    /**
     * Enumera lo que hay de verdad en cada capa. Salio primero como
     * "N fuentes en tres capas" sumando estudios y constantes, y eso llamaba
     * "fuente" a una constante del producto, que no lo es.
     */
    eyebrow: (studies: number, constants: number) =>
      `${studies} estudios · ${constants} constantes · tus numeros`,
    /** "Capa", no "nivel": nivel ya significa el grado de evidencia A/B/C. */
    layer: (n: number) => `Capa ${n}`,
    headline: "Todo lo que sostiene tu plan, con su nivel de certeza",
    subtitle:
      "Tres capas. Cuanto más cerca de ti habla una fuente, más útil y más incierta es.",
    layers: {
      evidence: {
        name: "Evidencia",
        claim: "Estudios revisados por pares",
        caveat: "Hablan de poblaciones, no de ti.",
      },
      interpretation: {
        name: "Interpretación",
        claim: "Como el equipo lee esa evidencia",
        caveat: "Más útiles que un estudio suelto, y más discutibles.",
      },
      personal: {
        name: "Inferencia personalizada",
        claim: "Tus números, calculados con las constantes de arriba",
        caveat: "La capa más cercana y la más incierta de las tres.",
      },
    },
    grade: (g: string) => `Nivel ${g}`,
    openAccess: "Acceso abierto",
    population: "Población estudiada",
    limitations: "Limitaciones",
    productParameter: "Criterio de la app, no evidencia",
    productParameterNote:
      "No sale de un estudio: es una decisión del producto, y se marca para que no se confunda con evidencia.",
    noSources: "Sin fuentes vinculadas",
    sourcesCount: (n: number) =>
      n === 1 ? "1 fuente vinculada" : `${n} fuentes vinculadas`,
    roles: {
      sustenta: "sostiene",
      matiza: "matiza",
      contradice: "contradice",
    } as Record<string, string>,
    sourceTypes: {
      metaanalisis: "Metaanalisis",
      revision_sistematica: "Revisión sistematica",
      ensayo_controlado: "Ensayo controlado",
      guia_oficial: "Guia oficial",
    } as Record<string, string>,
    noTargets:
      "Todavía no tienes objetivos activos, así que esta capa no tiene nada tuyo que mostrar.",
    targetsFrom: (date: string) => `Vigentes desde ${date}`,
    detail: "Ver el detalle",
    detailHide: "Ocultar el detalle",
    layerNames: {
      1: "Evidencia",
      2: "Interpretación",
      3: "Inferencia personalizada",
    } as Record<number, string>,
    ring: {
      label: "Fuentes que sostienen tu plan, en perspectiva",
      previous: "Fuente anterior",
      next: "Fuente siguiente",
      position: (i: number, n: number) => `${i} de ${n}`,
      confidence: (n: number) => `${n}/5`,
      /** El anillo es un resumen; la biblioteca completa esta debajo. */
      note: "Una muestra: los tres de mayor grado de cada capa y tus números. La biblioteca completa esta debajo.",
    },
  },
  assistant: {
    openAssistant: "Abrir asistente",
    contextual: {
      ask: "Preguntar al asistente",
      // Redactadas para activar los motores deterministas ya existentes.
      mealQuestion: "Como puedo ajustar mi {name} de hoy?",
      foodQuestion: "No tengo {name}, por que lo puedo cambiar?",
      exerciseQuestion: "No puedo hacer {name}, que alternativa tengo?",
    },
    title: "Asistente",
    subtitle:
      "Respuestas con el contexto de tus datos: comidas, objetivos, entrenamientos y tendencias.",
    groundedBadge: "Con fuentes",
    evidenceGrade: "Nivel de evidencia",
    productParameter: "criterio de la app, no evidencia",
    /**
     * Que hace cada fuente por la cifra. Se muestra siempre: una fuente que
     * matiza el numero no puede leerse igual que una que lo sostiene.
     */
    sourceRoles: {
      sustenta: "sostiene esta cifra",
      matiza: "matiza esta cifra",
      contradice: "contradice esta cifra",
    } as Record<string, string>,
    demoBadge: "IA contextual",
    demoNotice:
      "El asistente usa Gemini cuando esta configurado y conserva reglas locales como respaldo. Sus respuestas usan tus datos reales pero son orientativas.",
    /** Pantalla de Copilot del handoff. */
    copilot: {
      emptyHeadline: "¿Que quieres ajustar hoy?",
      /**
       * Enumera el contexto que el asistente REALMENTE cruza. Sale de
       * `AssistantContext`: dieta activa, comidas pendientes, objetivos,
       * peso y su tendencia, sueno de hoy y hallazgos de la rutina. Si algun
       * dia deja de cruzar uno, esta frase hay que cambiarla.
       */
      emptyContext:
        "Tengo tu dieta activa, lo que llevas hoy, tus objetivos, la tendencia de tu peso, tu sueño de anoche y los hallazgos de tu rutina. Pregunta y lo cruzo por ti.",
      newConversation: "Nueva",
      proposal: "La propuesta",
      why: "¿Por que?",
      whyHide: "Ocultar el porque",
      /** El asistente propone en texto; aplicar vive donde se puede aplicar. */
      applyHint: "Los cambios se aplican en la pantalla del plan.",
      goToPlan: "Ir a Nutrición",
    },
    inputPlaceholder: "Escribe tu pregunta…",
    send: "Enviar",
    thinking: "Pensando…",
    suggestionsTitle: "Prueba con",
    suggestions: [
      "No tengo arroz",
      "Hoy voy a comer pizza",
      "No llegue a la proteína",
      "Dormi poco",
      "Mi peso no cambia",
      "No tengo la máquina de un ejercicio",
    ],
    sections: {
      observation: "Observación",
      interpretation: "Interpretación",
      confidence: "Confianza",
      action: "Acción sugerida",
      alternative: "Alternativa",
      reason: "Motivo",
      reevaluate: "Reevaluar",
      sources: "De donde sale esto",
    },
    confidences: { baja: "baja", media: "media", alta: "alta" },
    limitsTitle: "Limites del asistente",
    limits:
      "No diagnostica, no prescribe medicamentos ni sustituye a profesionales de la salud. No modifica tu plan sin tu confirmación. Si tienes sintomas o dudas clinicas, consulta a un profesional.",
    actionFailed: "No pudimos responder. Intenta de nuevo.",
    forgetFailed: "No pudimos borrar el historial. Intenta de nuevo.",
    aiUnavailable:
      "No pude consultar la IA en este momento, así que esta respuesta sale de las reglas de la app. Vuelve a intentarlo en un minuto.",
    whereFrom: "¿De donde salen estos números?",
    whereFromTitle: "De donde salen tus números",
    whereFromDescription:
      "Cada cifra con su justificación, sus limitaciones y las fuentes que la sostienen.",
    whereFromEmpty:
      "Todavía no hay justificación registrada para estas cifras.",
  },
  recipes: {
    title: "Recetas",
    subtitle: "Crea recetas y sus macros se calculan desde los ingredientes.",
    createRecipe: "Crear receta",
    editRecipe: "Editar receta",
    duplicateRecipe: "Duplicar receta",
    deleteRecipe: "Eliminar receta",
    deleteRecipeConfirm:
      "La receta se ocultará. Las comidas donde la usaste conservan sus valores.",
    searchPlaceholder: "Buscar receta…",
    created: "Receta creada.",
    updated: "Receta actualizada.",
    deleted: "Receta eliminada.",
    duplicated: "Receta duplicada.",
    actionFailed: "No pudimos completar la acción. Intenta de nuevo.",
    fields: {
      name: "Nombre",
      description: "Descripción (opcional)",
      servings: "Porciones",
      preparationMinutes: "Tiempo (min)",
      difficulty: "Dificultad",
      instructions: "Pasos de preparación",
      tags: "Etiquetas",
      tagsHelp: "Separadas por coma: rapida, meal prep, desayuno…",
      allergens: "Alérgenos",
      allergensHelp: "Separados por coma: lacteos, gluten…",
    },
    form: {
      hint: "Luego agregas los ingredientes y calculamos los macros por porción.",
      basics: "La receta",
      namePlaceholder: "Ej.: Avena horneada con banano",
      description: "Descripción",
      servingsUnit: "porc.",
      time: "Tiempo",
      noDifficulty: "Sin indicar",
      stepsPlaceholder: "1. Precalienta el horno…\n2. Mezcla…",
      labels: "Etiquetas y alérgenos",
      labelsHint: "Para encontrarla y filtrar después",
    },
    difficulties: { facil: "Fácil", media: "Media", dificil: "Difícil" },
    filters: {
      all: "Todas",
      mine: "Mias",
      highProtein: "Alta proteína",
      quick: "Rapida (≤20 min)",
    },
    perServing: "por porción",
    totalRecipe: "receta completa",
    ingredientsTitle: "Ingredientes",
    addIngredient: "Agregar ingrediente",
    ingredientAdded: "Ingrediente agregado.",
    ingredientRemoved: "Ingrediente quitado.",
    ingredientUpdated: "Cantidad actualizada.",
    stepsTitle: "Preparación",
    macrosTitle: "Macros",
    noIngredients: "Aún no hay ingredientes; agregalos para calcular macros.",
    noRecipes: "Aún no hay recetas",
    noRecipesDescription:
      "Crea tu primera receta o explora las publicas de la comunidad.",
    publicBadge: "Publica",
    addToPlan: "Agregar al plan",
    addToPlanTitle: "Agregar al plan del día",
    planServings: "Porciones a agregar",
    planDate: "Fecha",
    planMealType: "Comida",
    addedToPlan: "Receta agregada a tu plan.",
    shoppingList: "Lista de compras",
    shoppingListTitle: "Lista de compras",
    shoppingListFor: "Para",
    servingsWord: "porciones",
    copyList: "Copiar lista",
    listCopied: "Lista copiada al portapapeles.",
    allergensLabel: "Alérgenos",
    steps: {
      title: "Pasos",
      description: "Marca cada paso mientras cocinas.",
      empty: "Aún no hay pasos. Agregalos para seguir la receta uno a uno.",
      add: "Agregar paso",
      placeholder: "Ej. Picar la cebolla en cubos pequenos",
      moveUp: "Subir paso",
      moveDown: "Bajar paso",
      remove: "Quitar paso",
      added: "Paso agregado.",
      updated: "Paso actualizado.",
      removed: "Paso eliminado.",
      done: "Hecho",
      progress: "{done} de {total} pasos",
      failed: "No pudimos completar la acción. Intenta de nuevo.",
      legacyNotice:
        "Estas instrucciones venían de un solo bloque de texto. Se conservan por si la división en pasos quedó mal.",
    },
    notes: {
      storageTitle: "Conservación",
      storagePlaceholder:
        "Ej. hasta 3 días en refrigeración, en envase hermetico",
      mealPrepTitle: "Meal prep",
      mealPrepPlaceholder: "Ej. rinde 4 porciones; congelar las que no se usen",
      save: "Guardar notas",
      saved: "Notas guardadas.",
    },
    variant: {
      create: "Crear variante",
      created: "Variante creada.",
      badge: "Variante",
      ofRecipe: "Variante de otra receta",
    },
  },
  progress: {
    title: "Progreso",
    addMeasurement: "Registrar medición",
    editMeasurement: "Editar medición",
    deleteMeasurement: "Eliminar medición",
    deleteMeasurementConfirm:
      "Se eliminará esta medición de tu historial. Esta acción no se puede deshacer.",
    measurementSaved: "Medición guardada.",
    measurementDeleted: "Medición eliminada.",
    actionFailed: "No pudimos completar la acción. Intenta de nuevo.",
    chartTitle: "Tendencia de peso",
    historyTitle: "Historial de mediciones",
    photosTitle: "Fotos de progreso",
    comparisonTitle: "Comparación",
    weekLabel: "vs semana pasada",
    monthLabel: "vs mes pasado",
    noComparison: "Aún no hay suficientes datos.",
    /**
     * BIA-001: "es una estimación" es mucho mas debil que la cifra. Con el
     * numero delante, el usuario entiende por que no debe reaccionar a un
     * cambio de un punto.
     */
    inbodyNotice:
      "La bioimpedancia estima, no mide: en una persona concreta puede desviarse entre 3 y 4 puntos de porcentaje de grasa y unos 3 kg de masa magra respecto a los metodos de referencia, y tiende a quedarse corta en músculo y larga en grasa. La hidratación, el horario y la comida reciente también influyen. Compara tendencias entre mediciones hechas en condiciones parecidas, no valores aislados.",
    estimateNotice:
      "Las mediciones caseras son aproximadas; lo importante es la tendencia.",
    composition: {
      title: "Composición corporal",
      description:
        "Cada medición se compara con la anterior y con tu punto de partida.",
      metrics: {
        weightKg: "Peso",
        bodyFatPercentage: "Grasa corporal",
        fatMassKg: "Masa grasa",
        skeletalMuscleKg: "Masa muscular",
        leanMassKg: "Masa magra",
        visceralFatLevel: "Grasa visceral",
        bodyWaterPercentage: "Agua corporal",
        waistCm: "Cintura",
      },
      units: {
        weightKg: "kg",
        bodyFatPercentage: "%",
        fatMassKg: "kg",
        skeletalMuscleKg: "kg",
        leanMassKg: "kg",
        visceralFatLevel: "",
        bodyWaterPercentage: "%",
        waistCm: "cm",
      },
      vsPrevious: "vs anterior",
      vsBaseline: "vs inicio",
      stable: "Sin cambio relevante",
      derivedNote:
        "Masa grasa y masa magra se calculan desde tu peso y tu porcentaje de grasa.",
      recompositionTitle: "Recomposición en curso",
      recompositionBody:
        "Bajaste grasa y subiste músculo entre tus dos últimas mediciones. Es el mejor resultado posible: sostener lo que estás haciendo tiene sentido.",
      singleMeasurement:
        "Esta es tu primera medición. Cuando registres la siguiente verás aquí los cambios y porcentajes.",
      baselineSummary:
        "Comparado con tu primera medición, hace {days} días ({count} mediciones en total).",
      chartTitle: "Masa grasa y masa magra",
      fatMassLabel: "Masa grasa",
      leanMassLabel: "Masa magra",
      noCompositionData:
        "Registra peso y porcentaje de grasa para ver la evolución de tu composición corporal.",
    },
    fields: {
      measuredAt: "Fecha",
      source: "Fuente",
      weightKg: "Peso (kg)",
      bodyFat: "Grasa corporal (%)",
      skeletalMuscle: "Masa muscular (kg)",
      waist: "Cintura (cm)",
      hip: "Cadera (cm)",
      chest: "Pecho (cm)",
      arm: "Brazo (cm)",
      thigh: "Muslo (cm)",
      visceralFat: "Grasa visceral (nivel)",
      bodyWater: "Agua corporal (%)",
      notes: "Notas",
      attachment: "Archivo InBody (opcional)",
      attachmentHelp: "PDF o imagen, máximo 20 MB. Se guarda de forma privada.",
    },
    form: {
      basics: "Lo esencial",
      compositionHint: "Grasa, músculo, visceral y agua",
      perimeters: "Perímetros",
      perimetersHint: "Cintura, cadera, pecho, brazo y muslo",
      waist: "Cintura",
      hip: "Cadera",
      chest: "Pecho",
      arm: "Brazo",
      thigh: "Muslo",
      level: "nivel",
      extras: "Notas y archivo",
      extrasHint: "Un comentario o el PDF de tu InBody",
      attachment: "Adjuntar InBody",
    },
    sources: {
      manual: "Manual",
      inbody: "InBody",
      bascula: "Báscula inteligente",
      onboarding: "Onboarding",
      otro: "Otra",
    },
    table: {
      date: "Fecha",
      weight: "Peso",
      fat: "Grasa",
      muscle: "Músculo",
      waist: "Cintura",
      source: "Fuente",
      attachment: "Archivo",
      view: "Ver",
    },
    photos: {
      upload: "Subir foto",
      viewType: "Vista",
      frontal: "Frontal",
      lateral: "Lateral",
      posterior: "Posterior",
      date: "Fecha",
      notes: "Notas",
      uploaded: "Foto guardada de forma privada.",
      deleted: "Foto eliminada.",
      deleteConfirm:
        "Se eliminará la foto de forma permanente. Esta acción no se puede deshacer.",
      empty: "Aún no hay fotos. Son privadas: solo tu puedes verlas.",
      fileHelp: "JPG, PNG o WebP, máximo 10 MB.",
      choose: "Elegir foto",
      measurement: "Medición",
      noMeasurement: "Sin medición",
      details: "Detalles",
      privacyNote:
        "Tus fotos se guardan en un contenedor privado y se muestran con enlaces firmados temporales.",
    },
    noMeasurements: "Aún no hay mediciones",
    noMeasurementsDescription:
      "Registra tu peso (y lo que quieras medir) para ver tendencias y comparaciones.",
  },
  training: {
    title: "Entrenamiento",
    plansSection: "Rutinas",
    historySection: "Historial",
    createPlan: "Crear rutina",
    planName: "Nombre de la rutina",
    planObjective: "Objetivo (opcional)",
    createPlanHint:
      "Empieza vacía y agrega días y ejercicios a tu ritmo. Si ya tienes la rutina escrita, impórtala.",
    createPlanGroup: "Tu rutina",
    planNamePlaceholder: "Ej.: Torso / Pierna",
    planObjectivePlaceholder: "Ej.: ganar fuerza en básicos",
    activeBadge: "Activa",
    setActive: "Marcar como activa",
    duplicatePlan: "Duplicar rutina",
    deletePlan: "Eliminar rutina",
    deletePlanConfirm:
      "La rutina se ocultará. Tus sesiones registradas se conservan.",
    editPlan: "Editar rutina",
    noPlans: "Aún no tienes rutinas",
    noPlansDescription:
      "Crea tu primera rutina y organiza tus días de entrenamiento.",
    planCreated: "Rutina creada.",
    planUpdated: "Rutina actualizada.",
    planDeleted: "Rutina eliminada.",
    planDuplicated: "Rutina duplicada.",
    planActivated: "Rutina activa actualizada.",
    addDay: "Agregar día",
    dayName: "Nombre del día",
    dayLabel: "Día",
    deleteDay: "Eliminar día",
    dayAdded: "Día agregado.",
    dayDeleted: "Día eliminado.",
    addExercise: "Agregar ejercicio",
    searchExercise: "Buscar ejercicio…",
    exerciseAdded: "Ejercicio agregado.",
    exerciseRemoved: "Ejercicio quitado.",
    exerciseUpdated: "Ejercicio actualizado.",
    substitute: "Sustituir",
    biomechanics: {
      detailTitle: "Ficha del ejercicio",
      startPosition: "Inicio",
      endPosition: "Fin",
      imageCredit:
        "Imágenes de free-exercise-db (dominio público). Son una referencia general del movimiento, no una corrección de tu técnica.",
      detailDescription: "Cómo se hace, qué trabaja y sus puntos clave.",
      secondaryMuscles: "Músculos secundarios",
      primaryMuscles: "Músculos principales",
      howTo: "Cómo se hace",
      keyPoints: "Puntos clave",
      worksTitle: "Qué trabaja",
      movement: "Movimiento",
      primaryShort: "Principal",
      secondaryShort: "Apoyo",
      modelLabel: "Maniquí con los músculos que trabaja",
      technicalTitle: "Detalle técnico",
      technicalHint: "Biomecánica, esquema sugerido y valoración",
      personalBest: "Tu mejor marca",
      joints: "Articulaciones involucradas",
      resistanceProfile: "Curva de resistencia",
      hardestPoint: "Punto más difícil",
      setup: "Posición inicial",
      execution: "Ejecución",
      cues: "Recomendaciones técnicas",
      commonErrors: "Errores comunes",
      unilateral: "Unilateral",
      ratingsTitle: "Valoración para tu contexto",
      dimensions: {
        objetivo: "Ajuste a tu objetivo",
        estabilidad: "Estabilidad",
        rango: "Rango de movimiento",
        progresion: "Facilidad de progresión",
        demandaTecnica: "Accesibilidad técnica",
        fatiga: "Costo de fatiga",
      },
      disclaimer:
        "Estas valoraciones son orientativas y dependen de tu objetivo, tu experiencia y tu equipo. La anatomía y la movilidad individuales pueden cambiar la respuesta: no son verdades universales.",
      prescriptionTitle: "Esquema sugerido",
      withoutBiomechanics:
        "Este ejercicio viene del catálogo importado y no tiene biomecánica escrita, así que no se valora ni se sugiere un esquema: preferimos no decir nada antes que darte un número inventado.",
      prescriptionNote:
        "Es una sugerencia: no modifica tu rutina. Si te convence, edita el ejercicio con estos valores.",
      progressionLabel: "Cómo progresar",
      analysisTitle: "Análisis de la rutina",
      analysisDescription:
        "Volumen semanal, frecuencia, patrones cubiertos y ajustes sugeridos.",
      weeklyVolume: "Series semanales por músculo",
      frequency: "Frecuencia semanal",
      frequencyValue: "{days} día(s)",
      missingPatterns: "Patrones sin cubrir",
      priorities: {
        alta: "Prioridad alta",
        mejora: "Mejora recomendada",
        opcional: "Opcional",
        observacion: "Observación",
        sin_cambios: "Sin cambios necesarios",
      },
      analysisDisclaimer:
        "Las referencias de volumen y frecuencia son orientaciones generales. La tolerancia individual varia: usalas como punto de partida, no como límites exactos.",
      compatibility: "Compatibilidad como sustituto",
      similarities: "En que se parecen",
      advantages: "Que ganas",
      differences: "Que cambia",
      limitations: "Que pierdes",
      recommendation: "Recomendación",
    },
    import: {
      trigger: "Importar rutina",
      title: "Importar una rutina escrita",
      description:
        "Sube el PDF de tu entrenador o pega la rutina como te la enviaron. Reconocemos días, series, repeticiones, superseries, circuitos y notas, y te mostramos el resultado antes de guardar.",
      textLabel: "Texto de la rutina",
      placeholder:
        "Día 1 - Pierna\nSentadilla 4x8-10 RIR 2 desc 120\nPrensa de pierna 3x12",
      nameLabel: "Nombre de la rutina",
      analyze: "Analizar",
      previewTitle: "Esto entendimos",
      summary: "{days} días · {exercises} ejercicios",
      unmatched:
        "{count} ejercicio(s) no existen en el catálogo y se omitiran. Puedes agregarlos después a mano.",
      ignored: "Lineas que no pudimos interpretar",
      notInCatalog: "sin equivalente",
      save: "Crear rutina",
      imported: "Rutina importada.",
      nothingRecognized:
        "No reconocimos ninguna rutina en ese texto. Revisa el formato del ejemplo.",
      failed: "No pudimos importar la rutina. Intenta de nuevo.",
      noAiNotice:
        "El análisis es local: no se envía tu rutina a ningún servicio externo.",
      uploadPdf: "Subir PDF",
      readingPdf: "Leyendo el PDF…",
      pdfLoaded: "Leímos el PDF. Revisa el texto y pulsa Analizar.",
      pdfInvalid: "No pudimos leer ese archivo. Sube un PDF de hasta 5 MB.",
      pdfEmpty:
        "Ese PDF no trae texto (puede ser una foto escaneada). Copia la rutina a mano.",
      change: "Cambiar",
      choose: "Elegir",
      fileInvalid:
        "Ese archivo no sirve. Sube un PDF o una foto (JPG, PNG, WEBP o HEIC) de hasta 5 MB.",
      aiUnavailable:
        "La lectura con IA no está disponible ahora. Pega el texto de la rutina.",
      unreadable:
        "No pudimos leer una rutina en ese archivo. Prueba con una foto más nítida o pega el texto.",
      incomplete:
        "A {count} ejercicio(s) les faltan series o repeticiones. Complétalos antes de guardar.",
      readingFile: "Leyendo la rutina…",
      uploadFile: "Subir PDF o foto",
      aiNotice:
        "El archivo se lee con IA (Google Gemini). Revisa todo antes de guardar.",
      dayNote: "Nota del día",
      generalNotes: "Notas generales",
      written: "Escrito",
      back: "Volver a cargar",
      defaultName: "Rutina del coach",
      orPaste: "o pégala como texto",
      dropHintPdf: "Arrástralo aquí o búscalo en tu equipo. PDF de hasta 5 MB.",
      dayName: "Nombre del día",
      namePlaceholder: "Ej.: Rutina de mi coach — octubre",
      ignoredHint: "No parecen ejercicios; revísalas por si falta algo",
    },
    versions: {
      title: "Versiones de la rutina",
      description:
        "Cada versión es una foto completa. Puedes volver a cualquiera sin perder la actual.",
      save: "Guardar versión",
      saved: "Versión {version} guardada.",
      restore: "Restaurar",
      restored: "Se restauró la versión {version}.",
      versionLabel: "Versión {version}",
      summary: "{days} días · {exercises} ejercicios · {sets} series",
      noVersions:
        "Aún no has guardado ninguna versión. Guarda una antes de reestructurar la rutina para poder volver.",
      noChanges: "No hay cambios respecto a la última versión guardada.",
      pendingTitle: "Cambios sin guardar desde la última versión",
      pendingChanged: "{exercise} en {day}: {field} {from} -> {to}",
      pendingAdded: "Se agregó {exercise} a {day}",
      pendingRemoved: "Se quitó {exercise} de {day}",
      pendingDayAdded: "Se agregó el día {day}",
      pendingDayRemoved: "Se quitó el día {day}",
      setsDelta: "Diferencia total: {delta} series",
      reason: "Motivo (opcional)",
      reasonPlaceholder: "Ej. antes de cambiar el volumen de pierna",
      defaultReason: "Versión guardada manualmente.",
      autoBeforeRestore: "Guardada automáticamente antes de restaurar.",
      restoreReason: "Se restauró la versión {version}.",
      restoreIncomplete:
        "Algún ejercicio de esa versión ya no existe en el catálogo. No se pudo restaurar completa.",
      failed: "No pudimos completar la acción. Intenta de nuevo.",
      restoreConfirm:
        "Se reemplazará tu rutina actual por esta versión. Antes se guarda una versión de lo que tienes ahora, así que no se pierde nada.",
    },
    substitutionReason: "Sustitución de ejercicio aceptada por el usuario.",
    /**
     * Sustitucion valida por un dia. Es la accion por defecto: cambiar el
     * plan entero es la excepcion, no al reves.
     */
    daySwap: {
      action: "Solo por hoy",
      actionHint: "Tu rutina no cambia. Manana vuelve este ejercicio.",
      planAction: "Cambiar en la rutina",
      planHint: "Reemplaza el ejercicio de forma permanente en el plan.",
      planConfirm:
        "Esto cambia tu rutina para siempre, no solo hoy. Se guarda una versión previa por si quieres volver.",
      reasonLabel: "Motivo (opcional)",
      reasonPlaceholder: "La máquina estaba ocupada, molestia en el hombro...",
      defaultReason: "Sustitución válida solo por este día.",
      swapped: "Hoy en lugar de",
      undo: "Volver al original",
      undone: "Se restauró el ejercicio de tu rutina.",
      saved: "Cambiado solo por hoy.",
    },
    substituteTitle: "Sustituir ejercicio",
    substituteDescription:
      "Alternativas por músculo y patrón de movimiento. Ningún ejercicio produce exactamente el mismo resultado que otro.",
    substituteEquipmentFilter: "Filtrar por equipo",
    substituteAll: "Todos los equipos",
    noAlternatives: "No encontramos alternativas para este ejercicio.",
    samePattern: "Mismo patrón",
    otherMuscle: "Otro músculo principal",
    fields: {
      sets: "Series",
      repsMin: "Reps min",
      repsMax: "Reps max",
      rir: "RIR",
      rpe: "RPE",
      tempo: "Tempo",
      restSeconds: "Descanso (s)",
      notes: "Notas",
      weightKg: "Peso (kg)",
      reps: "Reps",
      warmup: "Calentamiento",
    },
    startSession: "Iniciar entrenamiento",
    continueSession: "Continuar sesión en curso",
    freeSession: "Sesión libre",
    sessionTitle: "Sesión de entrenamiento",
    sessionStarted: "Sesión iniciada.",
    finishSession: "Finalizar sesión",
    sessionFinished: "Sesión finalizada.",
    sessionNotes: "Notas de la sesión",
    discardSession: "Descartar sesión",
    discardSessionConfirm:
      "Se eliminará la sesión y sus series registradas. Esta acción no se puede deshacer.",
    sessionDiscarded: "Sesión descartada.",
    addSet: "Agregar serie",
    setLogged: "Serie registrada.",
    setUpdated: "Serie actualizada.",
    setDeleted: "Serie eliminada.",
    setLabel: "Serie",
    warmupShort: "Cal.",
    targetLabel: "Objetivo",
    lastSessionLabel: "Anterior",
    volumeLabel: "Volumen",
    setsLabel: "series",
    durationLabel: "Duración",
    minutesShort: "min",
    inProgress: "En curso",
    prsTitle: "Mejores marcas",
    muscleFrequencyTitle: "Series por músculo (7 días)",
    noHistory: "Aún no hay sesiones registradas.",
    actionFailed: "No pudimos completar la acción. Intenta de nuevo.",
    kgUnit: "kg",
  },
  foods: {
    title: "Biblioteca de alimentos",
    subtitle:
      "Busca en el catálogo, marca favoritos y crea tus propios alimentos.",
    searchPlaceholder: "Buscar por nombre…",
    searchButton: "Buscar",
    views: {
      todos: "Todos",
      favoritos: "Favoritos",
      mios: "Mis alimentos",
      recientes: "Recientes",
    },
    groups: {
      all: "Todos los grupos",
      proteina: "Proteína",
      carbohidrato: "Carbohidrato",
      grasa: "Grasa",
      lacteo: "Lacteo",
      fruta: "Fruta",
      verdura: "Verdura",
      legumbre: "Legumbre",
      bebida: "Bebida",
      mixto: "Mixto",
      otro: "Otro",
    },
    customBadge: "Personalizado",
    correctedBadge: "Corregido por ti",
    verifiedBadge: "Verificado",
    createFood: "Crear alimento",
    editFood: "Editar alimento",
    deleteFood: "Eliminar alimento",
    deleteFoodConfirm:
      "El alimento se ocultará de la biblioteca. Las comidas donde lo registraste conservan sus valores.",
    fields: {
      name: "Nombre",
      brand: "Marca (opcional)",
      group: "Grupo alimentario",
      cookedState: "Estado",
      stateNone: "No aplica",
      caloriesPer100: "Calorías por 100 g",
      proteinPer100: "Proteína (g por 100 g)",
      carbsPer100: "Carbohidratos (g por 100 g)",
      fatPer100: "Grasas (g por 100 g)",
      fiberPer100: "Fibra (g por 100 g)",
    },
    favoriteAdd: "Agregar a favoritos",
    favoriteRemove: "Quitar de favoritos",
    created: "Alimento creado.",
    updated: "Alimento actualizado.",
    deleted: "Alimento eliminado.",
    favoriteToggled: "Favoritos actualizados.",
    emptyTitle: "Sin resultados",
    emptyDescription:
      "Ajusta la búsqueda o los filtros, o crea un alimento propio.",
    macroSummary: "P {p} · C {c} · G {g} · F {f}",
    barcode: {
      trigger: "Escanear código",
      title: "Escanear código de barras",
      description:
        "Apunta al código del envase o escribelo. Buscamos el producto en Open Food Facts.",
      cameraLabel: "Vista de la cámara para escanear",
      aiming: "Encuadra el código de barras dentro del recuadro.",
      cameraDenied:
        "No pudimos usar la cámara. Revisa los permisos del navegador o escribe el código abajo.",
      noCameraSupport:
        "Tu navegador no permite escanear con la cámara. Escribe el código del envase y funciona igual.",
      manualLabel: "Código de barras",
      search: "Buscar",
      invalidCode:
        "Ese código no parece válido. Revisa los digitos e intenta de nuevo.",
      notFound:
        "Open Food Facts no tiene ese producto. Puedes crearlo como alimento personalizado.",
      scanAnother: "Escanear otro",
    },
    corrections: {
      trigger: "Corregir datos",
      title: "Corregir datos del alimento",
      description:
        "Tu corrección solo te afecta a ti. El alimento del catálogo no cambia, y lo que ya registraste conserva sus valores.",
      catalogValue: "Catálogo: {value}",
      reason: "Motivo (opcional)",
      reasonPlaceholder: "Ej. la etiqueta del producto dice otra cosa",
      save: "Guardar corrección",
      saved: "Corrección guardada.",
      remove: "Quitar corrección",
      removed: "Corrección eliminada.",
      defaultReason: "Corrección manual del usuario.",
      emptyNotice:
        "Deja en blanco los campos que no quieras corregir: seguiran tomando el valor del catálogo.",
    },
    external: {
      title: "Buscar en línea",
      description:
        "Si no encuentras un alimento en tu biblioteca, buscalo en USDA y Open Food Facts y guardalo con un toque.",
      searchButton: "Buscar en línea",
      searching: "Buscando en USDA y Open Food Facts…",
      noResults:
        "Ningún proveedor externo tiene ese alimento. Puedes crearlo manualmente.",
      resultsTitle: "Resultados en línea",
      importButton: "Agregar a mi biblioteca",
      importing: "Agregando…",
      imported: "Alimento agregado a la biblioteca.",
      alreadyInLibrary: "Ya esta en tu biblioteca",
      externalBadge: "Fuente externa",
      unverifiedNotice:
        "Datos importados de una fuente externa, aún sin revisar. Verifica la etiqueta del producto antes de confiar en ellos.",
      per100g: "Valores por 100 g",
      minQuery: "Escribe al menos 3 letras para buscar en línea.",
      providersOffline:
        "La búsqueda en línea no esta configurada. Falta la clave de USDA.",
    },
    errors: {
      required: "Este campo es obligatorio.",
      range: "Revisa los valores: deben ser números validos.",
      failed: "No pudimos completar la acción. Intenta de nuevo.",
      providerUnavailable:
        "El proveedor externo no esta disponible en este momento.",
      externalNotFound:
        "El proveedor ya no tiene ese alimento. Intenta con otra búsqueda.",
    },
  },
  swap: {
    verdict: {
      heading: "Si haces el cambio",
      gain: (name: string, protein: string, kcal: string, dir: string) =>
        `${name} aporta ${protein} g mas de proteina con ${kcal} kcal ${dir}.`,
      loss: (name: string, protein: string) =>
        `${name} aporta ${protein} g mas de proteina. El cambio saldria a perdida.`,
      even: (name: string) =>
        `${name} deja el dia practicamente igual en proteina y energia.`,
      more: "más",
      less: "menos",
      dayEffect: "Efecto en el día",
      before: "Ahora",
      after: "Después",
      closer: "Te acerca al objetivo",
      farther: "Te aleja del objetivo",
      same: "No cambia",
      detail: "Ver nutriente a nutriente",
      detailHide: "Ocultar el detalle",
      confirm: "Aplicar el cambio",
      ofTarget: (target: string) => `de ${target}`,
      noTargets:
        "Sin objetivos nutricionales no se puede decir si el cambio te acerca o te aleja; solo la diferencia entre los dos alimentos.",
    },
    trigger: "Intercambiar",
    /** Rotulo corto de la capsula en Nutricion; cabe junto al alimento. */
    triggerShort: "Cambiar",
    title: "Intercambiar alimento",
    description:
      "Alternativas con aporte similar. Son aproximaciones nutricionales, no equivalencias exactas.",
    sourceLabel: "Estás cambiando",
    forQuantity: "por cada",
    suggestedQuantity: "Cantidad sugerida",
    differences: "Diferencia",
    noAlternatives:
      "No encontramos alternativas compatibles en la misma categoría.",
    crossGroupNote: "De otro grupo alimentario",
    favoriteNote: "Favorito",
    recentNote: "Usado recientemente",
    availableNote: "En tu despensa",
    householdEquivalence: "≈ {equivalence}",
    filterLabel: "Buscar",
    filters: {
      similar: "Lo más parecido",
      macros: "Más cercanas en macros",
      mas_proteina: "Más proteína",
      menos_calorias: "Menos calorías",
      mas_saciedad: "Más proteína y fibra",
      disponibles: "Lo que tengo en casa",
    },
    filterEmpty:
      "Ninguna alternativa mejora en ese criterio. Prueba con otro o usa la opción más parecida.",
    densityNote:
      "Proteína y saciedad se comparan por caloría: más aporte para la misma energía.",
    // El boton de cada alternativa ya no aplica el cambio: lo elige y abre el
    // veredicto. Se renombro con la accion: un boton que dice "confirmar" y no
    // confirma es una interfaz que miente.
    confirmSwap: "Ver el cambio",
    swapped: "Alimento intercambiado.",
    failed: "No pudimos completar el intercambio. Intenta de nuevo.",
    modifiedReason: "Sustitución de alimento aceptada por el usuario.",
    compatibility: "Compatibilidad",
    compatibilityOf10: "{score}/10",
    compatibilityNote:
      "La compatibilidad es una aproximación orientativa, no una equivalencia exacta.",
    /**
     * Los alergenos se filtran por el nombre del alimento. Un producto
     * empacado puede contener un alergeno sin llevarlo en el nombre, asi que
     * esto no sustituye leer la etiqueta.
     */
    allergenNote:
      "Si tienes alergias, revisa siempre la etiqueta: filtramos por el nombre del alimento y un producto empacado puede contener algo que no aparece ahi.",
    rebalanceTitle: "Como queda tu día",
    rebalanceRemaining: "Te quedan",
    rebalanceApplyNote:
      "Estas sugerencias no modifican ninguna comida: tu decides si las aplicas.",
  },
  pantry: {
    title: "Despensa",
    subtitle: "Lo que tienes en casa",
    description:
      "Marca los alimentos que tienes disponibles. Al buscar sustitutos podrás priorizar lo que ya tienes en casa.",
    addTitle: "Agregar a la despensa",
    addDescription:
      "Busca en la biblioteca o escanea un código de barras para agregar lo que tienes.",
    addButton: "Agregar",
    added: "Agregado a tu despensa.",
    removed: "Quitado de tu despensa.",
    remove: "Quitar",
    empty:
      "Tu despensa esta vacía. Agrega los alimentos que tengas en casa para encontrar sustitutos con lo que ya tienes.",
    count: "{count} alimentos en tu despensa",
    countOne: "1 alimento en tu despensa",
    alreadyInPantry: "Ese alimento ya esta en tu despensa.",
    failed: "No pudimos actualizar tu despensa. Intenta de nuevo.",
  },
  nutrition: {
    title: "Nutrición",
    dayHero: {
      eyebrow: "Plan del día",
      rangeLabel: "El día",
      mealsCount: (n: number) => `${n} ${n === 1 ? "comida" : "comidas"}`,
      rangeToday: "Hoy",
      rangeWeek: "Semana",
      rangeBlock: "Bloque",
      rangeComingSoon: "Próximamente",
      over: (n: string, target: string) => `+${n} sobre ${target}`,
      under: (n: string, target: string) => `${n} de ${target}`,
      logged: (done: number, pending: number) =>
        pending === 0
          ? `${done} ${done === 1 ? "registrada" : "registradas"}`
          : `${done} ${done === 1 ? "registrada" : "registradas"} · ${pending} pendiente${pending === 1 ? "" : "s"}`,
      stateOver: (n: string) => `Vas ${n} por encima del presupuesto.`,
      stateUnder: (n: string) => `Te quedan ${n} del presupuesto.`,
      stateMet: "Estas justo en el presupuesto.",
      pendingOne: (name: string) =>
        `${name} es la unica que queda por registrar.`,
      pendingMany: (n: number) => `Quedan ${n} comidas por registrar.`,
      pendingNone: "No queda nada pendiente por hoy.",
      macroShort: "Faltan",
      macroOver: "De sobra",
      macroMet: "Cumplido",
      macroOf: (target: string) => `de ${target}`,
      noPlanTitle: "Todavía no tienes un plan de dieta activo",
      noPlanBody:
        "Los totales del día ya funcionan, pero el plan es lo que dice que te toca en cada comida. Importa el tuyo o crealo desde cero.",
    },
    aiDiet: {
      pageTitle: "Importar dieta con IA",
      pageDescription:
        "Sube una foto, captura o PDF de tu plan y revisalo antes de guardarlo. La IA puede cometer errores: edita cada alimento libremente.",
      uploadTitle: "Sube tu dieta",
      uploadDescription:
        "Foto, captura de pantalla o PDF de tu plan alimenticio (max. 5 MB).",
      fileLabel: "Archivo de tu dieta",
      dropTitle: "Sube la foto o el PDF de tu plan",
      dropHint:
        "Arrástralo aquí o búscalo · JPG, PNG, WebP o PDF de hasta 5 MB",
      analyzeHint:
        "La IA lee las comidas y las cantidades; tú las revisas antes de guardar. Puede tardar hasta un minuto.",
      analyze: "Analizar con IA",
      analyzing: "Analizando…",
      reviewTitle: "Revisa y edita antes de guardar",
      reviewDescription:
        "Estos valores son estimaciones de la IA. Corrige el alimento, la cantidad o los macros de cada fila antes de guardar.",
      dietName: "Nombre de la dieta",
      dailyTargets: "Objetivos diarios",
      mealName: "Nombre de la comida",
      mealType: "Tipo de comida",
      addItem: "Agregar alimento",
      removeItem: "Quitar alimento",
      addMealButton: "Agregar comida",
      removeMeal: "Quitar comida",
      itemOriginalLabel: "Texto original de la IA",
      linkedFood: "Alimento vinculado del catálogo",
      noLinkedFood: "Sin vincular — se creara un alimento personalizado",
      searchToLink: "Buscar y vincular alimento…",
      unlink: "Desvincular (editar macros manualmente)",
      quantityLabel: "Cantidad (g)",
      manualMacrosNote:
        "Sin alimento vinculado: estos macros son para la cantidad indicada y se guardaran como un alimento personalizado.",
      linkedMacrosNote: "Macros tomados del catálogo para esta cantidad.",
      saveDiet: "Guardar dieta revisada",
      saving: "Guardando…",
      saved: "Dieta guardada y activada.",
      errors: {
        notAuthenticated: "Debes iniciar sesión.",
        aiUnavailable:
          "El análisis con IA no esta disponible en este momento. Intenta más tarde.",
        unsupportedFormat: "Formato no soportado. Sube JPG, PNG, WebP o PDF.",
        fileTooLarge: "El archivo es muy grande. Sube uno de 5 MB o menos.",
        parseFailed:
          "No pudimos leer el archivo. Asegurate de que sea claro e intenta de nuevo.",
        searchFailed: "No pudimos buscar alimentos. Intenta de nuevo.",
        saveFailed: "No pudimos guardar la dieta. Intenta de nuevo.",
        missingMacros: "Faltan macros para un alimento sin vincular",
        readFailed: "No se pudo leer el archivo.",
      },
    },
    dietPlan: {
      title: "Mi dieta de hoy",
      todayChecklist:
        "Completa tus comidas para descontarlas de tu meta diaria.",
      logMeal: "Marcar como comida",
      /** Riel de comidas del handoff. */
      rail: {
        statePending: "Pendiente",
        stateLogged: "Registrada",
        shareOfDay: (pct: number) => `${pct} % del dia`,
        modified: "Sustituida hoy",
        macroMix: (p: number, c: number, g: number) =>
          `Reparto de energia: ${p} % proteina, ${c} % carbohidratos, ${g} % grasas`,
        progress: (pct: number) => `${pct} % del plan registrado`,
        collapse: "Ocultar el detalle",
        expand: "Ver el detalle",
      },
      logged: "Registrada hoy",
      /** Rotulo accesible del circulo que registra la comida. */
      logAction: "Marcar como comida",
      logging: "Registrando…",
      loggedToast: "Comida registrada en tu diario de hoy.",
      alreadyLoggedToast: "Esta comida ya estaba registrada para ese día.",
      logFailed:
        "No pudimos registrar la comida. Revisa tu conexión e intenta de nuevo.",
      swapMeal: "Ver sustitutos",
      noTemplate: "Aún no tienes una dieta activa.",
      uploadCta: "Importar con IA",
      customFoodBadge: "Personalizado",
      remaining: "kcal restantes",
      allDone: "Plan del día completo",
      // El plan suma sus propias calorias y casi nunca coincide al kcal con
      // la meta versionada de nutrition_targets. Nombrar cada cifra evita que
      // el usuario lea dos objetivos distintos sin explicacion.
      planTotal: "kcal del plan",
    },
    swapQuestion: {
      title: "¿Y si lo cambio?",
      description:
        "Escribe por que alimento lo cambiarias y cuanto, y te digo como queda tu día.",
      foodLabel: "Cambiarlo por",
      foodPlaceholder: "Ej. avena, pan integral, yogur griego…",
      quantityLabel: "Cantidad",
      submit: "Ver que cambia",
      calculating: "Calculando…",
      fromLibrary: "Dato de tu biblioteca",
      fromAssistant: "Estimado por el asistente",
      equivalentHint: "Para igualar las calorías necesitarias",
      applyForToday: "Usar solo por hoy",
      applied: "Listo, cambiado solo por hoy.",
      undo: "Deshacer el cambio de hoy",
      undone: "Se restauró tu plan original.",
      replacesToday: "Hoy en lugar de",
      estimated: "estimado",
      noEstimateAvailable:
        "Ese alimento no esta en tu biblioteca y el asistente no esta configurado. Agregalo a la biblioteca para calcular el cambio.",
      estimateFailed:
        "No pudimos estimar ese alimento. Intenta con otro nombre o agregalo a tu biblioteca.",
      // El aviso cambia con la confianza que reporta el modelo: no es lo mismo
      // una estimacion de categoria generica que una de un dato bien conocido.
      estimateNotice: {
        alta: "Estimación del asistente a partir de tablas de composición. Revisa el empaque si necesitas exactitud.",
        media:
          "Estimación aproximada. El valor real puede variar según la marca.",
        baja: "Estimación poco precisa: el asistente no reconocio el producto y cálculo por su categoría. Verifica el empaque.",
      },
    },
    compare: {
      title: "Comparar comidas",
      subtitle:
        "Elige dos comidas y mira la diferencia de macronutrientes entre ellas.",
      slotA: "Comida A",
      slotB: "Comida B",
      sourceDiet: "De mi dieta",
      sourceToday: "Registrada hoy",
      sourceCustom: "Construir una nueva",
      selectMeal: "Selecciona una comida…",
      addFood: "Agregar alimento",
      empty: "Agrega alimentos o elige una comida para comparar.",
      totals: "Totales",
      difference: "Diferencia (B − A)",
      differenceNote:
        "Positivo = B aporta más que A. Son aproximaciones, no valores exactos.",
      compensationTitle: "Como compensar en el resto del día",
      compensationMore:
        "Comida B aporta más calorías y macros. Si la eliges, considera reducir porciones similares en otra comida del día para mantenerte cerca de tu objetivo.",
      compensationLess:
        "Comida B aporta menos calorías y macros. Si la eliges, considera agregar una fuente de proteína o un acompanante en otra comida para no quedarte corto.",
      compensationSimilar:
        "Ambas comidas aportan valores muy similares: el cambio no debería afectar tu día de forma relevante.",
      noData: "Elige ambas comidas para ver la comparación.",
      needMacros: "Necesitas datos completos en ambas comidas para comparar.",
    },
    dayPlan: "Plan del día",
    todayButton: "Hoy",
    previousDay: "Día anterior",
    nextDay: "Día siguiente",
    addMeal: "Agregar comida",
    mealTypes: {
      desayuno: "Desayuno",
      almuerzo: "Almuerzo",
      cena: "Cena",
      snack: "Snack",
      otro: "Otro",
    },
    mealName: "Nombre (opcional)",
    mealTime: "Hora (opcional)",
    mealTimeHelp: "Las comidas sin hora se muestran al final del día.",
    mealTimeUpdated: "Horario actualizado.",
    noTime: "Sin hora",
    mealType: "Tipo de comida",
    statuses: {
      planificada: "Planificada",
      completada: "Completada",
      completada_con_cambios: "Completada con cambios",
      omitida: "Omitida",
    },
    modifiedNote: "Esta comida se completo con sustituciones.",
    versions: {
      title: "Versiones de tu dieta",
      description:
        "Cada versión es una foto completa del plan. Puedes volver a cualquiera sin perder la actual.",
      save: "Guardar versión",
      saved: "Versión {version} guardada.",
      restore: "Restaurar",
      restored: "Se restauró la versión {version}.",
      versionLabel: "Versión {version}",
      summary: "{meals} comidas · {items} alimentos · {calories} kcal",
      noVersions:
        "Aún no has guardado ninguna versión. Guarda una antes de hacer cambios grandes para poder volver.",
      noChanges: "No hay cambios respecto a la última versión guardada.",
      pendingTitle: "Cambios sin guardar desde la última versión",
      pendingItemChanged: "{food} en {meal}: {from} g -> {to} g",
      pendingItemAdded: "Se agregó {food} a {meal}",
      pendingItemRemoved: "Se quitó {food} de {meal}",
      pendingMealAdded: "Se agregó la comida {meal}",
      pendingMealRemoved: "Se quitó la comida {meal}",
      caloriesDelta: "Diferencia total: {delta} kcal",
      reason: "Motivo (opcional)",
      reasonPlaceholder: "Ej. antes de subir carbohidratos",
      defaultReason: "Versión guardada manualmente.",
      autoBeforeRestore: "Guardada automáticamente antes de restaurar.",
      restoreReason: "Se restauró la versión {version}.",
      restoreIncomplete:
        "Algún alimento de esa versión ya no existe en el catálogo. No se pudo restaurar completa.",
      failed: "No pudimos completar la acción. Intenta de nuevo.",
      restoreConfirm:
        "Se reemplazará tu dieta actual por esta versión. Antes se guarda una versión de lo que tienes ahora, así que no se pierde nada.",
    },
    recipeSwap: {
      trigger: "Cambiar por receta",
      title: "Sustituir la comida por una receta",
      description:
        "Comparamos cada receta con lo que tenias planificado y sugerimos las porciones que más se acercan.",
      currentMeal: "Comida actual",
      suggestedServings: "Porciones sugeridas",
      servingsLabel: "porciones",
      confirm: "Sustituir la comida",
      replaced: "Comida sustituida por la receta.",
      noRecipes:
        "Aún no tienes recetas con ingredientes. Crea una en la sección Recetas.",
      emptyMeal:
        "Agrega alimentos a la comida para poder compararla con tus recetas.",
      emptyRecipe: "Esa receta no tiene ingredientes.",
      failed: "No pudimos sustituir la comida. Intenta de nuevo.",
      auditReason: "Comida sustituida por una receta.",
    },
    markCompleted: "Marcar completada",
    markPlanned: "Volver a planificada",
    markSkipped: "Omitir",
    copyMeal: "Duplicar comida",
    deleteMeal: "Eliminar comida",
    deleteMealConfirm:
      "Se eliminará la comida y sus alimentos registrados. Esta acción no se puede deshacer.",
    duplicateYesterday: "Copiar el día anterior",
    duplicateYesterdayEmpty: "El día anterior no tiene comidas para copiar.",
    notes: "Notas",
    notesPlaceholder: "Notas de la comida…",
    saveNotes: "Guardar notas",
    addFood: "Agregar alimento",
    searchFood: "Buscar alimento…",
    searchNoResults: "Sin resultados. Prueba con otro nombre.",
    searchHint: "Escribe al menos 2 letras para buscar.",
    per100g: "por 100 g",
    quantity: "Cantidad",
    grams: "g",
    portion: "Porción",
    customGrams: "Gramos exactos",
    defaultPortionLabel: "Porción por defecto",
    itemAdded: "Alimento agregado.",
    itemUpdated: "Cantidad actualizada.",
    itemDeleted: "Alimento eliminado.",
    mealCreated: "Comida agregada.",
    mealDeleted: "Comida eliminada.",
    mealCopied: "Comida duplicada.",
    dayDuplicated: "Comidas del día anterior copiadas.",
    statusUpdated: "Estado actualizado.",
    notesSaved: "Notas guardadas.",
    actionFailed: "No pudimos completar la acción. Intenta de nuevo.",
    dayTotals: "Totales del día",
    remainingTitle: "Restante para tu objetivo",
    consumedOf: "de",
    kcal: "kcal",
    todaysMealsTitle: "Comidas registradas hoy",
    todaysMealsNote:
      "Esto es lo que ya registraste. Para ver tu plan de dieta, anda al",
    todaysMealsNoteLink: "Hoy",
    noMealsTitle: "Sin comidas este día",
    noMealsDescription:
      "Agrega tu primera comida y registra los alimentos que consumiste.",
    emptyMeal: "Sin alimentos registrados.",
    /**
     * Las comidas que la persona REGISTRO, frente al plan que dice lo que le
     * toca. Son dos cosas distintas y la pantalla necesitaba nombrarlas: el
     * plan responde "que me toca" y esto responde "que comi".
     */
    loggedTitle: "Lo que registraste hoy",
    loggedDescription:
      "Lo que ya comiste, con sus alimentos. El plan de arriba dice lo que te toca; esto dice lo que hubo.",
    loggedEmpty: "Todavía no registraste ninguna comida hoy.",
    noTargetsNote:
      "Aún no tienes objetivos nutricionales activos; completa el onboarding para calcularlos.",
    cookedState: { crudo: "crudo", cocido: "cocido" },
  },
  /** Fuente canonica de etiqueta/unidad por macro, usada por MacroChip. */
  macros: {
    calories: { label: "Calorías", short: "Cal", unit: "kcal" },
    protein: { label: "Proteinas", short: "P", unit: "g" },
    carbs: { label: "Carbohidratos", short: "C", unit: "g" },
    fat: { label: "Grasas", short: "G", unit: "g" },
    fiber: { label: "Fibra", short: "F", unit: "g" },
  },
  dashboard: {
    greetingMorning: "Buenos días",
    greetingAfternoon: "Buenas tardes",
    greetingEvening: "Buenas noches",
    goalLabel: "Objetivo",
    goals: {
      recomposicion: "Recomposición corporal",
      perdida_grasa: "Pérdida de grasa",
      ganancia_muscular: "Aumento de masa muscular",
      mantenimiento: "Mantenimiento",
    },
    hero: {
      eyebrow: "Respaldada por ciencia",
      tagline: "Entrena · Nutre · Progresa · Repite",
      cta: "Ver mi plan",
      // "Meta" y no "Calorías de hoy": mas abajo el plan muestra su propio
      // total, y ambos rotulos deben poder distinguirse de un vistazo.
      caloriesLabel: "Meta de hoy",
      caloriesRemaining: "restantes",
      caloriesExceeded: "por encima",
      caloriesNoTarget: "Define tu objetivo",
      nextTrainingLabel: "Próximo entreno",
      restDay: "Día de descanso",
      noPlan: "Sin rutina activa",
      activeDaysLabel: "Días activos",
      activeDaysUnit: "de 7",
    },
    pending: {
      title: "Pendientes de hoy",
      logMeal: "Registrar tu primera comida del día",
      completeCheckin: "Completar el diario (toma menos de 1 minuto)",
      train: "Tienes entrenamiento programado",
      allDone: "Todo al día. Buen trabajo.",
    },
    recommendation: {
      title: "Recomendación",
      confidence: "Confianza",
      confidenceLevels: { baja: "baja", media: "media", alta: "alta" },
    },
    nutrition: {
      title: "Nutrición de hoy",
      calories: "Calorías",
      consumed: "consumidas",
      remaining: "restantes",
      exceeded: "por encima del objetivo",
      protein: "Proteína",
      carbs: "Carbohidratos",
      fat: "Grasas",
      fiber: "Fibra",
      water: "Agua",
      targetNote:
        "Objetivo estimado y editable; no es una prescripción exacta.",
      noTargets: "Aún no tienes objetivos nutricionales.",
      // Las cuatro columnas de la vista Hoy (doc 13). "Faltan" en vez de
      // "restante" porque es como se dice, no como se documenta.
      columnTarget: "Objetivo",
      columnPlanned: "Plan",
      columnConsumed: "Llevas",
      columnRemaining: "Faltan",
      noPlanned:
        "No tienes una dieta activa, así que no hay plan del día con el que comparar.",
      /** Encabezado de la primera columna: solo para lectores de pantalla. */
      macroColumn: "Macronutriente",
      over: "de más",
      /**
       * Rotulo de la cifra troquelada, debajo de ella y en lenguaje llano.
       * Sin "kcal": la unidad va pegada a la cifra, arriba, y repetirla aqui
       * la decia dos veces en dos renglones seguidos.
       */
      remainingCaption: "te faltan hoy",
      overLabel: "de más",
      logMeal: "Registrar comida",
      dayNotStarted: "Todavía no has registrado nada de hoy.",
      planWithin: "Tu plan de hoy cae dentro de las tolerancias que definiste.",
      planOutside:
        "Tu plan de hoy no llega a tu objetivo en {macros}. Puedes ajustarlo o dejarlo: es tu margen, no un límite clínico.",
      consumedOver:
        "Ya pasaste tu objetivo de {macros}, más el margen que definiste.",
      macroNames: {
        calories: "calorías",
        protein: "proteína",
        carbs: "carbohidratos",
        fat: "grasas",
        fiber: "fibra",
      },
      // El aviso vive junto a la cifra desactualizada, no escondido en
      // Configuracion: es donde el usuario la esta mirando.
      outdated: "Estas cifras se calcularon con datos que ya cambiaron.",
      outdatedLink: "Revisar",
      noMeals: "Sin comidas registradas hoy.",
      viewPlan: "Ver plan del día",
      // La maqueta lee la cifra en una sola frase: "vas 1 340 de 2 091".
      progressOf: "vas {consumed} de {target}",
      planSums: "Tu plan de hoy suma {calories} kcal",
      // Fila "Próxima comida" de la maqueta (nodo 7:34).
      nextMeal: "Sigue: {meal}",
      nextMealEmpty: "Ya registraste todas las comidas del plan",
      nextMealEmptyHint: "No queda nada pendiente por hoy.",
      /** Sufijo de cada fila de macro: "44 g por comer". */
      toEat: "por comer",
      overSuffix: "de más",
    },
    training: {
      title: "Entrenamiento",
      scheduled: "Próxima sesión",
      mainExercises: "Ejercicios principales",
      estimatedDuration: "Duración estimada",
      minutes: "min",
      start: "Ir a entrenar",
      lastSession: "Última sesión",
      setsLogged: "series registradas",
      noPlan: "Aún no tienes una rutina activa.",
      createPlan: "Crear rutina",
    },
    progress: {
      title: "Progreso",
      lastWeight: "Último peso",
      average7: "Promedio 7 días",
      weeklyChange: "Cambio semanal",
      lastMeasurement: "Última medición",
      trend: { sube: "al alza", baja: "a la baja", estable: "estable" },
      trendNote:
        "El peso diario fluctua por agua, comida y otros factores; la tendencia se calcula con promedios de 7 días.",
      noData: "Registra tu peso para ver tendencias.",
      logWeight: "Registrar peso",
      chartTitle: "Peso y promedio de 7 días",
      chartDaily: "Peso diario",
      chartAverage: "Promedio 7 días",
    },
    checkin: {
      title: "Diario de hoy",
      done: "Completado",
      pendingAction: "Completar diario",
      sleep: "Sueño",
      hours: "h",
      hunger: "Hambre",
      energy: "Energía",
      stress: "Estrés",
      outOf5: "/5",
    },
    adherence: {
      title: "Adherencia (7 días)",
      workouts: "Entrenamientos",
      meals: "Días con comidas",
      weekLabel: "Tu semana",
      legend: "Casilla tenida: comiste. Punto: entrenaste.",
      dayTrained: "entrenaste",
      dayNoTraining: "sin entreno",
      dayAte: "registraste comidas",
      dayNoMeals: "sin comidas registradas",
    },
  },
  wellbeing: {
    title: "Como te sentiste hoy",
    description:
      "El sueño, el estrés y la energía explican buena parte de tu rendimiento y tu adherencia.",
    sleepHours: "Horas de sueño",
    sleepQuality: "Calidad del sueño",
    energy: "Energía",
    stress: "Estrés",
    soreness: "Dolor muscular",
    mood: "Animo",
    notes: "Notas",
    save: "Guardar como me senti",
    saved: "Registro guardado.",
    failed: "No pudimos guardar tu registro. Intenta de nuevo.",
    todayRegistered: "Ya registraste como te sentiste hoy. Puedes editarlo.",
    scaleHint: "1 = muy bajo · 5 = muy alto",
    trendTitle: "Últimos registros",
    noEntries:
      "Aún no has registrado como te sientes. Es útil para leer tu progreso junto a tus mediciones.",
  },
  history: {
    title: "Historial de cambios",
    description:
      "Todo cambio queda registrado con lo que había antes, lo que quedó después y por qué.",
    empty: "Aún no hay cambios registrados.",
    before: "Antes",
    after: "Después",
    reason: "Motivo",
    origin: "Origen",
    origins: {
      usuario: "Lo hiciste tu",
      ia: "Propuesto por la IA",
      sistema: "Automatico del sistema",
      importacion: "Importación",
    },
    actions: {
      alimento_sustituido: "Alimento sustituido",
      comida_estado_cambiado: "Estado de comida",
      ejercicio_sustituido: "Ejercicio sustituido",
      ejercicio_sustituido_por_dia: "Ejercicio sustituido solo por un día",
      alimento_importado: "Alimento importado",
      alimento_corregido: "Alimento corregido",
      comida_sustituida_por_receta: "Comida sustituida por receta",
      dieta_versionada: "Versión de dieta guardada",
      dieta_restaurada: "Dieta restaurada",
      rutina_versionada: "Versión de rutina guardada",
      rutina_restaurada: "Rutina restaurada",
      medicion_registrada: "Medición registrada",
      objetivos_recalculados: "Objetivos nutricionales actualizados",
    },
    retentionNote:
      "El historial no se borra automáticamente: es tu registro de lo que realmente paso.",
  },
} as const;

export type Messages = typeof messages;
