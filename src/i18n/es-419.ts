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
    recommended: "Recomendado",
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
  auth: {
    login: {
      title: "Inicia sesion",
      description: "Bienvenido de vuelta a Pancis Hub.",
      submit: "Iniciar sesion",
      noAccount: "¿No tienes cuenta?",
      registerLink: "Registrate",
      forgotPassword: "¿Olvidaste tu contrasena?",
    },
    register: {
      title: "Crea tu cuenta",
      description: "Empieza a construir tu recomposicion corporal.",
      submit: "Crear cuenta",
      hasAccount: "¿Ya tienes cuenta?",
      loginLink: "Inicia sesion",
    },
    recover: {
      title: "Recupera tu contrasena",
      description:
        "Te enviaremos un enlace para restablecer tu contrasena si el correo esta registrado.",
      submit: "Enviar enlace",
      sent: "Si el correo esta registrado, recibiras un enlace en unos minutos.",
      backToLogin: "Volver a iniciar sesion",
    },
    updatePassword: {
      title: "Nueva contrasena",
      description: "Define una nueva contrasena para tu cuenta.",
      submit: "Guardar contrasena",
      success: "Tu contrasena fue actualizada.",
    },
    fields: {
      displayName: "Nombre",
      email: "Correo electronico",
      password: "Contrasena",
      passwordConfirm: "Confirmar contrasena",
    },
    errors: {
      invalidCredentials: "Correo o contrasena incorrectos.",
      emailInUse: "Ese correo ya esta registrado.",
      weakPassword: "La contrasena debe tener al menos 8 caracteres.",
      passwordMismatch: "Las contrasenas no coinciden.",
      invalidEmail: "Ingresa un correo valido.",
      nameRequired: "Ingresa tu nombre.",
      sessionExpired: "El enlace expiro o no es valido. Solicita uno nuevo.",
      generic: "No pudimos completar la operacion. Intenta de nuevo.",
    },
  },
  onboarding: {
    title: "Configura tu cuenta",
    stepLabel: "Paso",
    ofLabel: "de",
    finish: "Guardar y comenzar",
    estimateNotice:
      "Estos valores son estimaciones iniciales editables, no diagnosticos ni mediciones exactas. Podras ajustarlos cuando quieras.",
    steps: {
      basics: {
        title: "Informacion basica",
        description: "Datos minimos para personalizar tus calculos.",
      },
      goal: {
        title: "Tu objetivo",
        description:
          "La recomposicion corporal es el enfoque principal de Pancis Hub.",
      },
      activity: {
        title: "Actividad y entrenamiento",
        description: "Cuentanos como te mueves en una semana normal.",
      },
      nutrition: {
        title: "Preferencias de alimentacion",
        description:
          "Restricciones y preferencias para no sugerirte lo que no comes.",
      },
      baseline: {
        title: "Linea base",
        description: "Tu punto de partida. Solo el peso es obligatorio.",
      },
      confirm: {
        title: "Confirma tu informacion",
        description:
          "Revisa el resumen y tus objetivos estimados antes de guardar.",
      },
    },
    fields: {
      displayName: "Nombre",
      birthDate: "Fecha de nacimiento",
      biologicalSex: "Sexo biologico",
      biologicalSexHelp:
        "Se usa solo para los calculos fisiologicos de tus estimaciones.",
      male: "Masculino",
      female: "Femenino",
      heightCm: "Altura (cm)",
      unitSystem: "Sistema de unidades",
      metric: "Metrico (kg, cm)",
      imperial: "Imperial (lb, in)",
      timezone: "Zona horaria",
      goal: "Objetivo",
      goalRecomposition: "Recomposicion corporal",
      goalRecompositionHelp: "Conservar musculo y reducir grasa a la vez.",
      goalFatLoss: "Perdida de grasa",
      goalMuscleGain: "Aumento de masa muscular",
      goalMaintenance: "Mantenimiento",
      experienceLevel: "Experiencia entrenando",
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado",
      trainingDays: "Dias de entrenamiento por semana",
      trainingType: "Tipo de entrenamiento",
      activityLevel: "Actividad cotidiana",
      sedentary: "Sedentaria",
      light: "Ligera",
      moderate: "Moderada",
      high: "Alta",
      dailySteps: "Pasos diarios aproximados",
      mealsPerDay: "Comidas al dia",
      usualTrainingTime: "Horario habitual de entrenamiento",
      allergies: "Alergias",
      restrictions: "Restricciones",
      dislikedFoods: "Alimentos que prefieres evitar",
      preferencesHelp: "Separa cada elemento con una coma.",
      weightKg: "Peso (kg)",
      bodyFatPercentage: "Porcentaje de grasa corporal",
      skeletalMuscleKg: "Masa muscular esqueletica (kg)",
      waistCm: "Cintura (cm)",
      measuredAt: "Fecha de medicion",
      measurementSource: "Fuente de la medicion",
      sourceManual: "Manual (bascula de casa)",
      sourceInbody: "InBody",
      sourceScale: "Bascula inteligente",
      sourceOther: "Otra",
    },
    summary: {
      profile: "Perfil",
      goal: "Objetivo",
      activity: "Actividad",
      nutrition: "Alimentacion",
      baseline: "Linea base",
      targets: "Objetivos nutricionales estimados",
      calories: "Calorias",
      protein: "Proteina",
      carbs: "Carbohidratos",
      fat: "Grasas",
      fiber: "Fibra",
      water: "Agua",
      perDay: "por dia",
      none: "Sin registrar",
    },
    errors: {
      required: "Este campo es obligatorio.",
      invalidDate: "Ingresa una fecha valida.",
      adultRequired: "Debes ser mayor de 18 anos para usar Pancis Hub.",
      heightRange: "Ingresa una altura entre 100 y 250 cm.",
      weightRange: "Ingresa un peso entre 30 y 300 kg.",
      percentRange: "Ingresa un porcentaje entre 3 y 60.",
      stepsRange: "Ingresa un numero de pasos entre 0 y 50000.",
      saveFailed: "No pudimos guardar tu informacion. Intenta de nuevo.",
    },
  },
  settings: {
    title: "Configuracion",
    profileSection: "Perfil",
    profileDescription: "Tu informacion basica y preferencias de la cuenta.",
    saved: "Cambios guardados.",
    saveFailed: "No pudimos guardar los cambios. Intenta de nuevo.",
  },
  dashboard: {
    greetingMorning: "Buenos dias",
    greetingAfternoon: "Buenas tardes",
    greetingEvening: "Buenas noches",
    goalLabel: "Objetivo",
    goals: {
      recomposicion: "Recomposicion corporal",
      perdida_grasa: "Perdida de grasa",
      ganancia_muscular: "Aumento de masa muscular",
      mantenimiento: "Mantenimiento",
    },
    pending: {
      title: "Pendientes de hoy",
      logMeal: "Registrar tu primera comida del dia",
      completeCheckin: "Completar el diario (toma menos de 1 minuto)",
      train: "Tienes entrenamiento programado",
      allDone: "Todo al dia. Buen trabajo.",
    },
    recommendation: {
      title: "Recomendacion",
      confidence: "Confianza",
      confidenceLevels: { baja: "baja", media: "media", alta: "alta" },
    },
    nutrition: {
      title: "Nutricion de hoy",
      calories: "Calorias",
      consumed: "consumidas",
      remaining: "restantes",
      exceeded: "por encima del objetivo",
      protein: "Proteina",
      carbs: "Carbohidratos",
      fat: "Grasas",
      fiber: "Fibra",
      water: "Agua",
      targetNote:
        "Objetivo estimado y editable; no es una prescripcion exacta.",
      noTargets: "Aun no tienes objetivos nutricionales.",
      noMeals: "Sin comidas registradas hoy.",
      viewPlan: "Ver plan del dia",
    },
    training: {
      title: "Entrenamiento",
      scheduled: "Proxima sesion",
      mainExercises: "Ejercicios principales",
      estimatedDuration: "Duracion estimada",
      minutes: "min",
      start: "Ir a entrenar",
      lastSession: "Ultima sesion",
      setsLogged: "series registradas",
      noPlan: "Aun no tienes una rutina activa.",
      createPlan: "Crear rutina",
    },
    progress: {
      title: "Progreso",
      lastWeight: "Ultimo peso",
      average7: "Promedio 7 dias",
      weeklyChange: "Cambio semanal",
      lastMeasurement: "Ultima medicion",
      trend: { sube: "al alza", baja: "a la baja", estable: "estable" },
      trendNote:
        "El peso diario fluctua por agua, comida y otros factores; la tendencia se calcula con promedios de 7 dias.",
      noData: "Registra tu peso para ver tendencias.",
      logWeight: "Registrar peso",
      chartTitle: "Peso y promedio de 7 dias",
      chartDaily: "Peso diario",
      chartAverage: "Promedio 7 dias",
    },
    checkin: {
      title: "Diario de hoy",
      done: "Completado",
      pendingAction: "Completar diario",
      sleep: "Sueno",
      hours: "h",
      hunger: "Hambre",
      energy: "Energia",
      stress: "Estres",
      outOf5: "/5",
    },
    adherence: {
      title: "Adherencia (7 dias)",
      checkins: "Diarios",
      workouts: "Entrenamientos",
      meals: "Dias con comidas",
      streak: "Racha de diario",
      days: "dias",
      day: "dia",
    },
  },
} as const;

export type Messages = typeof messages;
