---
inclusion: auto
---

# Buenas Prácticas — conAlma

## Cómo Trabajamos

### Flujo de Desarrollo

1. **Siempre trabajar en branch** — nunca push directo a `main`
2. **Commit messages** — usar gitmoji + conventional commits:
   - `✨ feat:` nueva funcionalidad
   - `🐛 fix:` corrección de bug
   - `🎨 fix:` ajustes visuales/estilos
   - `📝 update:` documentación o contenido
   - `🔧 fix:` configuración
3. **Verificar TypeScript antes de commit** — `npx tsc --noEmit` debe pasar sin errores
4. **Deploy automático** — Vercel deploya al pushear a `main`. Verificar el deploy en Vercel dashboard.

### Principios de Código

- **Server components por defecto** — Solo usar `'use client'` cuando se necesite interactividad (useState, useEffect, onClick)
- **API Routes para lógica de negocio** — No poner lógica de DB en components, siempre en `/api/`
- **Validación con Zod** — Todo input de usuario se valida server-side con Zod schemas
- **Prisma para DB** — Nunca SQL raw excepto migraciones. Usar los métodos tipados de Prisma.
- **Auth en cada API route** — Usar `getProfessionalSession()` o verificar sesión antes de operar

### Seguridad

- **Nunca commitear secrets** — Todo en variables de entorno de Vercel
- **Filtrar por professionalId** — TODA query del portal profesional debe incluir `WHERE professionalId = X`
- **Validar ownership** — Antes de modificar un recurso, verificar que pertenece al usuario autenticado
- **Tokens encriptados** — OAuth refresh tokens se guardan encriptados (AES-256-GCM)
- **bcrypt para passwords** — Salt rounds 12, nunca guardar texto plano

### Estilos y UI

- **Mobile-first obligatorio** — Clases base para mobile, prefijos `sm:`, `md:`, `lg:` para desktop
- **Estilos globales en componentes base** — No repetir `bg-white`, `h-10` en cada uso. Editar `src/components/ui/input.tsx`, etc.
- **Colores del brand** — Solo usar: grape (#3C1955), plum (#D2AAF0), jasmine (#FFE169), lilac (#FAF5FA)
- **Touch targets 44px** — Todo elemento interactivo mínimo h-10 o min-h-[44px]
- **Texto en español** — UI visible al usuario siempre en español
- **Toast con Sonner** — Para feedback de acciones (éxito, error)

### Manejo de Errores

- **API routes**: try/catch con `{ error: 'CODE' }` + status code apropiado
- **Componentes client**: estado de error + mensaje amigable en español
- **Fire-and-forget** para servicios no-críticos: Google Calendar, emails (no bloquean el flujo principal)
- **Logs con prefijo** — `[Webhook]`, `[Email]`, `[google-oauth]` para facilitar debugging

### Base de Datos

- **Migraciones con Prisma** — `npx prisma migrate dev --name descripcion`
- **Si migrate falla (Neon advisory lock)**: generar SQL con `prisma migrate diff`, ejecutar con `prisma db execute --stdin`, registrar manualmente en `_prisma_migrations`
- **Unique constraints** — Usar `@unique` para campos que no deben duplicarse (Patient.email, Professional.email, User.email)
- **Upsert para deduplicación** — Cuando un registro puede existir previamente, usar `prisma.model.upsert()` en vez de `create()`

### Testing

- **Probar en producción con datos reales** antes de entregar features
- **Verificar flujo completo** — Login → acción → resultado esperado
- **Probar en mobile** — El tráfico viene de Instagram/TikTok (celular)
- **Verificar emails** — Que lleguen y se vean bien en Gmail mobile

### Patrones Recurrentes

```typescript
// Auth check en API routes del profesional
const { error, professionalId } = await getProfessionalSession();
if (error) return error;

// Validación con Zod
const parsed = schema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
    { status: 422 },
  );
}

// Upsert por campo unique
const record = await prisma.model.upsert({
  where: { email },
  update: { ...updatedFields },
  create: { ...allFields },
});

// Fetch desde client component
const [data, setData] = useState<T | null>(null);
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  fetch('/api/endpoint')
    .then((r) => r.json())
    .then(setData)
    .finally(() => setIsLoading(false));
}, []);
```

### Lo que NO hacer

- ❌ No usar `type="email"` en login (el admin usa username sin @)
- ❌ No confiar en `session.user.mustChangePassword` del JWT (puede estar stale) — leer de DB en layouts
- ❌ No usar `new Date(isoString).getDate()` para comparar fechas (timezone bug) — usar `string.split('T')[0]`
- ❌ No usar `asChild` en shadcn v4 — usar `render` prop
- ❌ No crear pacientes con `create()` — siempre `upsert` por email
- ❌ No bloquear confirmación de pago por fallos de Google Calendar
