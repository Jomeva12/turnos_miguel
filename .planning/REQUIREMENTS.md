# Requirements: GestionTurnos v2.0

**Defined:** 2026-03-24
**Core Value:** La administradora puede generar los turnos del mes completo con un clic, respetando todas las reglas de negocio, y hacer ajustes manuales cuando sea necesario.

## v1 Requirements

Requirements for initial release (réplica 1:1 del sistema Laravel).

### Autenticación

- [x] **AUTH-01**: Administradora puede iniciar sesión con email y contraseña
- [x] **AUTH-02**: Sesión persiste entre recargas del navegador
- [x] **AUTH-03**: Administradora puede cerrar sesión desde cualquier página
- [x] **AUTH-04**: Rutas protegidas redirigen a login si no hay sesión activa

### Datos Base

- [x] **DATA-01**: Sistema carga ~30 empleados con nombre completo vía seeder
- [x] **DATA-02**: Sistema carga 7 áreas (General, Buffet, Cosmético, Domicilios, Electrodoméstico, Marking, Varely Camacho)
- [x] **DATA-03**: Administradora puede asignar áreas habilitadas por empleado (toggle checkbox, AJAX sin recarga)
- [x] **DATA-04**: Sistema carga plantillas de turno (shift_templates) con horarios específicos por día de la semana y área
- [x] **DATA-05**: Plantillas incluyen required_count por área/día (ej: Electrodoméstico 2 L/M/J/V, 3 Mié/Sáb)

### Generación Automática

- [x] **GEN-01**: Administradora puede generar turnos para un día específico
- [x] **GEN-02**: Administradora puede generar turnos para un rango de días
- [x] **GEN-03**: Administradora puede generar turnos para el mes completo con un clic
- [x] **GEN-04**: Algoritmo asigna 4 descansos por mes: 3 ordinarios + 1 domingo obligatorio
- [x] **GEN-05**: Algoritmo nunca asigna descansos en sábados
- [x] **GEN-06**: Algoritmo nunca asigna descansos en zona crítica (días 28 al 2 de cada mes)
- [x] **GEN-07**: Algoritmo rota empleados equitativamente: semanas alternadas mañana/tarde
- [x] **GEN-08**: Algoritmo asigna turnos partidos 2 veces por semana (si se presta)
- [x] **GEN-09**: Algoritmo respeta áreas habilitadas por empleado
- [x] **GEN-10**: Algoritmo excluye empleados con ausencias (vacaciones, incapacidad) del día
- [x] **GEN-11**: Algoritmo respeta reglas de área especial: Marking solo Mar/Jue, Varely Camacho solo Mié, Buffet sin domingo
- [x] **GEN-12**: Algoritmo asigna cobertura según required_count de shift_templates por área/día
- [x] **GEN-13**: Si un empleado se queda sin días para descanso, se fuerza en el siguiente día disponible
- [x] **GEN-14**: Turnos comodín disponibles por día de la semana para cubrir imprevistos

### Bitácora de Generación

- [x] **LOG-01**: Cada generación registra notas con tipo info/warning/error
- [x] **LOG-02**: Badge visible en la planilla muestra conteo de notas por severidad
- [x] **LOG-03**: Al hacer clic en el badge, modal muestra la bitácora completa del mes

### Planilla Principal

- [x] **PLAN-01**: Tabla cronograma mensual: filas = empleados, columnas = días del mes
- [x] **PLAN-02**: Selector de mes para navegar entre meses
- [x] **PLAN-03**: Encabezado de días en español (Lun, Mar, Mié...)
- [x] **PLAN-04**: Domingos resaltados en rojo
- [x] **PLAN-05**: Día actual marcado visualmente
- [x] **PLAN-06**: Cada celda muestra horario(s) del turno con colores por tipo de novedad
- [x] **PLAN-07**: Badge de área con color distintivo por celda
- [x] **PLAN-08**: Indicador visual de turno manual (ícono ✏️)
- [x] **PLAN-09**: Filtros por área (botones toggle para filtrar empleados)
- [x] **PLAN-10**: Filtros de novedades (VAC, INC, PER, CAL) con colores semánticos
- [x] **PLAN-11**: Botones de generación: Generar Mes, Limpiar Turnos, Limpiar Novedades, Excel, Asignación Manual

### Paneles Laterales

- [x] **SIDE-01**: Panel izquierdo (clic en día): total empleados trabajando, libres, en vacaciones, desglose por turno y área
- [x] **SIDE-02**: Panel derecho (clic en nombre): nombre del empleado, botón editar turnos, perfil del mes

### Asignación Manual

- [x] **MAN-01**: Vista de asignación manual con tabla editable (misma estructura que planilla)
- [x] **MAN-02**: Scroll vertical independiente con sticky headers (días arriba, nombres a la izquierda)
- [x] **MAN-03**: Celda esquina "ASESOR" sticky en ambas direcciones
- [x] **MAN-04**: Clic en celda abre modal lateral con plantillas de turno agrupadas por tipo
- [x] **MAN-05**: Modal incluye opciones de novedades (VAC, INC, PER, CAL, DESCANSO)
- [x] **MAN-06**: Guardado via AJAX sin recarga de página
- [x] **MAN-07**: Celdas con turno manual muestran indicador visual especial

### Editor Individual

