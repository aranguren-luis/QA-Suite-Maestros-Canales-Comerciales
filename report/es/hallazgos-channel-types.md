# Hallazgos — Módulo Channel Types

Reporte de bugs confirmados contra el demo (`BASE_URL`), verificados en vivo y automatizados en `channel-types-ui.spec.ts`. Pendiente re-verificar contra el backend real.

Estructura por hallazgo (Descripción / Severidad / Causa / Pasos para Reproducir)

## Resumen

| # | Título | Severidad | Casos de prueba |
|---|---|---|---|
| BUG-01 | El campo Code no elimina espacios mientras se escribe | Medium | TC-CHT-015 |
| BUG-02 | El campo Code es editable en modo Edit, en vez de quedar bloqueado | Medium | TC-CHT-015, TC-CHT-037 |
| BUG-03 | Mensajes de validación muestran claves de i18n crudas sin traducir (compartido con Affinity Groups) | Low | TC-CHT-014, TC-CHT-015 |
| BUG-04 | 'Request reason' y 'Submit for Approval' nunca se deshabilitan por falta de un cambio real; el botón no muestra "Submitting…" en curso | High | TC-CHT-031, TC-CHT-032, TC-CHT-033, TC-CHT-035 |
| BUG-05 | Las tarjetas de Approval Requests muestran un diff campo por campo también para Create y Activate/Deactivate, cuando debería ser exclusivo de ediciones | Medium | TC-CHT-041, TC-CHT-043 |
| BUG-06 | El filtro 'Request type' de Approval Requests ofrece el catálogo completo de acciones (incluye Delete/Retire/Revoke) en vez del catálogo cerrado documentado (Create/Edit/Activate/Deactivate) | Medium | TC-CHT-049, TC-CHT-059 |

---

### BUG-01 — El campo Code no elimina espacios mientras se escribe

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-CHT-015 |
| Causa | El proveedor documenta que el campo Code "convierte la entrada a mayúsculas y elimina espacios mientras se escribe" (ej. `retail chain` → `RETAILCHAIN`). En la práctica, solo se aplica `.toUpperCase()` — los espacios se conservan literalmente (`retail chain qa011` → `RETAIL CHAIN QA011`), lo que dispara el error de formato inválido ya que el patrón de Code no permite espacios. |

**Pasos para reproducir:**
1. Abrir "New Channel Type".
2. Escribir `retail chain qa011` en el campo Code.
3. El campo muestra `RETAIL CHAIN QA011` (con espacios), marcado inválido.

**Evidencia:**

---

### BUG-02 — El campo Code es editable en modo Edit, en vez de quedar bloqueado

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-CHT-015, TC-CHT-037 |
| Causa | El proveedor documenta explícitamente: "Code solo puede establecerse en creación; queda bloqueado/solo lectura en edición." En la práctica, el campo Code es un textbox editable normal en el diálogo de Edit — se pudo cambiar un código existente y la solicitud pendiente resultante refleja el cambio aceptado sin que el campo haya estado bloqueado. |

**Pasos para reproducir:**
1. Click en "Edit" sobre cualquier Channel Type existente.
2. Cambiar el campo Code y enviar.
3. La solicitud pendiente muestra el diff del Code cambiado — el campo no estaba bloqueado.

**Evidencia:**

---

### BUG-03 — Mensajes de validación muestran claves de i18n crudas sin traducir

| Campo | Detalle |
|---|---|
| Severidad | Low |
| Casos de prueba | TC-CHT-014, TC-CHT-015 |
| Causa | **Confirmado en 2 módulos** (Affinity Groups y Channel Types) — es un bug del componente de validación/i18n compartido, no específico de este módulo. Faltan entradas de traducción para las claves `validation.required`/`validation.invalidFormat` en el bundle de idioma cargado; otros mensajes del mismo formulario (motivo obligatorio al editar, código duplicado) sí están correctamente traducidos. |

**Pasos para reproducir:**
1. Abrir "New Channel Type".
2. Dejar Name = "A" (1 carácter) y Code = "RETAIL@CHAIN" (carácter inválido), enviar.
3. Name muestra `validation.required`; Code muestra `validation.invalidFormat` — ambos sin traducir.

**Evidencia:**

---

### BUG-04 — 'Request reason' y 'Submit for Approval' nunca se deshabilitan por falta de un cambio real

