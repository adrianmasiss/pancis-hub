-- La justificacion de los rangos de proteina se le muestra al usuario (el
-- copiloto la cita tal cual), pero hablaba de la historia interna del dato:
-- «Sustituye al valor unico de 1.8 g/kg» y «la investigacion aportada por el
-- usuario en /Info». Se deja solo lo que le sirve a quien la lee.
update public.formula_versions
set rationale = 'La necesidad cambia con el objetivo: en déficit se sube para conservar masa magra; en mantenimiento no hace falta tanto.'
where key = 'protein_ranges'
  and rationale like '%/Info%';
