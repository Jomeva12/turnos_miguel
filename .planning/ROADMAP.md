# Roadmap: GestionTurnos v2.0

## Overview

La reconstruccion del sistema de turnos parte de la base de datos y la autenticacion, sube al algoritmo de generacion (el componente de mayor riesgo), construye la planilla principal con todos sus controles interactivos, agrega el registro de ausencias y la vista de cobertura horaria, y cierra con la exportacion a Excel y los controles de limpieza. Cada fase entrega una capacidad completa y verificable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Fundacion** - Proyecto desplegado en Docker con PostgreSQL, autenticacion funcional y datos semilla cargados (completed 2026-03-24)
- [x] **Phase 2: Algoritmo de Generacion** - Motor de turnos puro con reglas de negocio completas, validado contra el sistema Laravel existente (completed 2026-03-25)
- [x] **Phase 3: Planilla Principal** - Vista cronograma mensual interactiva con generacion, asignacion manual y editor individual (completed 2026-03-25)
- [ ] **Phase 4: Ausencias y Cobertura** - Registro de novedades y vista Gantt de cobertura horaria por area
- [x] **Phase 5: Exportacion y Limpieza** - Descarga .xlsx y controles de limpiar turnos/novedades del mes (completed 2026-03-25)

## Phase Details

### Phase 1: Fundacion
**Goal**: La administradora puede iniciar sesion en la app desplegada en Docker, con todos los datos de referencia ya cargados (empleados, areas, plantillas)
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, INF-01, INF-02, INF-03
**Success Criteria** (what must be TRUE):
  1. La administradora puede iniciar sesion con email/contrasena y la sesion persiste al recargar el navegador
  2. La administradora puede cerrar sesion desde cualquier pagina
  3. Las rutas protegidas redirigen al login cuando no hay sesion activa
  4. La app corre en Docker con EasyPanel con dark mode y glassmorphism, interfaz en espanol
  5. ~30 empleados, 7 areas y todas las plantillas de turno estan cargadas; la administradora puede asignar areas habilitadas por empleado
**Plans:** 4/4 plans complete

Plans:
- [x] 01-01-PLAN.md -- Scaffolding Next.js, Prisma schema, seed data, utilidades base
- [x] 01-02-PLAN.md -- Auth con better-auth, login glassmorphism, navbar
- [x] 01-03-PLAN.md -- Pagina Habilidades con tabla checkboxes empleado-area
- [x] 01-04-PLAN.md -- Docker + docker-compose + verificacion end-to-end

### Phase 2: Algoritmo de Generacion
**Goal**: El motor de generacion produce asignaciones correctas para cualquier mes, validadas regla por regla contra la salida del sistema Laravel
**Depends on**: Phase 1
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07, GEN-08, GEN-09, GEN-10, GEN-11, GEN-12, GEN-13, GEN-14, LOG-01, LOG-02, LOG-03
**Success Criteria** (what must be TRUE):
  1. La generacion asigna exactamente 4 descansos por empleado por mes (3 ordinarios + 1 domingo), nunca en sabado ni en zona critica dias 28-2
  2. La rotacion manana/tarde alterna semanas y los turnos partidos se asignan dos veces por semana cuando aplica
  3. Las reglas de area especial se respetan: Marking solo mar/jue, Varely Camacho solo mie, Buffet sin domingo; cobertura por required_count de shift_templates
  4. Empleados con ausencias o sin habilidades en el area son excluidos del dia correspondiente
  5. Cada generacion produce una bitacora con notas info/warning/error accesible desde la planilla
**Plans:** 5/5 plans complete

Plans:
- [x] 02-01-PLAN.md -- Tipos TypeScript y capa de queries Prisma (empleados, plantillas, turnos, ausencias, bitacora)
- [x] 02-02-PLAN.md -- TDD: suite de tests para todas las reglas de negocio del algoritmo (RED phase)
- [ ] 02-03-PLAN.md -- Implementacion del servicio puro generateMonthShifts (GREEN phase)
- [ ] 02-04-PLAN.md -- Server Actions de generacion + pagina /bitacora con badges info/warning/error
- [ ] 02-05-PLAN.md -- Test de integracion contra DB semilla + checkpoint de verificacion humana

