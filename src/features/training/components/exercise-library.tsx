import Link from "next/link";
import { LayoutGrid, Search } from "lucide-react";
import { ExerciseDetailSheet } from "./exercise-detail-sheet";
import { MuscleFigure } from "./muscle-figure";
import {
  COLECCIONES,
  GRUPOS_MUSCULARES,
  grupoDelMusculo,
  rotuloCatalogo,
  type Coleccion,
  type GrupoMuscular,
} from "../lib/library-groups";
import { CATALOGO_POR_PAGINA, type BibliotecaEjercicio } from "../queries";

export type LibraryParams = {
  q?: string;
  grupo?: GrupoMuscular;
  equipo?: string;
  coleccion: Coleccion;
  pagina?: number;
};

/* Los filtros viajan en la URL, como en la biblioteca de alimentos: un filtro
   se puede guardar o compartir, y «atrás» vuelve a la búsqueda anterior. */
function href(params: Partial<LibraryParams>): string {
  const search = new URLSearchParams({ vista: "biblioteca" });
  if (params.q) search.set("q", params.q);
  if (params.grupo) search.set("grupo", params.grupo);
  if (params.equipo) search.set("equipo", params.equipo);
  if (params.coleccion && params.coleccion !== "todos")
    search.set("coleccion", params.coleccion);
  if (params.pagina && params.pagina > 1)
    search.set("pagina", String(params.pagina));
  return `/entrenamiento?${search}`;
}

/**
 * La biblioteca de ejercicios, con la forma de la de alimentos: categorías
 * por grupo muscular, colecciones con el buscador al lado y una rejilla de
 * fichas con foto. Lo que en un alimento son las calorías, aquí es el músculo
 * que trabaja.
 */
