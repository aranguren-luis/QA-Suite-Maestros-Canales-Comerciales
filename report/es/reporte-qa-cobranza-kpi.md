<h1 align="center">Informe de Auditoría de QA Independiente<br>Cobranza &amp; KPI — Módulo Affinity Groups</h1>

<table style="width:100%; border-collapse:collapse; margin:1.5em 0; font-size:0.95em;">
<tr style="border-top:2px solid #333; border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; width:220px; background:#f6f7f9; vertical-align:top;">Tipo de documento</td>
  <td style="padding:10px 14px;">Test Summary Report (IEEE 829) — <strong>informe vivo</strong>, no es un Test Plan ni una certificación de cierre</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; width:220px; background:#f6f7f9; vertical-align:top;">Proyecto</td>
  <td style="padding:10px 14px;">Cobranza &amp; KPI (producto adquirido por la empresa cliente a un proveedor externo) — módulo <strong>Affinity Groups</strong> (primer módulo entregado, de 23 módulos confirmados en la UI)</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Repositorios</td>
  <td style="padding:10px 14px;">Frontend, gateway/orquestación, identidad y master-data (código fuente del proveedor, clonado) — backend aún no levantado</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Ambiente bajo prueba</td>
  <td style="padding:10px 14px;">Portal demo (URL configurada vía <code>BASE_URL</code>) — frontend definitivo aún no desplegado en la nube. Confirmado: el demo es un mock 100% cliente, <strong>sin backend real</strong> (0 llamadas de red, seed embebido en el bundle JS) — ver nota de troubleshooting.</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Responsables QA</td>
  <td style="padding:10px 14px;">Luis Aranguren</td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Herramienta</td>
  <td style="padding:10px 14px;">Playwright (navegador real, no API) — suite <code>.qa/tests/affinity-groups-ui.spec.ts</code>, corrida con <code>bun</code></td>
</tr>
<tr style="border-bottom:1px solid #ddd;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Metodología QA</td>
  <td style="padding:10px 14px;">Caja negra — cada caso se verifica primero en vivo contra el demo (MCP Playwright) y, si el resultado real coincide con lo esperado, se automatiza inmediatamente en la suite Playwright. Ciclo por lotes de 10 casos.</td>
</tr>
<tr style="border-bottom:2px solid #333;">
  <td style="padding:10px 14px; font-weight:600; background:#f6f7f9; vertical-align:top;">Origen de los casos</td>
  <td style="padding:10px 14px;">141 casos documentados por el proveedor externo (100 UI + 41 API), auto-reportados como "Pass" salvo 13 "Under Development". Esta auditoría verifica ese "Pass" de forma independiente, caso por caso.</td>
</tr>
</table>

---

## 1. Resumen Ejecutivo

### 1.1 Introducción

Este informe registra el avance de la auditoría de QA independiente sobre el módulo **Affinity Groups** del producto Cobranza & KPI, verificando caso por caso los 100 casos de prueba UI y 41 casos de prueba API documentados por el proveedor. **Este es un informe vivo**: se actualiza por cada lote de 10 casos ejecutado, no es un informe de cierre/certificación.

### 1.2 Alcance cubierto hasta ahora

- **TC-AG-001 a TC-AG-100 (100 de 100 casos UI del proveedor)** — verificados en vivo contra el demo y automatizados. **Lote UI completo.**
- Pendiente: TC-AG-001 a TC-AG-041 (API, requiere backend real levantado), y el resto de los 23 módulos de la UI fuera de Affinity Groups (sin documentación del proveedor todavía).

### 1.3 Estado actual

**Sin certificar — lote UI completo, pendiente de re-verificación contra backend real.** De los 100 casos verificados, 47 confirman el "Pass" del proveedor sin matices (incluye TC-AG-095 y TC-AG-100, corregidos/reconfirmados el 2026-10-02), 19 son **no reproducibles** en este demo (los 15 ya documentados en el lote anterior, más TC-AG-091 por ser puramente de API, TC-AG-094 por requerir forzar un estado inválido vía backend, y TC-AG-097/098/099 por ausencia de sistema de permisos y segundo usuario/rol) y **32 casos tienen discrepancias confirmadas** contra lo documentado (los 30 del lote anterior, más TC-AG-092 y TC-AG-096 — nota: TC-AG-095 se retiró como discrepancia tras la corrección del 2026-10-02, ver HALLAZGO-012), encontradas únicamente contra el demo (sin backend real) — pendientes de re-verificar contra el backend real (repositorio de master-data) antes de escalarlas como bug definitivo del producto.

> **Corrección 2026-10-01:** TC-AG-080 (tooltip del badge Pending) se había registrado inicialmente como discrepancia por un error de targeting en la verificación manual (hover sobre la celda contenedora en vez del badge exacto). Al re-verificar con evidencia de captura de pantalla, el tooltip documentado por el proveedor **sí existe y funciona correctamente** — se retracta la discrepancia y se recuenta como "Pass" confirmado. Ver detalle en la nota de HALLAZGO-008.

---

## 2. Matriz de Resultados por Sección

