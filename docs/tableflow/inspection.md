# P1-L1 · Inspección del repositorio (registro)

Fecha de ejecución: 16/10/2026 (fecha real de trabajo; el reloj simulado de la demo es lunes 19/10/2026 10:00 y no se mezcla con esta).

## Corrección de destino (registrada)
La primera construcción se hizo por error en `Toti-Gauna/DentalOS` (repo vacío con un README, PR #3). El operador indicó que el repo del producto ya existía: **`Toti-Gauna/Tableflow`**. Se verificó con `list_repos`: repo público, vacío (sin ramas ni commits; `git clone` avisa “empty repository”). El trabajo se trasladó acá con historia limpia: `main` = commit inicial con README; la demo entra por la rama `claude/tableflow-demo`. El PR #3 de `DentalOS` queda obsoleto.

## Comandos de verificación ejecutados
| Comando | Resultado |
|---|---|
| `mcp__claude-code-remote__list_repos query=tableflow` | `Toti-Gauna/Tableflow`, vacío, `can_push: true` |
| `git clone --depth 1 …/tableflow` | repo vacío, sin HEAD, sin AGENTS.md, package.json, lockfile, tests ni workflows |
| (en `DentalOS`) `git log -1 --oneline` | `f1ba1f5 Initial commit` — origen del error, no usado |

Contenido real del destino al iniciar: nada. No hay AGENTS.md, CLAUDE.md, manifiestos ni checkpoint previo, de modo que se justifica la base estática mínima (ver decisiones).

## Decisiones y supuestos registrados

1. **Destino.** `Toti-Gauna/Tableflow`, vacío (ver corrección arriba). Sin proyecto paralelo.
2. **Base técnica.** Como el directorio estaba vacío, se justifica una base estática mínima sin backend: **Vite + React 19 + TypeScript + react-router-dom (HashRouter)**; sin librería de UI ni de estado (store propio de ~100 líneas sobre `useSyncExternalStore`). HashRouter + `base: './'` porque GitHub Pages sirve en una subruta (`/Tableflow/`) y no ofrece fallback SPA.
3. **Versiones reales (`package.json`/lockfile):** React 19.3, react-router-dom 7.18, Vite 8.3, TypeScript 5.9, Vitest 5.0, Playwright 1.64, @axe-core/playwright 4.14, `@fontsource-variable/fraunces` y `manrope` 5.3 (licencia OFL-1.1, cargadas localmente).
4. **Gestor:** npm 10.9 (Node 22.22). Lockfile: `package-lock.json`.
5. **Scripts reales:** `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `typecheck`, `test` (Vitest), `e2e` (build + Playwright), `screens`. **No existe lint** (no se instaló ESLint): se declara ausente, no se simula.
6. **Chromium:** se usó el preinstalado en `/opt/pw-browsers` (revisión 1194) vía `executablePath`; no se descargó nada.
7. **Perfil sin reservas (S15).** Ritual Café (cafetería) viene con reservas desactivadas por defecto (atención por orden de llegada); es configurable en `/admin/configuracion`. Mesa Clara las toma.
8. **Reloj.** El salón de Mesa Clara abre 12:00: a las 10:00 simuladas un pedido en mesa se bloquea (“local cerrado”) y la UI ofrece saltar a las 12:00. Ritual Café opera desde las 08:00 y se puede recorrer en el reloj inicial.

## Mapa archivo existente → reutilizar / adaptar / nuevo

| Existente | Acción | Motivo |
|---|---|---|
| `README.md` (`# Tableflow`) | adaptado | se amplió con arranque, verificación y límites |
| todo lo demás | nuevo | el repo estaba vacío |

## Dependencias de decisiones del operador
- Habilitar **Pages → Source: GitHub Actions** en el repo (no verificable desde esta sesión).