export function ExerciseLibrary({
  params,
  exercises,
  total,
  equipment,
}: {
  params: LibraryParams;
  exercises: BibliotecaEjercicio[];
  total: number;
  equipment: string[];
}) {
  const { q, grupo, equipo, coleccion } = params;
  const page = params.pagina ?? 1;
  const paginas = Math.max(1, Math.ceil(total / CATALOGO_POR_PAGINA));
  const filtros = { q, grupo, equipo, coleccion };
  const titulo = q
    ? `Resultados para «${q}»`
    : coleccion === "rutinas"
      ? "Los ejercicios de tus rutinas"
      : coleccion === "recientes"
        ? "Lo que entrenaste hace poco"
        : grupo
          ? `Ejercicios de ${GRUPOS_MUSCULARES.find((g) => g.id === grupo)!.label.toLowerCase()}`
          : "Tu biblioteca de ejercicios";

  return (
    <div className="food-library exercise-library">
      <section aria-labelledby="exercise-categories-title">
        <div className="library-section-heading">
          <h2 id="exercise-categories-title">Explora por músculo</h2>
          <span>Encuentra lo que necesitas</span>
        </div>
        <nav className="library-categories" aria-label="Grupos musculares">
          <Link
            href={href({ ...filtros, grupo: undefined })}
            aria-current={!grupo ? "true" : undefined}
            scroll={false}
          >
            <LayoutGrid size={28} />
            <span>Todos</span>
          </Link>
          {GRUPOS_MUSCULARES.map((g) => (
            <Link
              key={g.id}
              href={href({ ...filtros, grupo: g.id })}
              aria-current={grupo === g.id ? "true" : undefined}
              scroll={false}
            >
              <MuscleFigure muscles={g.catalogo} className="muscle-figure" />
              <span>{g.label}</span>
            </Link>
          ))}
        </nav>
      </section>

      <div className="nutrition-workspace library-views-tabs">
        <div className="nutrition-navigation">
          <nav
            className="nutrition-workspace-tabs"
            aria-label="Colecciones de ejercicios"
          >
            {COLECCIONES.map((c) => (
              <Link
                key={c.id}
                aria-current={coleccion === c.id ? "page" : undefined}
                href={href({ ...filtros, coleccion: c.id })}
                scroll={false}
              >
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Busca dentro de la colección y el grupo elegidos. */}
        <form
          action="/entrenamiento"
          method="get"
          role="search"
          className="exercise-library-search"
        >
          <input type="hidden" name="vista" value="biblioteca" />
          {grupo && <input type="hidden" name="grupo" value={grupo} />}
          {equipo && <input type="hidden" name="equipo" value={equipo} />}
          {coleccion !== "todos" && (
            <input type="hidden" name="coleccion" value={coleccion} />
          )}
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar un ejercicio"
            aria-label="Buscar un ejercicio"
            maxLength={80}
          />
        </form>
      </div>

      <section aria-labelledby="exercise-results-title">
        <div className="library-section-heading">
          <div>
            <h2 id="exercise-results-title">{titulo}</h2>
            <p>Toca una ficha para ver cómo se hace y qué músculos trabaja.</p>
          </div>
          <span>
            {new Intl.NumberFormat("es-CR").format(total)}{" "}
            {total === 1 ? "ejercicio" : "ejercicios"}
            {paginas > 1 ? ` · página ${page} de ${paginas}` : ""}
          </span>
        </div>

        {/* El equipo, en una fila discreta: filtra sin competir con las
            categorías. */}
        <nav className="exercise-library-equipment" aria-label="Equipo">
          <Link
            href={href({ ...filtros, equipo: undefined })}
            aria-current={!equipo ? "true" : undefined}
            scroll={false}
          >
            Todo el equipo
          </Link>
          {equipment.map((e) => (
            <Link
              key={e}
              href={href({ ...filtros, equipo: e })}
              aria-current={equipo === e ? "true" : undefined}
              scroll={false}
            >
              {rotuloCatalogo(e)}
            </Link>
          ))}
        </nav>

        {exercises.length ? (
          <ul className="food-library-grid">
            {exercises.map((e) => (
              <ExerciseCard key={e.id} exercise={e} />
            ))}
          </ul>
        ) : (
          <div className="v11-card library-empty">
            <h3>
              {q
                ? `Sin resultados para «${q}»`
                : coleccion === "rutinas"
                  ? "Tus rutinas todavía no tienen ejercicios"
                  : coleccion === "recientes"
                    ? "Aún no registras ejercicios"
                    : "Ningún ejercicio con estos filtros"}
            </h3>
            <p>
              {q
                ? "Prueba con un nombre más general, en español o en inglés."
                : "Prueba con otro grupo o quita los filtros."}
            </p>
            {(q || grupo || equipo || coleccion !== "todos") && (
              <div>
                <Link href={href({})} scroll={false}>
                  Quitar filtros
                </Link>
              </div>
            )}
          </div>
        )}

        {paginas > 1 && (
          <nav className="library-pages" aria-label="Páginas de la biblioteca">
            {page > 1 ? (
              <Link
                href={href({ ...filtros, pagina: page - 1 })}
                rel="prev"
                data-glow=""
              >
                ← Anteriores
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            <span>
              {page} de {new Intl.NumberFormat("es-CR").format(paginas)}
            </span>
            {page < paginas ? (
              <Link
                href={href({ ...filtros, pagina: page + 1 })}
                rel="next"
                data-glow=""
              >
                Siguientes →
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        )}
      </section>
    </div>
  );
}

function ExerciseCard({ exercise: e }: { exercise: BibliotecaEjercicio }) {
  const grupo = grupoDelMusculo(e.primaryMuscle);
  const secundarios = e.secondaryMuscles.filter((m) => m !== e.primaryMuscle);
  const detalle = [
    e.equipment ? rotuloCatalogo(e.equipment) : null,
    e.isUnilateral ? "Unilateral" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="v11-card food-library-card exercise-card">
      <div className="library-food-photo">
        {e.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage propio, sin next/image en el resto del proyecto
          <img src={e.imageUrl} alt="" loading="lazy" />
        ) : (
          <MuscleFigure
            muscles={[e.primaryMuscle]}
            className="muscle-figure exercise-card-figure"
          />
        )}
        <span className="library-food-category">
          {grupo?.label ?? rotuloCatalogo(e.primaryMuscle)}
        </span>
        {e.inRoutine && (
          <span className="exercise-card-routine">En tu rutina</span>
        )}
      </div>
      <div className="library-food-body">
        <h3 title={e.name}>{e.name}</h3>
        {detalle && <p className="library-food-brand">{detalle}</p>}
        <p className="exercise-card-muscles">
          <strong>{rotuloCatalogo(e.primaryMuscle)}</strong>
          {secundarios.length > 0 && (
            <span>
              +{" "}
              {secundarios
                .slice(0, 3)
                .map((m) => rotuloCatalogo(m).toLowerCase())
                .join(", ")}
            </span>
          )}
        </p>
        {e.curated && (
          <p
            className="library-food-source"
            title="Escrito a mano: la comparación de alternativas solo propone estos."
          >
            Con biomecánica
          </p>
        )}
        <div className="library-food-actions">
          <ExerciseDetailSheet
            exerciseId={e.id}
            exerciseName={e.name}
            triggerLabel="Cómo hacerlo"
            triggerClassName="library-use-button exercise-card-how"
          />
        </div>
      </div>
    </li>
  );
}