| # | Sección (casos del proveedor) | Casos verificados | Confirmados sin matices | Con discrepancia | Hallazgos |
|---|---|:---:|:---:|:---:|---|
| 2.1 | TC-AG-001 a TC-AG-010 — Navegación, Approval Requests, lista, filtros básicos | 10 | 10 | 0 | — |
| 2.2 | TC-AG-011 a TC-AG-020 — Filtros combinados, badges, columna Status, paginación, creación | 10 | 8 | 1 caso (TC-AG-013) | HALLAZGO-001, HALLAZGO-002 |
| 2.3 | TC-AG-021 a TC-AG-030 — Crear con éxito, validaciones de formulario (Name/Code/Discount/Country), duplicados, edición | 10 | 7 | 3 casos (TC-AG-022, TC-AG-024, TC-AG-026 comparten HALLAZGO-003; TC-AG-030 es HALLAZGO-004) | HALLAZGO-003, HALLAZGO-004 |
| 2.4 | TC-AG-031 a TC-AG-040 — Cancel, Deactivate/Activate diferido, cambio de estado, Retire/Delete | 10 | 4 (+2 no reproducibles) | 4 casos (TC-AG-032/033/034/035 comparten HALLAZGO-001 ampliado; TC-AG-036 es HALLAZGO-005; TC-AG-039 reconfirma HALLAZGO-002) | HALLAZGO-001 (ampliado), HALLAZGO-002 (reconfirmado), HALLAZGO-005 |
| 2.5 | TC-AG-041 a TC-AG-050 — Retiro sin bloqueo, aprobar/rechazar solicitudes, estructura de fila, audit trail | 10 | 4 (+1 no reproducible) | 5 casos (TC-AG-044 parcial por HALLAZGO-001; TC-AG-046/047/048/050 comparten HALLAZGO-006) | HALLAZGO-006 (nuevo) |
| 2.6 | TC-AG-051 a TC-AG-060 — Badges de estado, visibilidad dual, filtro de estado, estado vacío, permisos (3 "Under Development" del proveedor) | 10 | 0 | 5 casos (TC-AG-052/053/055/056/057, todos consecuencia de HALLAZGO-006) (+5 no reproducibles: TC-AG-051, 054, 058, 059, 060) | HALLAZGO-006 (ampliado) |
| 2.7 | TC-AG-061 a TC-AG-070 — Prevención de duplicados (Rule 4), permisos (2 "Under Development"), manejo de errores, concurrencia, i18n | 10 | 4 | 2 casos (TC-AG-061/063 comparten HALLAZGO-007, nuevo) (+4 no reproducibles: TC-AG-062, 066, 067, 069) | HALLAZGO-007 (nuevo) |
| 2.8 | TC-AG-071 a TC-AG-080 — Badges de acción, diff de campos, título de tarjeta, diálogos Deactivate/Retire/Approve/Reject, tooltip de Pending | 10 | 5 | 4 casos (TC-AG-071/072/076/079 comparten HALLAZGO-008, nuevo; TC-AG-080 retractado el 2026-10-01 — confirma lo documentado) (+1 no reproducible: TC-AG-075 por HALLAZGO-006) | HALLAZGO-008 (nuevo) |
| 2.9 | TC-AG-081 a TC-AG-090 — Modo solo-lectura (pendiente/retired), ordenamiento de columnas, dirty-check de Edit, unicidad de Name, persistencia de valores tras Reject, reenvío tras rechazo, límites de Discount %, dropdowns de Subscription Type/Country, lookup de API | 10 | 1 | 7 casos (TC-AG-081/083/084/085 comparten HALLAZGO-009, nuevo; TC-AG-082 es HALLAZGO-010, nuevo; TC-AG-086 extiende HALLAZGO-008; TC-AG-087 es HALLAZGO-011, nuevo) (+2 no reproducibles: TC-AG-089 por datos insuficientes, TC-AG-090 por ser puramente de API) | HALLAZGO-009, HALLAZGO-010, HALLAZGO-011 (nuevos) |
| 2.10 | TC-AG-091 a TC-AG-100 — Guards de API, auto-aprobación, motivo de Reject, rollback, filtro Request Type, filtro Status, permisos (3 "Under Development" del proveedor), responsive 375px | 10 | 2 (TC-AG-095 y TC-AG-100, tras corrección 2026-10-02) | 2 casos (TC-AG-092 es HALLAZGO-013, nuevo; TC-AG-096 extiende HALLAZGO-012) (+2 no reproducibles: TC-AG-091 por ser puramente de API; TC-AG-094 por requerir forzar estado inválido vía backend; +1 no reproducible combinado: TC-AG-097/098/099 por ausencia de permisos) | HALLAZGO-012 (ampliado), HALLAZGO-013 (nuevo) |
| — | **Total verificado** | **100** | **47** (+19 no reproducibles) | **32** | 13 hallazgos |

**Automatización:** suite `affinity-groups-ui.spec.ts` — **92/92 tests pasan** (lote UI completo, TC-AG-001 a TC-AG-100; TC-AG-034/035, TC-AG-058/059/060, TC-AG-066/067 y TC-AG-097/098/099 comparten un test cada uno; TC-AG-074 se verifica dentro de los tests de TC-AG-071/072; TC-AG-075 no tiene test propio por ser no reproducible; última corrida registrada en la sección 4).

---

## 3. Registro de Hallazgos

### HALLAZGO-001 — Deactivate/Activate aplican el cambio de Status de inmediato, sin pasar por Approval Requests

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-001 (casos TC-AG-013, TC-AG-032, TC-AG-033, todos documentados "Pass" por el proveedor) |
| **Título** | Las acciones "Deactivate" y "Activate" cambian el `Status` de inmediato (`Active↔Inactive`), sin pasar por la cola de aprobación (maker-checker) |
| **Severidad** | Medium — contradice el propio texto de ambos diálogos de confirmación ("The record stays active/inactive until an approver signs off") y el patrón maker-checker que sí respetan Edit y Delete |
| **Causa** | No determinada en código — el demo no hace llamadas de red (mock embebido en el bundle), y el checkout actual del repositorio frontend no expone la lógica de simulación que usa el demo desplegado. Hipótesis: los handlers de "deactivate"/"activate" del mock actualizan `status` directamente en vez de crear un `ApprovalRequestRecord`. |
| **Reproducción** | Click "Deactivate" (o "Activate") en cualquier fila → llenar motivo → "Submit for Approval" → la fila vuelve a la lista con el Status ya invertido de inmediato; la solicitud nunca aparece en "Approval Requests" (queda "All caught up"). |
| **Consecuencia** | TC-AG-034 (aprobar un cambio de estado pendiente) y TC-AG-035 (rechazarlo) son **no reproducibles**: nunca existe una solicitud de cambio de estado para actuar sobre ella. |
| **Evidencia** | Tests automatizados: `affinity-groups-ui.spec.ts` → `TC-AG-013`, `TC-AG-032`, `TC-AG-033`, `TC-AG-034 y TC-AG-035`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el repositorio de master-data (backend real, aún no levantado) antes de reportar al proveedor como bug de producto. |