### Phase 3: Planilla Principal
**Goal**: La administradora puede ver el cronograma mensual completo, disparar la generacion, hacer asignaciones manuales celda por celda y editar el horario individual de cada empleado
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07, PLAN-08, PLAN-09, PLAN-10, PLAN-11, SIDE-01, SIDE-02, MAN-01, MAN-02, MAN-03, MAN-04, MAN-05, MAN-06, MAN-07, EDIT-01, EDIT-02, EDIT-03
**Success Criteria** (what must be TRUE):
  1. La tabla cronograma muestra empleados en filas y dias del mes en columnas, con domingos en rojo y el dia actual marcado; el selector de mes navega entre meses
  2. Cada celda muestra horario con color por tipo de novedad, badge de area, e indicador visual si el turno es manual
  3. Los filtros por area y por tipo de novedad filtran la planilla sin recargar la pagina
  4. La vista de asignacion manual permite hacer clic en cualquier celda para abrir el modal lateral y guardar el turno via AJAX
  5. El editor individual de empleado muestra un grid dia por dia del mes y permite cambiar la plantilla de horario para cualquier dia
**Plans:** 5/5 plans complete

Plans:
- [ ] 03-01-PLAN.md -- Tipos TypeScript y capa de queries Prisma para planilla
- [ ] 03-02-PLAN.md -- Planilla principal: RSC shell, tabla cronograma, filtros, toolbar
- [ ] 03-03-PLAN.md -- Paneles laterales: cobertura por dia y perfil de empleado
- [ ] 03-04-PLAN.md -- Asignacion manual: sticky headers, modal lateral, Server Action assignShift
- [ ] 03-05-PLAN.md -- Editor individual: grid de dias por empleado, reutiliza AsignacionModal

### Phase 4: Ausencias y Cobertura
**Goal**: La administradora puede registrar vacaciones, incapacidades y demas novedades para cualquier empleado, y verificar la cobertura horaria del dia en una vista Gantt
**Depends on**: Phase 3
**Requirements**: ABS-01, ABS-02, ABS-03, ABS-04, COV-01, COV-02, COV-03, COV-04
**Success Criteria** (what must be TRUE):
  1. La administradora puede registrar vacaciones con rango de fechas y los turnos en ese rango quedan bloqueados automaticamente
  2. La administradora puede registrar incapacidades, permisos y calamidades para cualquier empleado
  3. La vista de cobertura muestra la linea de tiempo horizontal (6:00-22:00) del dia seleccionado, con bloques coloreados por empleado y filas por area
  4. La administradora puede limpiar todas las novedades del mes desde la planilla
**Plans:** 2/3 plans executed

Plans:
- [ ] 04-01-PLAN.md -- API routes y Server Actions para ausencias (CRUD + limpiar mes)
- [ ] 04-02-PLAN.md -- Pagina Ausencias: formulario de registro y lista del mes
- [ ] 04-03-PLAN.md -- Vista Gantt de cobertura horaria (6:00-22:00 por area)

### Phase 5: Exportacion y Limpieza
**Goal**: La administradora puede descargar la planilla del mes como archivo .xlsx y puede limpiar los turnos del mes para regenerar desde cero
**Depends on**: Phase 4
**Requirements**: EXP-01, EXP-02, EXP-03
**Success Criteria** (what must be TRUE):
  1. El boton Excel genera y descarga un archivo .xlsx con empleados en filas, dias en columnas y horarios en cada celda
  2. Los encabezados de dias aparecen en MAYUSCULAS en espanol y los turnos partidos se renderizan como dos lineas separadas (no el literal pipe)
  3. El boton Limpiar Turnos elimina todos los turnos del mes seleccionado y deja la planilla lista para regenerar
**Plans:** 2/2 plans complete

Plans:
- [ ] 05-01-PLAN.md -- ExcelJS Route Handler para exportacion .xlsx
- [ ] 05-02-PLAN.md -- Server Actions para Limpiar Turnos y Limpiar Novedades

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fundacion | 4/4 | Complete   | 2026-03-24 |
| 2. Algoritmo de Generacion | 5/5 | Complete   | 2026-03-25 |
| 3. Planilla Principal | 5/5 | Complete   | 2026-03-25 |
| 4. Ausencias y Cobertura | 2/3 | In Progress|  |
| 5. Exportacion y Limpieza | 2/2 | Complete   | 2026-03-25 |
