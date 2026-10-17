/**
 * Importa el catalogo de ejercicios desde un conjunto de DOMINIO PUBLICO.
 *
 *   npm run ejercicios                    # traduce, sube imagenes y escribe
 *   npm run ejercicios -- --seco          # solo informa
 *   npm run ejercicios -- --sin-imagenes
 *   npm run ejercicios -- --sin-traducir
 *
 * FUENTE: yuhonas/free-exercise-db, licencia Unlicense. 876 ejercicios, 873
 * con DOS fotografias cada uno —posicion inicial y final—, que es exactamente
 * la anatomia que esta app ya usa (`image_url` + `image_end_url`).
 *
 * Por que esta y no la anterior (hasaneyldrm, 1.324 con texto en español):
 * sus animaciones son de Gym visual y no se pueden redistribuir sin acordarlo
 * con ellos, asi que aquel catalogo entraba mudo. Se probo injertar estas
 * imagenes en aquellos nombres y solo coincidian 132 de 1.324. Un ejercicio
 * que no enseña como se hace sirve a medias en un gimnasio: mejor 873 que se
 * ven que 1.324 que no.
 *
 * Lo que cuesta: el texto viene en ingles y se traduce con Gemini, y las
 * fotografias se copian al bucket propio en vez de enlazarlas —enlazar ataria
 * la app a un repositorio ajeno y a sus limites de trafico—.
 *
 * IDEMPOTENTE en las tres partes: la fila se escribe por (source,
 * external_id), la imagen se salta si ya esta subida, y la traduccion se puede
 * omitir con su bandera para volver a correrlo sin gastar llamadas.
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const FUENTE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGENES =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

const SECO = process.argv.includes("--seco");
const SIN_IMAGENES = process.argv.includes("--sin-imagenes");
const SIN_TRADUCIR = process.argv.includes("--sin-traducir");

const LOTE_ESCRITURA = 100;
const LOTE_TRADUCCION = 15;
const SUBIDAS_EN_PARALELO = 8;
const BUCKET = "exercise-images";

/* ── Vocabularios ─────────────────────────────────────────────────────────
   El conjunto habla en ingles; el producto habla en español y con los mismos
   terminos que entiende el maniqui 3D (`features/training/lib/muscle-map.ts`).
   Lo que no tiene equivalente —el cuello— se omite en vez de forzarlo a la
   casilla mas parecida. */
const MUSCULOS = {
  abdominals: "abdominales",
  abductors: "abductores",
  adductors: "aductores",
  biceps: "biceps",
  calves: "gemelos",
  chest: "pecho",
  forearms: "antebrazo",
  glutes: "gluteos",
  hamstrings: "isquiotibiales",
  lats: "espalda",
  "lower back": "espalda baja",
  "middle back": "espalda",
  quadriceps: "cuadriceps",
  shoulders: "hombros",
  traps: "trapecio",
  triceps: "triceps",
};

const EQUIPO = {
  barbell: "barra",
  "e-z curl bar": "barra",
  dumbbell: "mancuernas",
  cable: "polea",
  machine: "maquina",
  "body only": "peso corporal",
  kettlebells: "kettlebell",
  bands: "banda",
  "medicine ball": "balon",
  "exercise ball": "balon",
  "foam roll": "rodillo",
};

/** El `level` del conjunto al `difficulty` que admite la tabla. */
const DIFICULTAD = {
  beginner: "principiante",
  intermediate: "intermedio",
  expert: "avanzado",
};

/* Un lado cada vez. El conjunto no lo dice, y el dato importa: un ejercicio
   unilateral cuenta la mitad de volumen por lado. */
const UNILATERAL =
  /\b(single|one[- ]arm|one[- ]leg|alternat\w*|unilateral|left|right)\b/i;