---

### HALLAZGO-002 — Aprobar una eliminación borra el registro en vez de marcarlo "Retired"

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-002 (casos TC-AG-013, TC-AG-039, documentados "Pass" por el proveedor) |
| **Título** | Al aprobar una solicitud de "Deletion requested", el registro desaparece por completo de la lista (hard-delete) en vez de quedar con `Status=Retired` visible |
| **Severidad** | Medium — el estado "Retired" documentado por el proveedor (*"los grupos retirados permanecen listados"*) nunca es alcanzable en este demo; el propio diálogo de Delete ya lo anticipa ("Once approved, it will be removed") |
| **Causa** | No determinada en código, misma limitación que HALLAZGO-001 (mock del demo no localizable 1:1 en el checkout actual del repo). Hipótesis: el handler de "aprobar eliminación" remueve el registro del arreglo en memoria en vez de marcarlo `retired`. |
| **Reproducción** | Delete sobre cualquier fila → Approval Requests → Approve → el registro ya no aparece en la lista; no existe ningún `Status=Retired` visible. Reconfirmado 2026-09-30 con un segundo registro (EXONERATED → CORPORATE, TC-AG-039). |
| **Evidencia** | Tests automatizados: `affinity-groups-ui.spec.ts` → `TC-AG-013`, `TC-AG-039`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real. |

---

### HALLAZGO-005 — El botón de la fila se llama "Delete", no "Retire" como documenta el proveedor

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-005 (caso TC-AG-036, documentado "Pass" por el proveedor) |
| **Título** | La acción destructiva de la fila está etiquetada "Delete" (y los diálogos usan lenguaje de "deletion"/"removed"); el proveedor documenta que debería llamarse "Retire" y que no debería existir un "Delete" simple |
| **Severidad** | Low — es un hallazgo de terminología, no de comportamiento; el comportamiento base (queda "Pending deletion" hasta aprobarse) sí coincide con TC-AG-038/040 |
| **Causa** | No determinada en código (misma limitación de mock no localizable). |
| **Reproducción** | Inspeccionar los botones de acción de cualquier fila: "Edit", "Deactivate", "Delete" — ningún botón/ícono dice "Retire". |
| **Evidencia** | Test automatizado: `affinity-groups-ui.spec.ts` → `TC-AG-036`. |
| **Estado** | **Confirmado solo contra el demo.** Junto con HALLAZGO-002, sugiere que el concepto completo de "Retire" (soft-delete) nunca se implementó para este módulo. |

---

### HALLAZGO-003 — Mensajes de validación muestran claves de i18n crudas sin traducir

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-003 (casos TC-AG-022, TC-AG-024, TC-AG-026, los 3 documentados "Pass" por el proveedor) |
| **Título** | Algunos errores de validación del formulario de creación muestran la clave cruda de i18n (`validation.required`, `validation.invalidFormat`) en vez de un texto legible; otros errores del mismo formulario sí muestran texto resuelto ("Invalid input") |
| **Severidad** | Low — la validación funciona (el formulario no se envía), el defecto es de calidad del mensaje mostrado al usuario |
| **Causa** | No determinada en código (misma limitación: mock del demo no localizable 1:1 en el checkout actual). Hipótesis: faltan entradas de traducción para las claves `required`/`invalidFormat` en el bundle de idioma cargado. |
| **Reproducción** | Dejar Name vacío o con 1 carácter → error muestra literalmente `validation.required`. Code = "CO RP!" → error muestra literalmente `validation.invalidFormat`. Discount % vacío → error muestra `validation.required`. (Name con 61 caracteres y Discount 150/-5 sí muestran "Invalid input" correctamente.) |
| **Evidencia** | Tests automatizados: `affinity-groups-ui.spec.ts` → `TC-AG-022`, `TC-AG-024`, `TC-AG-026` (verifican el rechazo funcional, no el texto del mensaje). |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el frontend definitivo cuando esté desplegado. |

---

### HALLAZGO-004 — El motivo de cambio (Request reason) no se exige al editar, pese a estar documentado como obligatorio

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-004 (caso TC-AG-030, documentado "Pass" por el proveedor) |
| **Título** | Editar un affinity group y dejar "Request reason" vacío no bloquea el envío — la edición se envía para aprobación exitosamente sin ningún error de validación |
| **Severidad** | Medium — contradice directamente lo documentado ("el Request reason es REQUERIDO... la edición no se envía"); es la segunda vez que un campo de motivo documentado como obligatorio resulta no exigido en la práctica (la primera fue la nota del aprobador en Reject, UC-07) |
| **Causa** | No determinada en código (misma limitación de mock no localizable). Hipótesis: el esquema de validación del formulario de edición no marca `changeReason` como requerido, a diferencia de Deactivate/Delete donde el campo de motivo sí bloquea el envío (asterisco `*` visible y aria-invalid activo mientras está vacío). |
| **Reproducción** | Editar cualquier grupo Approved, cambiar el Name, dejar Request reason vacío, click "Submit for Approval" → se envía con éxito (toast "Submitted for approval.", registro pasa a Pending). |
| **Evidencia** | Test automatizado: `affinity-groups-ui.spec.ts` → `TC-AG-030`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real. |

---

