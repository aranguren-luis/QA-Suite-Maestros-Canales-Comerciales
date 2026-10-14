# Hallazgos — Módulo Affinity Groups

Reporte de bugs confirmados contra el demo (`BASE_URL`), verificados en vivo y automatizados en `affinity-groups-ui.spec.ts`. Pendiente re-verificar contra el backend real (repositorio de master-data) 

Estructura por hallazgo (Descripción / Severidad / Causa / Pasos para Reproducir) 

## Resumen

| # | Título | Severidad | Casos de prueba | Ref. interna |
|---|---|---|---|---|
| BUG-01 | Edit no respeta el flujo de aprobación: valores persisten tras Reject | **High** | TC-AG-081, 083, 084, 085 | HALLAZGO-009 |
| BUG-02 | Approval Requests no es un audit trail: las solicitudes resueltas desaparecen | **High** | TC-AG-046, 047, 048, 050, 052, 053, 055, 056, 057 | HALLAZGO-006 |
| BUG-03 | Request reason no se exige al editar, pese a documentarse como obligatorio | Medium | TC-AG-030 | HALLAZGO-004 |
| BUG-04 | Tarjetas de Approval Requests sin badges de acción ni diff de campos; Approve sin diálogo | Medium | TC-AG-071, 072, 076, 079 | HALLAZGO-008 |
| BUG-05 | Discount % no se normaliza a 2 decimales; la lista redondea a entero | Medium | TC-AG-087 | HALLAZGO-011 |
| BUG-06 | Panel Filters sin filtro de Status; perdió el de Approval tras el redeploy | Medium | TC-AG-010, 011, 096 | HALLAZGO-012 |
| BUG-07 | Auto-aprobación no prevenida en la UI | Medium | TC-AG-092 | HALLAZGO-013 |
| BUG-08 | Mensajes de validación muestran claves de i18n crudas sin traducir | Low | TC-AG-022, 024, 026 | HALLAZGO-003 |
| BUG-09 | Ordenamiento de columnas de la lista no implementado | Low | TC-AG-082 | HALLAZGO-010 |

---

### BUG-01 — Edit no respeta el flujo de aprobación: valores persisten tras Reject

| Campo | Detalle |
|---|---|
| Severidad | **High** |
| Casos de prueba | TC-AG-081, TC-AG-083, TC-AG-084, TC-AG-085 |
| Causa | El mock aplica el cambio directamente sobre el registro en memoria al enviar (optimistic update sin rollback); ni Approve ni Reject reconcilian contra el valor realmente vigente. |

**Pasos para reproducir:**
1. Editar un grupo Approved cambiando Discount %, con motivo → Submit.
2. La lista ya muestra el valor propuesto con Approval = Pending.
3. Rechazar la solicitud (Reject).
4. La lista conserva el valor propuesto con Approval = Rejected — **no revierte al valor original**.

---

### BUG-02 — Approval Requests no es un audit trail: las solicitudes resueltas desaparecen

| Campo | Detalle |
|---|---|
| Severidad | **High** |
| Casos de prueba | TC-AG-046, TC-AG-047, TC-AG-048, TC-AG-050, TC-AG-052, TC-AG-053, TC-AG-055, TC-AG-056, TC-AG-057 |
| Causa | El store de solicitudes pendientes funciona como cola (se remueve el ítem al resolverse) en vez de un log con estado persistido. |

**Pasos para reproducir:**
1. Editar o eliminar cualquier grupo.
2. Aparece en Approval Requests (sin ningún badge de estado, solo botones Reject/Approve).
3. Aprobar o rechazar la solicitud.
4. El ítem desaparece por completo de la lista; la pestaña vuelve a "All caught up" — no queda ningún registro histórico de quién aprobó/rechazó, ni cuándo, ni por qué.

---

### BUG-03 — Request reason no se exige al editar, pese a documentarse como obligatorio

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-AG-030 |
| Causa | El esquema de validación del formulario de edición no marca el campo como requerido (a diferencia de Deactivate/Delete, donde sí bloquea el envío). |

**Pasos para reproducir:**
1. Editar cualquier grupo Approved, cambiar el Name.
2. Dejar "Request reason" vacío.
3. Click "Submit for Approval".
4. Se envía con éxito (toast "Submitted for approval.") — sin ningún error de validación.

---

### BUG-04 — Tarjetas de Approval Requests sin badges de acción ni diff de campos; Approve sin diálogo

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-AG-071, TC-AG-072, TC-AG-076, TC-AG-079 |
| Causa | Un único template de tarjeta genérico se reutiliza para los 4 tipos de solicitud, sin lógica de diff/badges; Approve se implementó como acción directa en vez de abrir el mismo diálogo que Reject sí usa. |

**Pasos para reproducir:**
1. Editar un grupo cambiando Name + Discount %, con motivo.
2. En Approval Requests, la tarjeta muestra el nombre PROPUESTO como título y los valores planos — sin ninguna fila tipo "Name: X → Y".
3. Click "Approve" sobre cualquier tarjeta.
4. Se resuelve al instante, sin diálogo de confirmación.

---

### BUG-05 — Discount % no se normaliza a 2 decimales; la lista redondea a entero

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-AG-087 |
| Causa | La columna de la lista usa `Math.round` en vez de `toFixed(2)`; el formulario no normaliza el valor crudo al guardar. |

**Pasos para reproducir:**
1. Crear un grupo con Discount % = 12.5.
2. Se crea con éxito.
3. La lista muestra "13%" en vez de "12.50%"; el formulario de edición muestra "12.5", no "12.50".

---

### BUG-06 — Panel Filters sin filtro de Status; perdió el de Approval tras el redeploy

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-AG-010, TC-AG-011, TC-AG-096 |
| Causa | El componente de filtros se construyó para un subconjunto fijo de campos y nunca se extendió a Status. |

**Pasos para reproducir:**
1. Ir a la lista de Affinity Groups.
2. Click en "Filters".
3. Solo aparecen "Subscription type" y "Country" — sin "Approval" ni "Status".

---

### BUG-07 — Auto-aprobación no prevenida en la UI

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-AG-092 |
| Causa | No hay validación server-side (ni cliente) de quién puede aprobar una solicitud. |

**Pasos para reproducir:**
1. Editar un grupo → Submit for Approval.
2. Ir a Approval Requests.
3. Los botones Approve/Reject de esa misma solicitud quedan habilitados para el mismo usuario que la creó.

---

### BUG-08 — Mensajes de validación muestran claves de i18n crudas sin traducir

| Campo | Detalle |
|---|---|
| Severidad | Low |
| Casos de prueba | TC-AG-022, TC-AG-024, TC-AG-026 |
| Causa | Faltan entradas de traducción para las claves `required`/`invalidFormat` en el bundle de idioma cargado. |

**Pasos para reproducir:**
1. Dejar Name vacío (o con 1 carácter) → el error muestra literalmente `validation.required`.
2. Code = "CO RP!" → el error muestra literalmente `validation.invalidFormat`.
3. Discount % vacío → el error muestra `validation.required`.

---

### BUG-09 — Ordenamiento de columnas de la lista no implementado

| Campo | Detalle |
|---|---|
| Severidad | Low |
| Casos de prueba | TC-AG-082 |
| Causa | El componente de tabla no implementa sorting. |

**Pasos para reproducir:**
1. Click en el encabezado "Name" de la lista.
2. El orden de las filas permanece idéntico (orden de inserción), sin flecha ni indicador visual.