| Campo | Detalle |
|---|---|
| Severidad | High |
| Casos de prueba | TC-CHT-031, TC-CHT-032, TC-CHT-033, TC-CHT-035 |
| Causa | El proveedor documenta que, al editar, 'Request reason' y 'Submit for Approval' deben permanecer deshabilitados hasta que exista un cambio real (ediciones de solo espacios o reversiones al valor original no cuentan como cambio), y que Submit debe mostrar "Submitting…" mientras la solicitud está en curso. En la práctica, ambos campos están **siempre habilitados** en el diálogo de Edit, sin importar si hubo o no un cambio real — y aunque Submit sí se deshabilita correctamente mientras la petición está en curso, su texto nunca cambia a "Submitting…". |

**Pasos para reproducir:**
1. Abrir "Edit" sobre cualquier Channel Type (probado con Propios, Aliados Integrales y Socios Estratégicos).
2. 'Request reason' y 'Submit for Approval' aparecen habilitados de inmediato, sin tocar nada.
3. Escribir solo espacios, o cambiar un campo y revertirlo a su valor original — ambos siguen habilitados en todos los casos (debería deshabilitarse de nuevo).
4. Al enviar un cambio real, Submit se deshabilita correctamente pero su texto permanece "Submit for Approval" — nunca muestra "Submitting…".

**Evidencia:**

---

### BUG-05 — Las tarjetas de Approval Requests muestran diff de campos también en Create y Activate/Deactivate

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-CHT-041, TC-CHT-043 |
| Causa | El proveedor documenta que el diff campo por campo (formato "Campo: valor anterior tachado → valor propuesto") es exclusivo de las solicitudes de edición — una tarjeta CREATE o Activate/Deactivate solo debe mostrar name/code/badges y la línea "Requested by…". En la práctica, el demo renderiza el diff también en solicitudes de creación y de cambio de estado (Activate/Deactivate), incluyendo un valor sin traducir ("third_party") en el caso de creación. |

**Pasos para reproducir:**
1. Crear un Channel Type nuevo o desactivar uno existente, confirmando la solicitud.
2. Abrir "Approval Requests".
3. La tarjeta resultante incluye filas de diff pese a ser una creación o un cambio de estado — documentado como exclusivo de ediciones.

**Evidencia:**

Una tarjeta de Create debería verse así (según el proveedor):
```
Retail Chain QA041 · RETAIL_CHAIN_QA041
[CREATE] [Pending]
Requested by demo@example.local on 14/10/2026
```

Pero en el demo también aparece la lista de diff, como si fuera una edición:
```
Retail Chain QA041 · RETAIL_CHAIN_QA041
[CREATE] [Pending]
Code: — → RETAIL_CHAIN_QA041
Name: — → Retail Chain QA041
Management nature: — → third_party
Requested by demo@example.local on 14/10/2026
```

Captura del documento de casos de prueba del proveedor (TC-CHT-041), columna "Expected Result":

---

### BUG-06 — El filtro 'Request type' ofrece el catálogo completo de acciones en vez del catálogo cerrado documentado

| Campo | Detalle |
|---|---|
| Severidad | Medium |
| Casos de prueba | TC-CHT-049, TC-CHT-059 |
| Causa | El proveedor documenta que, para Channel Types (sin Delete/Retire), el filtro "Request type" de Approval Requests ofrece solo Create/Edit/Activate/Deactivate. En la práctica, el combobox ofrece las 8 opciones del catálogo completo: Any type, Create, Edit, Delete, Activate, Deactivate, Retire, Revoke — 3 de ellas (Delete/Retire/Revoke) nunca pueden producir resultados para este master, y "Revoke" ni siquiera existe en el enum de acciones del código fuente clonado. Hallazgo secundario (no documentado por el proveedor): ambos combobox de este filtro (Approval status y Request type) carecen de nombre accesible (`id` vacío, sin `aria-label`), rompiendo la asociación con su `<label>` visualmente oculto. |

**Pasos para reproducir:**
1. Abrir "Approval Requests" con al menos una solicitud en la lista.
2. Click en el combobox "Request type".
3. Se listan 8 opciones en vez de las 5 (incluyendo "Any type") documentadas.

**Evidencia:**

El filtro debería ofrecer solo esto (según el proveedor):
```
Request type: Any type, Create, Edit, Activate, Deactivate
```

Pero en el demo ofrece el catálogo completo:
```
Request type: Any type, Create, Edit, Delete, Activate, Deactivate, Retire, Revoke
```

Captura del documento de casos de prueba del proveedor (TC-CHT-049), columna "Expected Result":