### HALLAZGO-006 — Approval Requests no es un audit trail: las solicitudes resueltas desaparecen en vez de permanecer visibles

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-006 (casos TC-AG-046, 047, 048, 050, 052, 053, 055, 056, 057 — 9 en total, todos documentados "Pass" por el proveedor salvo 056) |
| **Título** | En cuanto una solicitud se Aprueba o Rechaza, desaparece por completo de la pestaña Approval Requests — no queda ningún registro histórico con badge "Approved"/"Rejected", motivo, revisor o fecha. Tampoco existen badges de estado visuales (ni siquiera para Pending) ni un filtro por estado. |
| **Severidad** | **High** — a diferencia de los demás hallazgos de este módulo, este afecta la trazabilidad/auditoría completa, no un flujo puntual. **9 test cases distintos del proveedor** (046/047/048/050/052/053/055/056/057) describen esta pestaña como un audit trail completo con badges y filtros — ninguno se sostiene. |
| **Causa** | No determinada en código (misma limitación de mock no localizable). Hipótesis: el store de "pending requests" del mock funciona como cola (se remueve el ítem al resolverse) en vez de un log con campo de estado persistido; de ahí también que nunca haya un badge de estado que renderizar ni un filtro de estado que implementar. |
| **Reproducción** | Editar/eliminar cualquier grupo → aparece en Approval Requests (sin ningún badge de texto, solo los botones Reject/Approve) → Approve (o Reject con motivo) → el ítem desaparece de la lista en cuanto se resuelve; la pestaña vuelve a "All caught up" aunque momentos antes se resolvió algo con éxito. Solo existe un filtro "Request type", nunca uno de estado. |
| **Consecuencia** | TC-AG-044 (estructura de fila) solo es parcialmente verificable — el "tag de cambio de estado/lifecycle" documentado nunca se observa porque ningún cambio de estado llega a la cola (HALLAZGO-001). TC-AG-051 y TC-AG-054 son no reproducibles por la misma raíz (sin badges, nunca coexisten estados para comparar). |
| **Evidencia** | Tests automatizados: `affinity-groups-ui.spec.ts` → `TC-AG-046` a `TC-AG-048`, `TC-AG-050`, `TC-AG-052`, `TC-AG-053`, `TC-AG-055` a `TC-AG-057`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real antes de reportarlo al proveedor. Es la observación más crítica de todo el módulo hasta ahora: sin esto, no hay forma de reconstruir quién aprobó/rechazó qué y cuándo. |

---

### HALLAZGO-007 — Una segunda solicitud (ej. Delete) sobrescribe silenciosamente la pendiente (ej. Edit) en vez de bloquearse

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-007 (casos TC-AG-061, TC-AG-063, documentados "Pass" por el proveedor) |
| **Título** | El guard de "prevención de duplicados" (Rule 4) solo protege parcialmente Edit (vía formulario read-only, no vía botón deshabilitado); Deactivate y Delete no están protegidos — enviarlos mientras ya existe otra solicitud pendiente para el mismo grupo **reemplaza silenciosamente** la solicitud original sin bloqueo ni aviso |
| **Severidad** | **High** — es pérdida silenciosa de datos de gobernanza: la primera solicitud (con su propio motivo) desaparece sin dejar rastro ni notificar a quien la envió, en un módulo cuyo propósito explícito es la trazabilidad de cambios a "segmentation masters" |
| **Causa** | No determinada en código (misma limitación de mock no localizable). Hipótesis: el mock guarda una única referencia a "la solicitud activa" por `groupId` en vez de una lista — la segunda solicitud sobrescribe esa referencia en vez de ser rechazada. |
| **Reproducción** | Editar CORPORATE (queda Pending) → sin resolver esa solicitud, click "Delete" sobre CORPORATE → confirmar → el registro pasa a "Pending deletion"; la solicitud de edición original desaparece sin dejar rastro y el badge de Approval Requests nunca pasa de 1. |
| **Evidencia** | Tests automatizados: `affinity-groups-ui.spec.ts` → `TC-AG-061`, `TC-AG-063`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real antes de reportarlo al proveedor. |

---

### HALLAZGO-008 — Las tarjetas de Approval Requests no muestran badges de acción ni diff de campos; Approve no abre diálogo

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-008 (casos TC-AG-071, 072, 076, 079 — 4 en total, todos documentados "Pass" por el proveedor) |
| **Título** | Las tarjetas de solicitud no distinguen tipo de acción (sin badge CREATE/EDIT), no muestran diff de campos en ediciones, el título de una edición usa el nombre PROPUESTO en vez del vigente, y "Approve" resuelve sin ningún diálogo de confirmación/comentario |
| **Severidad** | Medium — no es pérdida de datos ni rompe el audit trail (eso ya lo cubren HALLAZGO-006/007), pero deja la UI de revisión notablemente más pobre: un revisor real no puede ver qué cambió exactamente antes de aprobar una edición |
| **Causa** | No determinada en código (misma limitación de mock no localizable). Hipótesis: un único template de tarjeta genérico se reutiliza para los 4 tipos de solicitud sin lógica de diff/badges, y Approve se implementó como acción directa de un click en vez de abrir el mismo diálogo que Reject sí usa. |
| **Reproducción** | Editar CORPORATE (Name + Discount %, con motivo) → en Approval Requests la tarjeta muestra el nombre PROPUESTO como título y los valores propuestos planos, sin ninguna fila "Name: CORPORATE → CORPORATE RENAMED". Click "Approve" sobre cualquier tarjeta → se resuelve al instante sin diálogo. |
| **Evidencia** | Tests automatizados: `affinity-groups-ui.spec.ts` → `TC-AG-071`, `TC-AG-072`, `TC-AG-076`, `TC-AG-079`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real antes de reportarlo al proveedor. **Nota:** TC-AG-080 (tooltip del badge Pending) se incluyó originalmente en este hallazgo pero fue **retractado el 2026-10-01** tras confirmar con captura de pantalla que el tooltip sí funciona — el hallazgo original era un falso positivo por hover impreciso en la verificación manual (ver detalle en la nota del vault). |

---

