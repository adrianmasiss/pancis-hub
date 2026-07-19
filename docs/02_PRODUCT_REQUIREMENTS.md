# 02 — Requisitos del producto

## 1. Resumen

Pancis Hub será una aplicación web progresiva orientada a la recomposición corporal. Integrará nutrición, entrenamiento, seguimiento, educación y recomendaciones personalizadas.

## 2. Objetivos del MVP

El MVP deberá permitir que un usuario:

1. Cree su perfil.
2. Defina su objetivo.
3. Registre métricas corporales.
4. Consulte su plan nutricional.
5. Intercambie alimentos por equivalentes.
6. Registre comidas y macros.
7. Consulte y registre su rutina.
8. Complete un diario diario.
9. Visualice tendencias de progreso.
10. Reciba recomendaciones generales contextualizadas.

## 3. Fuera del alcance inicial

- Diagnóstico médico.
- Tratamiento clínico.
- Prescripción farmacológica.
- Interpretación médica automática.
- Marketplace.
- Pagos.
- Panel profesional multiusuario.
- Integraciones completas con wearables.
- Reconocimiento fotográfico de alimentos.
- Generación automática de rutinas avanzadas.

## 4. Roles iniciales

### Usuario

Puede gestionar exclusivamente su propia información.

### Administrador

Puede gestionar alimentos, recetas, artículos, ejercicios y contenidos del sistema.

## 5. Módulos del MVP

### 5.1 Autenticación y perfil

Campos básicos:

- Nombre.
- Correo.
- Fecha de nacimiento.
- Sexo utilizado para cálculos fisiológicos, cuando sea necesario.
- Altura.
- Peso.
- Zona horaria.
- Nivel de experiencia.
- Días de entrenamiento.
- Objetivo.
- Preferencias alimentarias.
- Alergias.
- Restricciones.
- Unidad de medida.
- Tema visual.

### 5.2 Dashboard

Debe mostrar:

- Resumen del día.
- Calorías objetivo y consumidas.
- Proteínas, carbohidratos y grasas.
- Agua registrada.
- Entrenamiento programado.
- Tareas pendientes.
- Último peso.
- Tendencia del peso.
- Última medición corporal.
- Racha de registros.
- Recomendación prioritaria.

### 5.3 Nutrición

Funciones:

- Plan diario.
- Distribución por comidas.
- Objetivos por comida.
- Registro de alimentos.
- Registro de recetas.
- Copiar comidas.
- Marcar comida como completada.
- Ajustar porciones.
- Sustituir alimentos.
- Visualizar macros restantes.
- Guardar alimentos favoritos.
- Crear comidas frecuentes.

### 5.4 Motor de equivalencias

Cada alimento debe pertenecer a uno o más grupos nutricionales.

El intercambio debe considerar:

- Energía.
- Proteína.
- Carbohidratos.
- Grasas.
- Fibra.
- Tipo de alimento.
- Restricciones.
- Preferencias.
- Unidad disponible.
- Tolerancia de equivalencia.

El sistema no debe afirmar que dos alimentos son idénticos. Debe indicar que son aproximaciones nutricionales.

### 5.5 Recetas

Cada receta tendrá:

- Nombre.
- Descripción.
- Imagen.
- Ingredientes.
- Cantidades.
- Porciones.
- Pasos.
- Tiempo.
- Dificultad.
- Macros.
- Fibra.
- Etiquetas.
- Alérgenos.
- Sustituciones.
- Conservación.
- Indicaciones de meal prep.

### 5.6 Entrenamiento

Funciones:

- Consultar rutina.
- Ver ejercicios.
- Registrar series.
- Peso.
- Repeticiones.
- RPE o RIR.
- Tempo.
- Descanso.
- Notas.
- Historial.
- Récords personales.
- Volumen por grupo muscular.
- Sustitución de ejercicios.

### 5.7 Seguimiento

Métricas:

- Peso.
- Promedio móvil.
- Porcentaje de grasa.
- Masa muscular.
- Cintura.
- Cadera.
- Pecho.
- Brazo.
- Muslo.
- Fotografías.
- Rendimiento.
- Adherencia nutricional.
- Adherencia al entrenamiento.

### 5.8 Diario inteligente

Preguntas rápidas:

- Calidad del sueño.
- Horas de sueño.
- Hambre.
- Energía.
- Estrés.
- Dolor muscular.
- Estado de ánimo.
- Entrenamiento realizado.
- Cumplimiento nutricional.
- Nota libre.

### 5.9 Academia

Categorías:

- Recomposición corporal.
- Proteína.
- Carbohidratos.
- Grasas.
- Déficit energético.
- Hipertrofia.
- Volumen.
- Intensidad.
- Sueño.
- Recuperación.
- Creatina.
- Cafeína.
- Hidratación.
- Lectura de etiquetas.
- Mitos.

### 5.10 Asistente

El asistente deberá:

- Responder utilizando el perfil del usuario.
- Diferenciar educación de recomendación.
- Mostrar incertidumbre.
- No diagnosticar.
- No recomendar medicamentos.
- No sustituir profesionales sanitarios.
- Explicar el razonamiento en lenguaje sencillo.
- Proponer alternativas prácticas.

## 6. Requisitos no funcionales

### Rendimiento

- Carga inicial rápida.
- Navegación fluida.
- Imágenes optimizadas.
- Consultas paginadas.
- Uso de caché cuando corresponda.

### Accesibilidad

- Contraste suficiente.
- Navegación por teclado.
- Etiquetas semánticas.
- Texto escalable.
- Estados que no dependan solo del color.

### Seguridad

- Autenticación segura.
- Autorización por propietario.
- Cifrado en tránsito.
- Políticas de acceso a nivel de fila.
- Registros de cambios administrativos.
- Protección de archivos privados.

### Privacidad

- Fotografías privadas por defecto.
- Exportación de datos.
- Eliminación de cuenta.
- Consentimiento explícito.
- Política de retención.
- Minimización de datos.

### Compatibilidad

- Diseño mobile-first.
- Navegadores modernos.
- PWA instalable.
- Adaptación a tablet y escritorio.

## 7. Métricas iniciales

- Activación: usuario completa perfil y primer registro.
- Adherencia semanal.
- Días con diario completado.
- Entrenamientos registrados.
- Comidas registradas.
- Retención a 7 y 30 días.
- Uso del motor de equivalencias.
- Progreso percibido.
