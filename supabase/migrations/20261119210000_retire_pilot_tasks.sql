-- Retire the pilot tasks (Flechas/Flanker and Span de dígitos). Only the full attention and
-- memory instruments stay available. Rows are kept so past results remain readable.
update public.tasks
set active = false
where code in ('A2_flanker', 'M2_digit_span');
