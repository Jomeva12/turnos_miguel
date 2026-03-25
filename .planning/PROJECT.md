# GestionTurnos v2.0

## What This Is

Sistema de gestión de turnos mensuales para ~30 empleados de un almacén tipo centro comercial. Permite a la administradora generar automáticamente los turnos del mes respetando reglas complejas de descanso, rotación equitativa, y cobertura por áreas. Réplica funcional 1:1 del sistema Laravel existente (v1.0 en producción en yuli.diferencialdx.com), reconstruido en Next.js + PostgreSQL.

## Core Value

La administradora puede generar los turnos del mes completo con un clic, respetando todas las reglas de negocio (descansos, rotación, cobertura por área), y hacer ajustes manuales cuando sea necesario.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Autenticación con email/password
- [ ] Planilla principal: tabla cronograma mensual (filas=empleados, columnas=días)
- [ ] Selector de mes para navegar entre meses
- [ ] Generación automática de turnos (día, rango, mes completo)
- [ ] Algoritmo de descansos: 4/mes (3 ordinarios + 1 domingo), sin descansos sábados ni días 28-2
- [ ] Rotación equitativa: semanas alternadas mañana/tarde
- [ ] Turnos partidos: 2 veces por semana si se presta
- [ ] 7 áreas con reglas de cobertura por día de la semana (General, Buffet, Cosmético, Domicilios, Electrodoméstico, Marking, Varely Camacho)
- [ ] Plantillas de turno (shift_templates) con horarios específicos por día y área
- [ ] Configuración de habilidades: asignar áreas habilitadas por empleado
- [ ] Asignación manual de turnos (vista editable con modal lateral)
- [ ] Editor individual de turnos por empleado
- [ ] Registro de novedades: vacaciones (rango), incapacidades, permisos, calamidades, descansos
- [ ] Bitácora de generación (generation_notes) con badges info/warning/error
- [ ] Cronograma de cobertura: vista horizontal del día (6:00-22:00) por área
- [ ] Exportación a Excel (.xlsx)
- [ ] Filtros por área y por tipo de novedad en planilla
- [ ] Panel lateral de resumen por día (cobertura, desglose por área)
- [ ] Panel lateral de perfil del empleado
- [ ] Limpiar turnos y novedades del mes
- [ ] Domingos resaltados en rojo, día actual marcado
- [ ] Indicador visual de turnos manuales
- [ ] Turnos comodín por día de la semana

### Out of Scope

- App móvil nativa — web responsive es suficiente
- Multi-empresa/multi-almacén — sistema para un solo almacén
- Notificaciones push/email a empleados — la administradora es la única usuaria
- Integración con nómina/ERP — fuera del alcance de este sistema
- Múltiples usuarios admin con roles — un solo usuario administrador

## Context

### Sistema existente (referencia)
- **Producción:** https://yuli.diferencialdx.com
- **Stack original:** Laravel 11.49, PHP 8.2, MySQL, Blade, Bootstrap CSS
- **Documentación completa:** `/Users/franciatrasvina/Downloads/documentacion_sistema.md`
- **Datos de turnos por día:** `/Users/franciatrasvina/Downloads/datos_proyecto.md`

### Reglas de negocio clave
- **Descansos:** 4/mes (3 ordinarios + 1 domingo obligatorio). Sin descansos sábados ni días 28-2 (cierre/inventario)
- **Rotación:** Semanas alternadas mañana/tarde para equidad
- **Turnos partidos:** Formato "7:00-11:00|11:30-14:30" (dos franjas separadas por `|`)
- **Zona crítica:** Días 28 al 2 — sin descansos
- **Áreas especiales:** Marking (solo Mar/Jue), Varely Camacho (solo Mié), Buffet (sin domingo)
- **Comodines:** Turnos extra disponibles por día para cubrir imprevistos
- **Cobertura variable:** Electrodoméstico necesita 2 personas L/M/J/V pero 3 los Mié/Sáb

### Personal
- ~30 empleados con nómina fija
- Cada empleado tiene áreas habilitadas (tabla pivot)
- Vacaciones con rango de fechas (inicio-fin)

## Constraints

- **Stack:** Next.js 15 (App Router), Prisma ORM, PostgreSQL, Tailwind CSS
- **Deploy:** Docker + EasyPanel (infraestructura existente)
- **UI:** Dark mode con gradientes y glassmorphism (réplica del estilo actual)
- **Idioma:** Interfaz completamente en español (días, meses, labels)
- **Datos:** Seeders con los ~30 empleados reales, 7 áreas, y todas las plantillas de turno por día
- **Réplica:** Funcionalidad 1:1 con el sistema Laravel — mismas vistas, mismas reglas, mismo comportamiento

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Prisma + PostgreSQL | Stack moderno, mejor DX, ecosistema React | — Pending |
| Réplica 1:1 del sistema Laravel | La administradora ya conoce el sistema, no cambiar el flujo | — Pending |
| Dark mode + glassmorphism | Mantener identidad visual del sistema actual | — Pending |
| Deploy en EasyPanel | Infraestructura ya disponible y conocida | — Pending |
| Un solo usuario admin | Solo una persona administra los turnos | — Pending |

---
*Last updated: 2026-03-24 after initialization*
