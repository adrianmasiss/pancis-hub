# 10 — Biblioteca científica y RAG

## Fuentes gratuitas

- PubMed E-utilities.
- Europe PMC.
- Crossref.
- OpenAlex.
- Guías oficiales.
- Archivos subidos legalmente.

## Roles

- OpenAlex/Crossref: descubrimiento y metadata.
- PubMed/Europe PMC: literatura biomédica.
- Europe PMC OA o documentos autorizados: texto completo.

## Copyright

No descargar ni almacenar PDFs protegidos sin permiso. Guardar metadata, identificadores, enlaces, resúmenes propios y fragmentos autorizados.

## Pipeline

```text
búsqueda -> deduplicación DOI/PMID -> clasificación
-> retractación -> extracción autorizada -> segmentación
-> embeddings -> revisión -> publicación
```

## Documento

Título, autores, año, DOI, PMID, tipo, población, intervención, comparador, resultados, limitaciones, licencia, acceso y última revisión.

## Claims

Crear afirmaciones estructuradas asociadas a referencias, grado, población y limitaciones.

## Actualización

Alertas mensuales, revisión manual, versionado y fecha visible.
