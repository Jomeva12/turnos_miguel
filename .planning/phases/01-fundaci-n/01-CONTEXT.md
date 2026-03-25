# Phase 1: Fundación - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

App desplegada en Docker con PostgreSQL, autenticación funcional (un solo admin), y todos los datos de referencia cargados via seeders: ~30 empleados reales, 7 áreas fijas, y plantillas de turno completas por día de la semana. La admin puede asignar áreas habilitadas por empleado desde la app.

</domain>

<decisions>
## Implementation Decisions

### Login y credenciales
- Glassmorphism mejorado con componentes shadcn/ui sobre fondo oscuro (no réplica pixel-perfect del Laravel, pero mismo concepto visual)
- Credenciales admin por defecto: yuli@diferencialdx.com / 3176890957a (vía seeder)
- Branding visible: "GestionTurnos v2.0" en login y navbar
- Sesión expirada: redirect silencioso al login, sin toast ni mensaje

### Datos semilla
- Nombres reales de los ~30 empleados, extraídos del EmployeeSeeder del repo Laravel (https://github.com/Jomeva12/yuli_turnos.git, rama main)
- Las 7 áreas cargadas del seeder, fijas y no editables desde la app: General, Buffet, Cosmético, Domicilios, Electrodoméstico, Marking, Varely Camacho
- Plantillas de turno exactas de datos_proyecto.md: todos los horarios por día de la semana y por área, incluyendo comodines
- Asignaciones empleado-área: en blanco por defecto. La admin las asigna manualmente desde la UI
- Empleados fijos del seeder — no se agregan ni eliminan desde la app

### UI de habilidades (empleado-área)
- Layout réplica del Laravel: tabla con lista de empleados y 7 columnas de checkboxes (una por área)
- Toggle instantáneo sin recarga de página (Server Action + revalidación)
- Feedback visual: solo cambio de color del checkbox (verde/gris), sin toast ni notificación
- Empleado sin ninguna área asignada: fila con warning visual sutil (borde amarillo o badge ⚠️)
- Orden de empleados: alfabético por nombre (A-Z)

### Navbar y layout shell
- Réplica de la estructura del Laravel: navbar superior con logo "GestionTurnos v2.0" a la izquierda, links de navegación al centro, "Cerrar Sesión" a la derecha
- Links: Planilla | Habilidades | Asignación Manual
- Solo desktop — sin optimización responsive ni hamburger menu
- Colores de badges de área: mismos colores que el sistema Laravel actual (extraer del código fuente)

### Claude's Discretion
- Componentes shadcn/ui específicos para la página de login (Card, Input, Button, etc.)
- Estructura exacta de archivos/carpetas dentro de app/
- Configuración de better-auth y middleware de protección de rutas
- Diseño del Dockerfile y docker-compose para EasyPanel
- Schema Prisma: nombres de tablas, tipos de columnas, relaciones exactas

</decisions>

<specifics>
## Specific Ideas

- El repo Laravel de referencia está en https://github.com/Jomeva12/yuli_turnos.git (rama main) — usar para extraer EmployeeSeeder, AreaSeeder, ShiftTemplateSeeder, y los colores de áreas
- "usa las page de el proyecto laravel" — la admin quiere que las vistas se vean como las del Laravel, no diseños nuevos
- Los empleados son "los asesores que están en el estado" — nómina fija, no cambia

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Ninguno — proyecto greenfield, codebase vacío

### Established Patterns
- Ninguno — se establecerán en esta fase (Prisma singleton, parseShift utility, formatSpanish utility, TZ=America/Bogota)

### Integration Points
- Repo Laravel (https://github.com/Jomeva12/yuli_turnos.git): fuente de seeders y referencia visual
- datos_proyecto.md: fuente de todas las plantillas de turno por día/área
- EasyPanel: destino de deploy con Docker

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-fundaci-n*
*Context gathered: 2026-03-24*
