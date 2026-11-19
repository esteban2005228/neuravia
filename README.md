# Neuravia

Plataforma que evalúa atención y memoria en el navegador y, según el perfil resultante, da sugerencias de prevención.
Para personas de 18 a 45 años. La prueba la puede hacer la persona sola, su profesional de salud o un familiar (acompañante).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + componentes estilo shadcn/ui
- Supabase: Postgres + Auth, con RLS en todas las tablas
- jsPsych 8 para las pruebas (tiempos de reacción medidos en el navegador)
- Netlify para el deploy (preview por rama)

## Desarrollo

```bash
cp .env.example .env.local   # llena la URL y la publishable key de Supabase
npm install
npm run dev
```

Scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` (puntuación de las pruebas).

## Base de datos

Las migraciones están en `supabase/migrations/` y se aplican en orden. Tablas:

| Tabla | Para qué |
| --- | --- |
| `profiles` | Una fila por cuenta: rol (paciente, profesional, acompañante) y nombre |
| `subjects` | La persona evaluada. Con cuenta propia (`user_id`) o registrada por un acompañante sin correo |
| `consents` | Consentimiento expreso por finalidad (servicio, investigación), con versión del aviso y forma de captura |
| `link_codes` | Códigos de un solo uso (24 h) que el paciente comparte |
| `links` | Quién puede aplicar pruebas a un paciente y ver sus resultados |
| `tasks` | Catálogo de pruebas |
| `assessments` | Una sesión de evaluación, con el modo (autoaplicada, profesional, acompañante) |
| `task_runs` | Ensayos crudos, métricas, índice 0–100 y nivel de cada prueba |

Las escrituras sensibles pasan por funciones `SECURITY DEFINER` que validan `auth.uid()`
(`complete_onboarding`, `create_managed_subject`, `create_link_code`, `redeem_link_code`, `start_assessment`,
`set_consent`, `revoke_link`, `delete_my_account`).

## Pruebas piloto

- **A2 Flanker** (atención selectiva): 8 ensayos de práctica + 48 de prueba, límite de 2 s. Índice = % de aciertos.
- **M2 Span de dígitos directo** (memoria a corto plazo): series de 3 a 9, dos por longitud, se detiene al fallar las dos.
  Índice = series correctas / 14.

Niveles provisionales mientras no hay normas: ≥90 Fortaleza, 70–89 Esperado, 50–69 Vigilar, <50 Sugerir valoración.

## Privacidad

Los resultados son datos personales sensibles (LFPDPPP). El aviso en `/privacidad` es una plantilla que debe revisar un
abogado. Cambiar `NOTICE_VERSION` en `lib/privacy.ts` cuando cambie el aviso.

## Supabase email templates

So that confirmation links work in any browser or device, set these in
Supabase › Authentication › Emails › Templates:

- **Confirm signup**: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Confirmar mi correo</a>`
- **Reset password**: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Cambiar mi contraseña</a>`

The built-in Supabase mailer only sends a few emails per hour; configure custom SMTP
(Authentication › Emails › SMTP Settings) before inviting real users.