### HALLAZGO-009 — Edit no respeta el flujo de aprobación: valores propuestos se aplican de inmediato y persisten tras Reject; sin dirty-check ni unicidad de Name

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-009 (casos TC-AG-081 parcial, 083, 084, 085 — todos documentados "Pass" por el proveedor) |
| **Título** | El formulario de Edit no tiene guard de cambio real (Request reason/Submit habilitados desde el inicio, un edit sin ningún cambio se envía igual), el campo Name no valida unicidad (ni exacta ni case-insensitive), y los valores propuestos de una edición ya se muestran en la lista mientras está Pending — y **persisten incluso después de un Reject explícito**, en vez de revertir al valor vigente |
| **Severidad** | High — es el hallazgo de mayor impacto de integridad de datos hasta ahora: un revisor que rechaza un cambio no logra realmente descartarlo, el dato "rechazado" queda visualmente aplicado en el mock |
| **Causa** | No determinada en código (demo sin backend real). Hipótesis: el mock aplica el PATCH del formulario directamente sobre el registro en memoria al momento del submit (optimistic update sin rollback); ni Approve ni Reject reconcilian contra el valor realmente vigente. |
| **Reproducción** | Editar un grupo Approved (ej. "Grupo QA 071") cambiando Discount % con motivo → Submit → la lista ya muestra el valor propuesto con Approval=Pending → Reject la solicitud → la lista conserva el valor propuesto con Approval=Rejected (no revierte). Por separado: crear un grupo con Name idéntico a uno existente (distinta capitalización) → se crea sin error. |
| **Evidencia** | Tests automatizados: `affinity-groups-ui.spec.ts` → `TC-AG-081`, `TC-AG-083`, `TC-AG-084`, `TC-AG-085`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real antes de reportarlo al proveedor. Prioridad alta de re-verificación junto con HALLAZGO-006/007. |

---

### HALLAZGO-010 — El ordenamiento de columnas de la lista no está implementado

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-010 (caso TC-AG-082, documentado "Pass") |
| **Título** | Click en los encabezados de columna (Name, Code, Subscription type, Discount %, Approval, Status) no cambia el orden de las filas ni muestra ningún indicador visual |
| **Severidad** | Low — funcionalidad de conveniencia, no bloquea ningún flujo transaccional |
| **Causa** | No determinada — el componente de tabla del mock no implementa sorting en absoluto. |
| **Reproducción** | Click en el encabezado "Name" de la lista → el orden de filas permanece idéntico (orden de inserción del seed), sin flecha/indicador. |
| **Evidencia** | Test automatizado: `affinity-groups-ui.spec.ts` → `TC-AG-082`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real antes de reportarlo al proveedor. |

---

### HALLAZGO-011 — Discount % no se normaliza a 2 decimales; la lista redondea a entero

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-011 (caso TC-AG-087, documentado "Pass") |
| **Título** | Un valor válido con decimales (ej. 12.5) no se normaliza a 2 decimales en el formulario, y la columna Discount % de la lista principal lo redondea al entero más cercano (13%) en vez de mostrar el valor con precisión |
| **Severidad** | Medium — no es pérdida de datos, pero genera un riesgo real de malentendido comercial/financiero si el valor con fracción nunca se ve correctamente en la grilla. Valores fuera de rango (>100, <0) o con 3 decimales sí se bloquean al enviar, pero sin ningún mensaje de error visible (falla silenciosa). |
| **Causa** | No determinada — hipótesis: la columna usa un formateador de enteros (`Math.round`) en vez de `toFixed(2)`, y el formulario no normaliza el valor crudo del input al guardar. |
| **Reproducción** | Crear un grupo con Discount % = 12.5 → se crea con éxito → la lista muestra "13%" en vez de "12.50%"; el formulario de edición muestra "12.5", no "12.50". Intentar 150, -5 o 12.345 → el envío se bloquea sin mensaje de error. |
| **Evidencia** | Test automatizado: `affinity-groups-ui.spec.ts` → `TC-AG-087`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real antes de reportarlo al proveedor. |

---

### HALLAZGO-012 — El panel Filters nunca tuvo un filtro de Status, y perdió el de Approval tras el redeploy

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-012 (casos TC-AG-010, TC-AG-011, TC-AG-096, documentados "Pass") |
| **Título** | El panel "Filters" de la lista principal solo ofrece Subscription type y Country — nunca tuvo un filtro de Status (Active/Inactive/Retired), y el filtro de Approval (Pending/Approved) que sí existía desapareció tras el redeploy del 2026-10-01 |
| **Severidad** | Medium — no bloquea ningún flujo transaccional, pero limita la capacidad de auditoría/búsqueda documentada por el proveedor para este módulo. |
| **Causa** | No determinada en código — demo sin backend real. Hipótesis: el componente de filtros se construyó para un subconjunto fijo de campos y nunca se extendió a Status. |
| **Reproducción** | Lista de Affinity Groups → click "Filters" → solo aparecen "Subscription type" y "Country", sin "Approval" ni "Status". |
| **Corrección 2026-10-02:** este hallazgo originalmente incluía también el combobox "Request type" de Approval Requests (TC-AG-095), bajo la hipótesis de que solo ofrecía "Edit" de forma estática. Al re-verificar creando una solicitud de tipo **Deactivate** en vez de Edit, el combobox mostró "Deactivate" (no "Edit") — confirma que ese filtro **se puebla dinámicamente según las solicitudes pendientes existentes**, comportamiento correcto. Se retira esa parte del hallazgo; solo el panel Filters (Subscription type/Country/sin Status/sin Approval) sigue vigente. |
| **Evidencia** | Tests automatizados: `affinity-groups-ui.spec.ts` → `TC-AG-010`, `TC-AG-011`, `TC-AG-096`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real antes de reportarlo al proveedor. |

---

### HALLAZGO-013 — Auto-aprobación no prevenida en la UI

| Campo | Detalle |
|-------|---------|
| **ID** | HALLAZGO-013 (caso TC-AG-092, documentado "Pass") |
| **Título** | Los controles Approve/Reject de la propia solicitud creada por el usuario actual nunca se ocultan ni se deshabilitan — el mismo usuario puede aprobar su propio cambio (separación de funciones maker-checker no exigida por la UI) |
| **Severidad** | Medium — riesgo de control interno (un solo usuario puede proponer y aprobar el mismo cambio), aunque en este demo no es verificable con un segundo usuario/rol real. |
| **Causa** | No determinada — demo con un único usuario/sesión ("Demo User"), sin backend que valide server-side quién puede aprobar. |
| **Reproducción** | Editar un grupo → Submit for Approval → ir a Approval Requests → los botones Approve/Reject de esa misma solicitud están habilitados para el mismo usuario que la creó. |
| **Evidencia** | Test automatizado: `affinity-groups-ui.spec.ts` → `TC-AG-092`. |
| **Estado** | **Confirmado solo contra el demo** — pendiente re-verificar contra el backend real antes de reportarlo al proveedor. |

