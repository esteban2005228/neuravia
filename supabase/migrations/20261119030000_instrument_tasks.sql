-- Full attention and memory evaluations adapted from the Neuravia instruments
-- (src/docs: "Instrumento de Evaluación Atención" and "... Memoria").
insert into public.tasks (code, domain, name, description, version, active) values
  ('ATT_instrument', 'attention', 'Evaluación de atención',
   'Cinco ejercicios: atención selectiva, focalizada, sostenida, dividida y alternante. Unos 8 minutos.', '1.0', true),
  ('MEM_instrument', 'memory', 'Evaluación de memoria',
   'Siete ejercicios: memoria a corto plazo, de trabajo, sensorial, semántica, episódica, procedimental y a largo plazo. Unos 10 minutos.', '1.0', true)
on conflict (code) do update
  set name = excluded.name, description = excluded.description, version = excluded.version, active = true;
