<h1 align="center">QA Suite — Maestros de Canales y Segmentos Comerciales</h1>
<p align="center">Suite de automatización Playwright (caja negra/gris) para dos módulos de datos maestros de una plataforma de operaciones comerciales — segmentos de clientes ("Affinity Groups") y tipos de canal ("Channel Types") — con flujo de aprobación maker-checker.</p>

<p align="center">
  <img alt="Playwright" src="https://img.shields.io/badge/Playwright-45ba4b?style=flat-square&logo=playwright&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Bun" src="https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white">
</p>

## Tech Stack QA

| Tecnología | Uso en la suite |
|---|---|
| Playwright (`@playwright/test`) | Automatización de UI con navegador real contra un ambiente demo (`BASE_URL`), sin acceso al backend real del proveedor |
| TypeScript | Tipado estricto en specs y helpers |
| Bun | Runtime, gestor de paquetes y test runner nativo (`bun test`) para las pruebas unitarias de los helpers |

## Técnicas de QA Aplicadas

| Técnica | Ejemplo en la suite |
|---|---|
| Caja negra / gris | Ejecución íntegra contra el demo (`BASE_URL`), sin acceso al backend real — discrepancias quedan marcadas como pendientes de re-verificar cuando el backend esté disponible (`TC-AG-001`–`TC-AG-100`, `TC-CHT-001`–`TC-CHT-063`) |
| Validación de formularios / contrato de campos | Longitud, formato, campos requeridos y duplicados en Name/Code/Discount % (`TC-AG-022`, `TC-AG-023`, `TC-AG-024`, `TC-AG-025`) |
| Flujo de aprobación maker-checker | Submit for Approval → Approve/Reject, verificación de que la auto-aprobación no esté bloqueada (`TC-AG-034`, `TC-AG-035`, `TC-AG-092`, `TC-CHT-002`) |
| Control de "dirty-gating" del formulario | Un campo/botón solo debe habilitarse tras un cambio real respecto al valor original (`TC-CHT-031`–`TC-CHT-035`) |
| Accesibilidad (a11y) | Roles ARIA, labels asociados a sus campos, foco de teclado visible y contraste de color ≥4.5:1 (WCAG AA) en badges de estado (`TC-CHT-063`) |
| Catálogos cerrados / enums | Un filtro o un conjunto de acciones solo debe ofrecer las opciones documentadas, no el catálogo completo del sistema (`TC-CHT-021`, `TC-CHT-049`, `TC-CHT-059`) |
| Auditoría / trazabilidad | Las solicitudes de aprobación ya resueltas (Approved/Rejected) deben persistir como historial consultable, no desaparecer (`TC-AG-046`–`TC-AG-057`) |
| Localización / i18n | Detección de claves de traducción crudas sin resolver en mensajes de validación (`TC-AG-022`, `TC-AG-024`, `TC-AG-026`, `TC-CHT-014`, `TC-CHT-015`) |

## Project Structure

```
.
├── config/
│   ├── playwright.config.ts       # baseURL, timeouts, reporters (list/html/junit)
│   └── playwright.config.test.ts  # pruebas unitarias (bun:test) del propio config
├── tests/
│   ├── affinity-groups-ui.spec.ts # 92 casos (TC-AG-001–TC-AG-100)
│   ├── channel-types-ui.spec.ts   # 62 casos (TC-CHT-001–TC-CHT-063, 1 omitido)
│   └── helpers/
│       ├── evidence.ts            # captura de evidencia (screenshot + overlay) en cada falla
│       └── evidence.test.ts       # pruebas unitarias (bun:test) del helper de evidencia
├── report/
│   ├── es/                        # informes y hallazgos en español (fuente canónica)
│   └── en/                        # traducción fiel al inglés
├── .env.example
└── package.json
```

Ambos módulos corren contra el mismo demo expuesto en `BASE_URL`, que no tiene backend real detrás (sin llamadas de red, estado simulado en el propio bundle del cliente). Cada caso de prueba documentado por el proveedor se verifica en vivo contra ese demo y, si el resultado coincide o difiere de forma reproducible, se automatiza en el spec correspondiente.

## Key Files

```
tests/affinity-groups-ui.spec.ts         # Suite del módulo Affinity Groups (segmentos de cliente)
tests/channel-types-ui.spec.ts           # Suite del módulo Channel Types (catálogo cerrado, sin Delete/Retire)
tests/helpers/evidence.ts                # Captura automática de screenshot + overlay rojo en cada falla
config/playwright.config.ts              # Configuración central de Playwright (baseURL, reporters, timeouts)
report/es/reporte-qa-cobranza-kpi.md     # Informe de auditoría de QA (Test Summary Report estilo IEEE 829)
report/es/hallazgos-affinity-groups.md   # Bugs confirmados — módulo Affinity Groups
report/es/hallazgos-channel-types.md     # Bugs confirmados — módulo Channel Types
```