---

### Discrepancias menores (no elevadas a hallazgo formal)

- **UC-07 vs. diálogo real de Reject:** el caso de uso documenta la nota del aprobador como obligatoria al rechazar; el diálogo real la marca "(optional)" y el reject se completa con el campo vacío. Mismo patrón que HALLAZGO-004 (campo de motivo documentado como obligatorio, no exigido en la práctica). **Reconfirmado 2026-10-01 por TC-AG-093** (tercer caso con el mismo patrón) — se mantiene como discrepancia menor en vez de elevarse a hallazgo formal nuevo, dado que es el mismo patrón ya cubierto por HALLAZGO-004.
- **Discount % con decimales se redondea en la columna de la lista:** al crear un grupo con `12.5%`, la lista lo muestra como `13%`. El caso TC-AG-014 del proveedor solo documenta el formato con enteros (ej. "15%"), por lo que no se eleva a discrepancia — queda como observación.
- **TC-AG-027 (Country requerido):** confirmado como "Pass", pero de forma estructural — el combobox siempre trae un valor por defecto (Venezuela) y solo ofrece 3 opciones válidas (VE/DO/PE), nunca un estado vacío/inválido. No hay una regla de validación activa que se pueda disparar; el requisito se cumple porque la UI no permite lo contrario.
- **TC-AG-045 (separación de funciones):** confirmado como "Pass" en cuanto a "editar reenvía a Pending", pero la aserción de que "el creador no puede autoaprobar" no es verificable — el demo tiene un único usuario/sesión ("Demo User"), sin rol viewer ni segundo usuario (ver también TC-AG-049, no reproducible por la misma razón). Ver también HALLAZGO-013 (TC-AG-092), que formaliza este mismo punto.
- **TC-AG-088 (Subscription Type solo valores activos):** confirmado "Pass" para la parte de UI (el dropdown solo ofrece Prepaid/Postpaid/Hybrid, igual a lo documentado); la parte de API (rechazo de un valor inactivo/UUID aleatorio vía POST directo) no es reproducible sin backend real.
- **TC-AG-089 (selector de Country con búsqueda y paginación):** el demo solo tiene 3 países sembrados (VE/DO/PE) — insuficiente para ejercitar el scroll/paginación documentado (misma limitación de datos ya vista en TC-AG-015). La parte de API (rechazo de un país desconocido) tampoco es reproducible sin backend real.
- **TC-AG-095 (filtro Request Type):** confirmado "Pass" — ver corrección en HALLAZGO-012: el combobox se puebla dinámicamente según las solicitudes pendientes existentes, no es una lista estática incompleta.
- **TC-AG-100 (responsive 375px):** confirmado "Pass" para ausencia de scroll horizontal — verificación parcial, no se corrió un audit completo de accesibilidad (axe) ni de navegación por teclado en este lote.

---

## 4. Corridas de Automatización

| Fecha | Comando | Resultado | Notas |
|---|---|---|---|
| 2026-09-30 | `bunx playwright test --config ./config/playwright.config.ts` | **20/20 passed** (2.3 min) | TC-AG-001 a TC-AG-020. 2 iteraciones de fix de locators antes de la corrida verde. |
| 2026-09-30 | `bunx playwright test --config ./config/playwright.config.ts` | **30/30 passed** (3.8 min) | TC-AG-021 a TC-AG-030 agregados. 3 iteraciones de fix (conteo de filas en TC-AG-026, toast bloqueando el click en TC-AG-028 — resuelto enviando el formulario con Enter en vez de click). |
| 2026-09-30 | `bunx playwright test --config ./config/playwright.config.ts` | **39/39 passed** (4.9 min) | TC-AG-031 a TC-AG-040 agregados (TC-AG-034/035 comparten un test). 0 iteraciones de fix — todos los locators funcionaron a la primera. |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **49/49 passed** (8.6 min) | TC-AG-041 a TC-AG-050 agregados. 2 iteraciones de fix (texto ambiguo en TC-AG-047, dos botones "Approve"/"Reject" simultáneos en TC-AG-050 — resuelto con `.first()`). |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **59/59 passed** (12.4 min + re-run de 1) | TC-AG-051 a TC-AG-060 agregados (TC-AG-058/059/060 comparten un test). 2 iteraciones de fix (locator de "Request type" no tenía accesible-name propio — resuelto con `.filter({hasText})`; el filtro de tipo solo aparece con al menos 1 solicitud, se agregó un seed). 1 flake transitorio en TC-AG-034/035 (timeout de login en el `beforeEach`, no relacionado a lógica) — confirmado flake al re-correr solo, pasa limpio. |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **66/66 passed** (8.7 min + 8.8 min) | TC-AG-061 a TC-AG-070 agregados. 1 iteración de fix ("Cancelar" es un link, no un button, en la vista en español). Primera corrida dio 65/65 — se detectó que TC-AG-066/067 habían quedado sin test propio; se agregó uno combinado (igual patrón que TC-AG-058/059/060) y la segunda corrida confirmó 66/66. |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **74/74 passed** (9.8 min) | TC-AG-071 a TC-AG-080 agregados (8 tests nuevos: TC-AG-071, 072, 073, 076, 077, 078, 079, 080 — TC-AG-074 queda cubierto por aserciones dentro de TC-AG-072/073, TC-AG-075 no tiene test propio por ser no-reproducible). 1 iteración de fix (TC-AG-079: tras Approve la vista se queda en Approval Requests, no en la lista principal — se agregó navegación explícita de vuelta antes de buscar la fila CORPORATE para la parte de Reject del mismo test). |

| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **55/84 passed, 29 failed** (corrida inicial) | TC-AG-081 a TC-AG-090 agregados (10 tests nuevos). 1 corrección aplicada: TC-AG-080 (lote anterior) estaba mal escrito — afirmaba la ausencia de un tooltip que en realidad existe (falso negativo por hover impreciso sobre la celda contenedora en vez del badge exacto); corregido para afirmar su presencia, confirmado con captura de pantalla real. **⚠ Los 29 fallos NO eran errores de los tests**: se confirmó que el demo fue redesplegado con una versión distinta durante esta sesión (botón "Delete"→"Retire", columna Approval ahora muestra "-", el filtro "Approval" desapareció del panel Filters, aparecieron checkboxes de selección de fila). Ver nota de troubleshooting interna sobre el redeploy del demo del 2026-10-01. |
| 2026-10-01 | `bunx playwright test --config ./config/playwright.config.ts` | **84/84 passed** (corrida de corrección, tras re-auditoría) | Re-verificados en vivo HALLAZGO-001/002/005/006/007/008/009 contra la versión nueva del demo: **HALLAZGO-001, 002 y 005 quedaron RESUELTOS** (Deactivate/Activate ahora pasan por Pending→Approve; Retire marca Status=Retired y conserva el registro; el botón ya se llama "Retire"); **HALLAZGO-007 quedó RESUELTO** (las 3 acciones se deshabilitan genuinamente con una solicitud pendiente, salvo Edit que sigue habilitado cuando el tipo pendiente es el propio Edit); **HALLAZGO-006, 008 (parcial) y 009 siguen confirmados sin cambios**. Se reescribieron ~15 tests para reflejar el comportamiento nuevo y se corrigieron 2 locators (`/^EMPLOYEE/`, `/^CORPORATE DUPNAME/`) rotos por la nueva columna de checkboxes de selección de fila (cambia el nombre accesible de cada fila). Hallazgo menor adicional: las acciones deshabilitadas ahora muestran un tooltip (antes no existía), pero con texto distinto al documentado por el proveedor. |

| 2026-10-02 | `bunx playwright test --config ./config/playwright.config.ts` | **88/92 passed, 4 failed** (corrida inicial del lote final) | TC-AG-091 a TC-AG-100 agregados (8 tests nuevos, 92 en total). 4 fallos — todos en los tests del lote anterior (no en los nuevos), por drift acumulado: TC-AG-047 (toast "CORPORATE approved." todavía visible al verificar ausencia — condición de carrera), TC-AG-096 (`getByText('Subscription type')` ambiguo: matchea tanto la etiqueta del filtro como la columna de la tabla), TC-AG-100 (a 375px el botón "Masters" de navegación queda oculto/colapsado, rompiendo el helper `openAffinityGroups`), y **TC-AG-095 reveló una teoría previa incorrecta** (ver HALLAZGO-012). |
| 2026-10-02 | `bunx playwright test --config ./config/playwright.config.ts` | **92/92 passed** (corrida de corrección — **lote UI completo**) | Los 4 fallos corregidos: TC-AG-047 ahora espera explícitamente a que el toast aparezca y desaparezca antes de verificar ausencia; TC-AG-096 usa `page.locator('label').filter(...)` en vez de `getByText` para evitar la ambigüedad con la columna de la tabla; TC-AG-100 redimensiona el viewport **después** de navegar (no antes), evitando depender de la navegación responsive; TC-AG-095 se reescribió para afirmar el comportamiento dinámico real del filtro Request Type (ver corrección en HALLAZGO-012) en vez de la lista estática asumida originalmente. **100/100 casos UI verificados — lote UI del módulo Affinity Groups completo.** |

---

## 5. Pendientes para el cierre de este módulo

- **Lote UI completo (100/100 casos, 92/92 tests automatizados pasando)** — ver sección 4 para el detalle de la corrida final del 2026-10-02.
- Verificar los 41 casos API (`TC-AG-001` a `TC-AG-041`, numeración independiente) — requiere levantar el stack Docker del repositorio backend/gateway (backend real), aún no autorizado por el usuario.
- Re-verificar contra el backend real antes de reportar formalmente al proveedor: **HALLAZGO-006** (audit trail, sigue vigente), **HALLAZGO-008** (parcialmente vigente — Edit sin badge/diff), **HALLAZGO-009** (sigue vigente — es ahora el hallazgo de mayor severidad del módulo), **HALLAZGO-012** (panel Filters, parte de Status/Approval sigue vigente — la parte de Request Type ya se retiró, era un falso positivo), **HALLAZGO-013** (auto-aprobación, nuevo), y **HALLAZGO-003/004/010/011** (sin re-verificar contra la versión nueva del demo todavía). **HALLAZGO-001, 002, 005 y 007 ya se confirmaron RESUELTOS** en la versión nueva del demo (2026-10-01) — no requieren reportarse al proveedor como bug, solo confirmar que el fix también alcanzó al backend real.
- **HALLAZGO-009** (Edit sin dirty-check, valores persisten tras Reject) es ahora el hallazgo de mayor severidad (High) sin resolver — un Reject no revierte el valor propuesto. HALLAZGO-006 (audit trail, High) le sigue en prioridad. Priorizar su re-verificación contra el backend real apenas se autorice levantar el stack Docker.

---

## 6. Gobernanza del Informe

> Sección agregada tras una revisión estructural con el MCP `qai-consultant` (`review_qa_document`, rúbrica ISTQB/IEEE 829 de 6 dimensiones). El informe original cubría resultados y hallazgos en detalle pero no declaraba explícitamente objetivos, alcance dentro/fuera, riesgos, criterios de entrada/salida ni un bloque de aprobación — brechas reales de estructura, no solo de idioma. Grounded en: `standards/IEEE_829_Test_Documentation.md`, `methodologies/Risk_Based_Testing.md`, `evaluation_audit/Compliance_Audit_Report_Structure.md` (KB `qai-consultant`, citas devueltas por la revisión del 2026-10-06).

### 6.1 Objetivos

1. Verificar, caso por caso y con evidencia reproducible, si el "Pass" auto-reportado por el proveedor para los 100 casos de prueba UI de Affinity Groups coincide con el comportamiento real del demo.
2. Producir una suite de regresión automatizada (Playwright) que detecte si una futura entrega del proveedor reintroduce o resuelve alguno de los 13 hallazgos registrados.
3. Dejar una base de evidencia trazable (capturas, notas del vault, IDs de caso) suficiente para escalar formalmente al proveedor los hallazgos que sobrevivan la re-verificación contra el backend real.