function normalizar(bruto) {
  const principal = MUSCULOS[(bruto.primaryMuscles ?? [])[0]];
  if (!principal) return null;

  const secundarios = [
    ...new Set(
      [
        ...(bruto.primaryMuscles ?? []).slice(1),
        ...(bruto.secondaryMuscles ?? []),
      ]
        .map((m) => MUSCULOS[m])
        .filter((m) => m && m !== principal),
    ),
  ];

  return {
    external_id: bruto.id,
    source: "importado",
    name: bruto.name,
    primary_muscle: principal,
    secondary_muscles: secundarios,
    equipment: EQUIPO[bruto.equipment] ?? null,
    difficulty: DIFICULTAD[bruto.level] ?? null,
    instructions: (bruto.instructions ?? []).join(" "),
    is_unilateral: UNILATERAL.test(bruto.name),
    joints: [],
    common_errors: [],
    technique_cues: [],
    /* Se llenan al subir las fotografias; sin ellas quedan nulos y la ficha
       simplemente no dibuja el bloque de imagenes. */
    image_url: null,
    image_end_url: null,
    _imagenes: bruto.images ?? [],
  };
}

/**
 * Tres intentos con espera creciente, y si no, `null`.
 *
 * El modelo devuelve 503 "high demand" cuando esta saturado, y eso tumbo la
 * primera importacion en el ejercicio 45 de 868: media hora de trabajo perdida
 * por un fallo temporal ajeno. Un servicio que se cae a ratos no puede decidir
 * si el catalogo entra o no.
 */
async function conReintentos(tarea, intentos = 3) {
  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      const { text } = await tarea();
      return text;
    } catch (error) {
      if (intento === intentos) return null;
      const espera = 2000 * intento;
      process.stdout.write(
        `\n  ${String(error?.message ?? error).slice(0, 60)} — reintento en ${espera / 1000}s`,
      );
      await new Promise((listo) => setTimeout(listo, espera));
    }
  }
  return null;
}

/* ── Traduccion ───────────────────────────────────────────────────────────
   En lotes y pidiendo JSON: una llamada por ejercicio serian 876 viajes. El
   nombre se traduce tambien, porque un catalogo mitad en ingles y mitad en
   español no es un catalogo. */