## Test Coverage

| Módulo | Casos automatizados | Pasaron | Fallaron | Omitidos | Bugs confirmados |
|---|:---:|:---:|:---:|:---:|:---:|
| Affinity Groups (`TC-AG-001`–`TC-AG-100`) | 92 | 92 | 0 | 0 | 9 |
| Channel Types (`TC-CHT-001`–`TC-CHT-063`) | 62 | 48 | 13 | 1 | 6 |
| **Total** | **154** | **140** | **13** | **1** | **15** |

En Affinity Groups los 92 tests pasan: cada discrepancia confirmada contra lo documentado quedó codificada en el propio test como el comportamiento real vigente (el título del test lo marca explícitamente, ej. *"discrepancia vs. documentado"*). En Channel Types, en cambio, las 13 fallas son intencionales: el test afirma el comportamiento que el proveedor documenta como correcto, y falla porque el demo todavía lo contradice — ver la sección de notas técnicas más abajo.

## How to Run

```bash
bun install                 # Instalar dependencias
cp .env.example .env        # Configurar BASE_URL, QA_ADMIN_EMAIL y QA_ADMIN_PASSWORD
bun run test                # Correr la suite Playwright completa (ambos módulos)
```

Correr un solo módulo:

```bash
bunx playwright test --config ./config/playwright.config.ts tests/affinity-groups-ui.spec.ts
bunx playwright test --config ./config/playwright.config.ts tests/channel-types-ui.spec.ts
```

Correr un solo caso por su ID:

```bash
bunx playwright test --config ./config/playwright.config.ts -g "TC-AG-047"
bunx playwright test --config ./config/playwright.config.ts -g "TC-CHT-031"
```

Ver el reporte HTML de la última corrida:

```bash
bunx playwright show-report report/playwright-html
```

Pruebas unitarias de los helpers (test runner nativo de Bun, no Playwright):

```bash
bun test tests/helpers/evidence.test.ts config/playwright.config.test.ts
```

### Variables de Entorno

| Variable | Requerida | Descripción |
|---|:---:|---|
| `BASE_URL` | **Sí** | URL del demo bajo prueba (sin backend real detrás) |
| `QA_ADMIN_EMAIL` | **Sí** | Email sintético de la cuenta admin usada para iniciar sesión en el demo |
| `QA_ADMIN_PASSWORD` | **Sí** | Password sintético de esa misma cuenta |

Todos los valores de ejemplo en `.env.example` son sintéticos — nunca credenciales reales.

## Documentación

| Reporte | Contenido |
|---|---|
| [Informe de QA (ES)](report/es/reporte-qa-cobranza-kpi.md) / [EN](report/en/qa-report-cobranza-kpi.md) | Resumen ejecutivo, matriz de resultados por sección y registro completo de hallazgos (Affinity Groups) |
| [Hallazgos — Affinity Groups (ES)](report/es/hallazgos-affinity-groups.md) / [EN](report/en/findings-affinity-groups.md) | Tabla compacta de los 9 bugs confirmados, con pasos de reproducción |
| [Hallazgos — Channel Types (ES)](report/es/hallazgos-channel-types.md) / [EN](report/en/findings-channel-types.md) | Tabla compacta de los 6 bugs confirmados, con pasos de reproducción |

Cada documento de `report/` existe en un par ES/EN con el mismo contenido (`es/` es la fuente canónica, `en/` es su traducción fiel). Esta copia pública no incluye capturas de pantalla ni otro material gráfico de evidencia.

## Notas Técnicas

Esta suite aplica una semántica de TDD invertida, propia de QA de caja negra sobre software ya construido por un tercero: un test en rojo no es un test roto, es la prueba automatizada de que un bug real existe. Cada test codifica el comportamiento que el proveedor documenta como correcto; si el demo lo contradice, el test falla a propósito y ese fallo queda como evidencia reproducible del hallazgo — no se "arregla" el test para que pase, se deja fallando hasta que el producto se corrija. Esto es lo que explica las 13 fallas intencionales de Channel Types: no son deuda técnica de la suite, son 6 bugs confirmados y documentados en `report/es/hallazgos-channel-types.md`.

- Todos los datos de prueba usados para crear/editar registros son sintéticos, con el prefijo `QA` en nombres y motivos de solicitud.
- El módulo Channel Types está cerrado en su lado UI (63/63 casos documentados por el proveedor); queda pendiente el lado API, fuera del alcance de esta suite.
- Algunos casos quedan marcados como no reproducibles en un demo de un solo usuario sin backend real (p. ej. segregación de roles, permisos a nivel de API) — se documentan en los hallazgos correspondientes en vez de omitirse en silencio.

<p align="center"><strong>QA Engineering · Playwright · UI Testing · TypeScript</strong></p>