### 6.2 Alcance

**Dentro del alcance (features to be tested):**
- Los 100 casos de prueba UI documentados por el proveedor para el módulo Affinity Groups (`TC-AG-001`–`TC-AG-100`), verificados contra el demo `BASE_URL`.
- El flujo maker-checker completo: creación, edición, Deactivate/Activate, Retire/Delete, Approval Requests (aprobar/rechazar), filtros y validaciones de formulario asociadas.

**Fuera del alcance (features not to be tested, por ahora):**
- Los 41 casos de prueba **API** documentados por el proveedor (`TC-AG-001`–`TC-AG-041`, numeración independiente de la UI) — requieren el stack Docker del repositorio backend/gateway levantado, no autorizado todavía por el usuario.
- Los 22 módulos de la UI fuera de Affinity Groups (de los 23 confirmados) — sin documentación del proveedor disponible todavía.
- Pruebas de carga/performance, accesibilidad formal (axe) y navegación por teclado completa — mencionadas solo como observación parcial en TC-AG-100, no como objetivo de este informe.

### 6.3 Enfoque

Caja negra, dirigido por los casos de prueba documentados por el proveedor (no exploratorio libre). Cada caso se verifica primero en vivo contra el demo (MCP Playwright) y, si el resultado real coincide con lo esperado, se automatiza de inmediato en la suite Playwright — ciclo por lotes de 10 casos, con commit/corrida de regresión al cierre de cada lote (detalle en la sección 4).

### 6.4 Riesgos y Mitigación

| ID | Riesgo | Severidad | Mitigación / Contingencia |
|---|---|---|---|
| R-01 | Los 32 hallazgos están confirmados **solo contra el demo mock** (sin backend real); el comportamiento real del repositorio de master-data puede diferir | Alta | No reportar ningún hallazgo al proveedor como bug definitivo hasta re-verificar contra el backend real (gate explícito en la sección 5) |
| R-02 | El demo puede ser redesplegado sin aviso durante la auditoría (ya ocurrió el 2026-10-01), invalidando locators y baselines de automatización | Media | Troubleshooting guide dedicada (mantenida internamente); re-auditoría manual de hallazgos abiertos tras cada redeploy detectado antes de confiar en una corrida roja/verde |
| R-03 | El demo no tiene segundo usuario/rol — los 9 casos relacionados con permisos/separación de funciones (TC-AG-049, 058-060, 066-067, 097-099) y la verificación de auto-aprobación (HALLAZGO-013) no son completamente verificables en UI | Media | Marcados explícitamente "no reproducible" en vez de forzar un falso "Pass"; re-verificar contra backend real con 2 usuarios cuando esté disponible |
| R-04 | Backend real aún no autorizado para levantarse — bloquea el cierre de los 41 casos API y la re-verificación de todos los hallazgos | Alta | Pendiente explícito en sección 5; no es un riesgo que este informe pueda mitigar unilateralmente, requiere decisión del usuario/producto |

### 6.5 Criterios de Entrada y Salida

**Entrada (para iniciar un nuevo lote de verificación):** el lote anterior debe haber cerrado con su corrida de regresión en verde (ver sección 4) y el demo debe estar accesible en la misma versión usada para el lote anterior (o la diferencia debe haberse auditado primero, como en el redeploy del 2026-10-01).

**Salida (para que este informe deje de ser "vivo" y pase a cierre/certificación):**
1. Los 100 casos UI **y** los 41 casos API verificados caso por caso (hoy: 100/141).
2. Los 13 hallazgos (o los que sobrevivan) re-verificados contra el backend real (repositorio de master-data), no solo contra el demo mock.
3. Cero hallazgos **High** sin resolver o sin plan de corrección aceptado por el proveedor (hoy: HALLAZGO-006 y HALLAZGO-009 siguen abiertos).
4. Reporte formal de los hallazgos confirmados entregado al proveedor, con respuesta registrada (aceptado/rechazado/en progreso por hallazgo).

### 6.6 Trazabilidad

La matriz de trazabilidad de este informe son las secciones 2 y 3 en conjunto: la sección 2 mapea cada bloque de 10 `TC-AG-###` a su resultado (confirmado/discrepancia/no reproducible) y a los `HALLAZGO-###` que explican cada discrepancia; la sección 3 expande cada `HALLAZGO-###` de vuelta a sus `TC-AG-###` relacionados, su test automatizado (`affinity-groups-ui.spec.ts`) y su nota de evidencia (mantenida internamente, no incluida en esta copia pública). No existe un caso de prueba o hallazgo sin esa triple referencia (caso ↔ hallazgo ↔ test automatizado).

### 6.7 Entregables

- Este informe (`reporte-qa-cobranza-kpi.md` / `qa-report-cobranza-kpi.md` en inglés), actualizado por lote.
- Resumen de hallazgos complementario (`hallazgos-affinity-groups.md` / `findings-affinity-groups.md`), formato tabla compacto para desarrollo.
- Suite de automatización Playwright (`tests/affinity-groups-ui.spec.ts`), 92/92 tests pasando.
- Dashboard HTML interactivo (`report/dashboard.html`), generado con la skill `hallazgos-html`.
- Notas de hallazgo individuales (mantenidas internamente, no incluidas en esta copia pública), una por `HALLAZGO-###`.
- Evidencia fotográfica por hallazgo (`report/evidence/HALLAZGO-###.png`).

### 6.8 Aprobaciones

| Rol | Nombre | Estado | Fecha |
|---|---|---|---|
| QA (autor) | Luis Aranguren | Aprobado (lote UI) | 2026-10-05 |
| Desarrollo (proveedor) | — | Pendiente de envío formal | — |
| Product Owner (cliente) | — | Pendiente | — |

Este bloque de aprobación queda pendiente de nombres reales del proveedor/Product Owner — se completa cuando el reporte formal de hallazgos se envíe (ver criterio de salida 6.5.4).