- [x] **EDIT-01**: Vista de edición de turnos día por día para un empleado específico
- [x] **EDIT-02**: Grid de días del mes con estado actual de cada turno
- [x] **EDIT-03**: Permite seleccionar plantilla de horario para cada día y guardar via AJAX

### Novedades (Ausencias)

- [x] **ABS-01**: Administradora puede registrar vacaciones con fecha de inicio y fin (rango)
- [x] **ABS-02**: Vacaciones bloquean turnos en todos los días del rango
- [x] **ABS-03**: Administradora puede registrar incapacidades, permisos y calamidades
- [x] **ABS-04**: Administradora puede limpiar todas las novedades del mes

### Cronograma de Cobertura

- [x] **COV-01**: Vista horizontal del día seleccionado (6:00 a 22:00) en intervalos de 15 min
- [x] **COV-02**: Filas = áreas fijas; para General, una fila por trabajador asignado ese día
- [x] **COV-03**: Bloques coloreados representan el horario activo de cada empleado
- [x] **COV-04**: Título en español con fecha completa

### Exportación

- [x] **EXP-01**: Generar archivo .xlsx con la planilla del mes seleccionado
- [x] **EXP-02**: Formato tabular: empleados en filas, días en columnas, horario en cada celda
- [x] **EXP-03**: Días en MAYÚSCULAS en español

### Infraestructura

- [x] **INF-01**: App desplegada en Docker con EasyPanel
- [x] **INF-02**: Dark mode con gradientes y glassmorphism (réplica del estilo actual)
- [x] **INF-03**: Interfaz completamente en español

## v2 Requirements

Deferred to future release.

### Polish

- **POL-01**: CSS optimizado para impresión de la planilla
- **POL-02**: Registro masivo de ausencias (múltiples empleados, mismo rango)
- **POL-03**: Estado "borrador" vs "publicado" del cronograma

### Expansión

- **EXP-01**: Portal de empleados (ver su propio horario)
- **EXP-02**: Soporte multi-almacén
- **EXP-03**: Log de auditoría (quién cambió qué, cuándo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| App móvil nativa | Web responsive es suficiente para una admin |
| Multi-empresa/multi-almacén | Un solo almacén, no hay necesidad actual |
| Notificaciones a empleados | Solo una persona usa el sistema |
| Integración nómina/ERP | Fuera del alcance, Excel es el puente |
| Múltiples roles de admin | Un solo usuario administrador |
| IA/forecasting para turnos | Reglas determinísticas son el approach correcto |
| Empleados gestionan su horario | No hay cuentas de empleados |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| INF-01 | Phase 1 | Complete |
| INF-02 | Phase 1 | Complete |
| INF-03 | Phase 1 | Complete |
| GEN-01 | Phase 2 | Complete |
| GEN-02 | Phase 2 | Complete |
| GEN-03 | Phase 2 | Complete |
| GEN-04 | Phase 2 | Complete |
| GEN-05 | Phase 2 | Complete |
| GEN-06 | Phase 2 | Complete |
| GEN-07 | Phase 2 | Complete |
| GEN-08 | Phase 2 | Complete |
| GEN-09 | Phase 2 | Complete |
| GEN-10 | Phase 2 | Complete |
| GEN-11 | Phase 2 | Complete |
| GEN-12 | Phase 2 | Complete |
| GEN-13 | Phase 2 | Complete |
| GEN-14 | Phase 2 | Complete |
| LOG-01 | Phase 2 | Complete |
| LOG-02 | Phase 2 | Complete |
| LOG-03 | Phase 2 | Complete |
| PLAN-01 | Phase 3 | Complete |
| PLAN-02 | Phase 3 | Complete |
| PLAN-03 | Phase 3 | Complete |
| PLAN-04 | Phase 3 | Complete |
| PLAN-05 | Phase 3 | Complete |
| PLAN-06 | Phase 3 | Complete |
| PLAN-07 | Phase 3 | Complete |
| PLAN-08 | Phase 3 | Complete |
| PLAN-09 | Phase 3 | Complete |
| PLAN-10 | Phase 3 | Complete |
| PLAN-11 | Phase 3 | Complete |
| SIDE-01 | Phase 3 | Complete |
| SIDE-02 | Phase 3 | Complete |
| MAN-01 | Phase 3 | Complete |
| MAN-02 | Phase 3 | Complete |
| MAN-03 | Phase 3 | Complete |
| MAN-04 | Phase 3 | Complete |
| MAN-05 | Phase 3 | Complete |
| MAN-06 | Phase 3 | Complete |
| MAN-07 | Phase 3 | Complete |
| EDIT-01 | Phase 3 | Complete |
| EDIT-02 | Phase 3 | Complete |
| EDIT-03 | Phase 3 | Complete |
| ABS-01 | Phase 4 | Complete |
| ABS-02 | Phase 4 | Complete |
| ABS-03 | Phase 4 | Complete |
| ABS-04 | Phase 4 | Complete |
| COV-01 | Phase 4 | Complete |
| COV-02 | Phase 4 | Complete |
| COV-03 | Phase 4 | Complete |
| COV-04 | Phase 4 | Complete |
| EXP-01 | Phase 5 | Complete |
| EXP-02 | Phase 5 | Complete |
| EXP-03 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 63 total
- Mapped to phases: 63
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 — traceability filled by roadmapper*