async function traducir(supabase, filas) {
  const modelo = google(process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash");
  let hechos = 0;

  for (let i = 0; i < filas.length; i += LOTE_TRADUCCION) {
    const lote = filas.slice(i, i + LOTE_TRADUCCION);
    const entrada = lote.map((f, n) => ({
      n,
      name: f.name,
      instructions: f.instructions,
    }));

    const texto = await conReintentos(() =>
      generateText({
        model: modelo,
        temperature: 0,
        prompt: [
          "Traduce al español de Latinoamerica estos ejercicios de gimnasio.",
          "Reglas:",
          "- Usa el nombre con el que se conoce el ejercicio en un gimnasio hispanohablante, no una traduccion literal.",
          "- Manten el equipo en el nombre (barra, mancuernas, polea) si el original lo lleva.",
          "- Las instrucciones, en segunda persona y sin numerar.",
          "- No añadas consejos ni advertencias que no esten en el original.",
          'Responde SOLO un array JSON con objetos {"n", "name", "instructions"}.',
          JSON.stringify(entrada),
        ].join("\n"),
      }),
    );

    if (texto === null) {
      /* El modelo no contesto ni tras los reintentos: este lote se queda en
         ingles y el importador sigue. Volver a correrlo lo recoge, porque los
         ya traducidos se saltan. */
      console.warn(
        `\n  aviso: el lote ${i / LOTE_TRADUCCION + 1} se queda en ingles`,
      );
      hechos += lote.length;
      continue;
    }

    try {
      const limpio = texto.replace(/^```(?:json)?|```$/gm, "").trim();
      for (const traducido of JSON.parse(limpio)) {
        const destino = lote[traducido.n];
        if (!destino) continue;
        if (traducido.name) destino.name = traducido.name.trim();
        if (traducido.instructions)
          destino.instructions = traducido.instructions.trim();
      }
    } catch {
      /* Un lote que no vuelve como JSON se queda en ingles: es peor perder el
         ejercicio que tenerlo sin traducir. */
      console.warn(
        `\n  aviso: el lote ${i / LOTE_TRADUCCION + 1} no se pudo traducir`,
      );
    }
    /* Se guarda el lote recien traducido antes de pedir el siguiente. Si el
       modelo se cae en el 45 —paso—, lo traducido hasta ahi ya esta en la
       base y la siguiente pasada arranca donde se quedo. */
    await escribir(supabase, lote);
    hechos += lote.length;
    console.log(`  traducidos ${hechos}/${filas.length}`);
  }
}

/* ── Fotografias ──────────────────────────────────────────────────────────
   Al bucket propio, no enlazadas: la app no debe depender de que un
   repositorio ajeno siga sirviendo ficheros. Se saltan las que ya estan, asi
   que volver a correr el importador no repite el trabajo. */
async function subirImagenes(supabase, filas, urlBase) {
  const tareas = [...filas];
  let subidas = 0;
  let saltadas = 0;
  let fallos = 0;

  const trabajador = async () => {
    while (tareas.length) {
      const fila = tareas.pop();
      const destinos = [];
      for (const [indice, ruta] of fila._imagenes.slice(0, 2).entries()) {
        const hoja = indice === 0 ? "inicio.jpg" : "final.jpg";
        const nombre = `${fila.external_id}/${hoja}`;
        const publica = `${urlBase}/storage/v1/object/public/${BUCKET}/${nombre}`;

        const { data: existe } = await supabase.storage
          .from(BUCKET)
          .list(fila.external_id, { search: hoja });
        if (existe?.length) {
          saltadas += 1;
          destinos.push(publica);
          continue;
        }

        const respuesta = await fetch(`${IMAGENES}/${ruta}`);
        if (!respuesta.ok) {
          fallos += 1;
          continue;
        }
        const cuerpo = new Uint8Array(await respuesta.arrayBuffer());
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(nombre, cuerpo, { contentType: "image/jpeg", upsert: true });
        if (error) {
          fallos += 1;
          continue;
        }
        subidas += 1;
        destinos.push(publica);
      }
      fila.image_url = destinos[0] ?? null;
      fila.image_end_url = destinos[1] ?? null;
      /* Se guarda en cuanto la fila tiene sus dos direcciones: si esto se
         interrumpe, lo subido ya esta enlazado y no se vuelve a subir. */
      await escribir(supabase, [fila]);
      if ((subidas + saltadas) % 50 === 0) {
        console.log(
          `  fotografias: ${subidas} subidas · ${saltadas} ya estaban · ${fallos} fallidas`,
        );
      }
    }
  };

  await Promise.all(
    Array.from({ length: SUBIDAS_EN_PARALELO }, () => trabajador()),
  );
  console.log(
    `  fotografias: ${subidas} subidas · ${saltadas} ya estaban · ${fallos} fallidas`,
  );
}

/** Escribe (o actualiza) filas por (source, external_id). */
async function escribir(supabase, filas) {
  for (let i = 0; i < filas.length; i += LOTE_ESCRITURA) {
    const lote = filas.slice(i, i + LOTE_ESCRITURA).map((fila) => {
      /* `_imagenes` es andamio del importador, no una columna. */
      const copia = { ...fila };
      delete copia._imagenes;
      return copia;
    });
    const { error } = await supabase
      .from("exercise_catalog")
      .upsert(lote, { onConflict: "source,external_id" });
    if (error) throw new Error(error.message);
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }

  console.log("Descargando el conjunto…");
  const respuesta = await fetch(FUENTE);
  if (!respuesta.ok) {
    console.error(`La fuente respondio ${respuesta.status}.`);
    process.exit(1);
  }
  const bruto = await respuesta.json();

  const filas = [];
  const descartados = [];
  for (const registro of bruto) {
    const fila = normalizar(registro);
    if (fila) filas.push(fila);
    else descartados.push(registro.name);
  }
  const conImagen = filas.filter((f) => f._imagenes.length >= 2).length;
  console.log(
    `  ${bruto.length} en origen · ${filas.length} traducibles · ` +
      `${descartados.length} descartados · ${conImagen} con las dos fotografias`,
  );
  if (descartados.length) {
    console.log(
      `  descartados (musculo sin equivalencia): ${descartados.join(", ")}`,
    );
  }

  if (SECO) {
    console.log("\nEn seco: no se escribio nada.");
    console.log(JSON.stringify({ ...filas[0], _imagenes: undefined }, null, 2));
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  /* Marca de tiempo del arranque: lo que no se toque en esta pasada es de la
     fuente anterior. Se limpia AL FINAL y por fecha, no por lista de ids: la
     primera version pedia los ids previos y PostgREST devuelve 1.000 como
     maximo, asi que con 1.324 filas se quedaba corta —y el borrado por lista
     larga fallaba sin que nadie mirara el error—. Medido: decia "retirados
     1000" y no habia retirado ninguna. */
  const arranque = new Date().toISOString();

  /* El orden importa, y es el de "que quede algo util si esto se corta":
     primero el catalogo en ingles y sin fotos —ya se puede buscar—, luego las
     fotografias, y al final la traduccion, que es la parte que depende de un
     servicio ajeno. Cada paso guarda lo suyo segun avanza. */
  console.log("Escribiendo el catalogo…");
  await escribir(supabase, filas);
  console.log(`  ${filas.length} filas`);

  if (!SIN_IMAGENES) {
    console.log("Copiando las fotografias al bucket propio…");
    await subirImagenes(supabase, filas, url);
  }

  if (!SIN_TRADUCIR) {
    /* Reanudable: si una fila ya esta en la base con otro nombre que el
       original ingles, es que ya se tradujo. Se adopta lo guardado y no se
       vuelve a pedir. */
    const { data: yaEstan } = await supabase
      .from("exercise_catalog")
      .select("external_id, name, instructions")
      .eq("source", "importado");
    const guardados = new Map(
      (yaEstan ?? []).map((fila) => [fila.external_id, fila]),
    );

    const pendientes = [];
    for (const fila of filas) {
      const guardado = guardados.get(fila.external_id);
      if (guardado && guardado.name !== fila.name) {
        fila.name = guardado.name;
        fila.instructions = guardado.instructions ?? fila.instructions;
      } else {
        pendientes.push(fila);
      }
    }

    if (pendientes.length) {
      console.log(
        `Traduciendo con Gemini… (${filas.length - pendientes.length} ya estaban)`,
      );
      await traducir(supabase, pendientes);
    } else {
      console.log("Traduccion: ya estaban todas.");
    }
  }

  /* Lo que sobro de la fuente anterior: importado y sin tocar en esta pasada.
     Se conserva lo que este dentro de una rutina, porque borrarlo dejaria un
     plan sin ejercicio. */
  const { data: enUso } = await supabase
    .from("workout_plan_exercises")
    .select("exercise_id");
  const usados = [...new Set((enUso ?? []).map((u) => u.exercise_id))];

  let limpieza = supabase
    .from("exercise_catalog")
    .delete({ count: "exact" })
    .eq("source", "importado")
    .lt("updated_at", arranque);
  if (usados.length)
    limpieza = limpieza.not("id", "in", `(${usados.join(",")})`);
  const { count: retirados, error: errorLimpieza } = await limpieza;
  if (errorLimpieza) {
    console.error(
      "  aviso: no se pudo limpiar la fuente anterior:",
      errorLimpieza.message,
    );
  } else if (retirados) {
    console.log(`  retirados ${retirados} de la fuente anterior`);
  }

  const { count } = await supabase
    .from("exercise_catalog")
    .select("id", { count: "exact", head: true });
  console.log(`Listo. El catalogo tiene ahora ${count} ejercicios.`);
}

await main();
