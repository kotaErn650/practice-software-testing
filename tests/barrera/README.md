# Pruebas Playwright – Janeer Barrera

Examen Final – Pruebas y Calidad de Software 2026-II (ECCI Santiago de Cali).
Repositorio: fork de `practice-software-testing` (Toolshop), rama `test-Janner`.
Spec: [`busqueda-precio.spec.ts`](./busqueda-precio.spec.ts)

## 1. Funcionalidades probadas

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 1 | Búsqueda de productos | Campo de búsqueda del catálogo (`search-query` / `search-submit`). Muestra término buscado, contador de resultados y tarjetas, o el mensaje «sin resultados». Backend: `ProductService::searchProducts()`. |
| 2 | Filtro por rango de precios | Slider doble (ngx-slider, 0–200, por defecto 1–100). Cada cambio envía `QUERY /products` con `between=price,min,max`. |

## 2. Cómo ejecutar

```bash
# 1) Levantar la aplicación (puerto 8000 -> 8002 en docker-compose.yml si el 8000 está ocupado)
docker compose up -d
docker compose run --rm -e COMPOSER_PROCESS_TIMEOUT=0 composer   # si vendor/ quedó incompleto
# crear sprint5/API/.env (DB_HOST=mariadb, DB_DATABASE=toolshop, DB_USERNAME=user, DB_PASSWORD=root, APP_KEY, JWT_SECRET)
docker compose exec laravel-api php artisan migrate:fresh --seed --force

# 2) Instalar Playwright
npm install
npx playwright install chromium

# 3) Ejecutar solo mis pruebas y abrir el reporte con videos/capturas
npx playwright test tests/barrera --project=chromium
npx playwright show-report
```

UI: http://localhost:4200 · API: http://localhost:8091

## 3. Diseño de casos de prueba

Nivel de todos los casos: **Sistema**. Precondición común: aplicación levantada, base de datos sembrada,
usuario anónimo en la página principal `/`.

| ID | Funcionalidad | Tipo | Técnica | Datos de entrada | Resultado esperado |
|----|---------------|------|---------|------------------|--------------------|
| CP-3.1.1 | Búsqueda | Positivo | Partición de equivalencia **válida** | `Pliers` | Encabezado «Searched for: Pliers»; contador = nº de productos con «pliers» en el catálogo (API); todas las tarjetas contienen «pliers»; sin mensaje de no resultados. |
| CP-3.1.2 | Búsqueda | Negativo | Partición de equivalencia **inválida** | `zzzxyz` | Se muestra `no-results`, 0 tarjetas, contador 0. |
| CP-3.1.3a/b/c | Búsqueda | Negativo | **Adivinanza de errores** | `' OR '1'='1` · `<script>alert(1)</script>` · `@#$%` | Sin resultados, sin diálogos/ejecución de script, la interfaz sigue operativa. |
| CP-3.2.1 | Precio | Funcional | **Valores límite** (inferior) | min = 0; max = `floor(precio mínimo)` y `ceil(precio mínimo)` | Con `floor`: sin resultados. Con `ceil`: aparece el producto más barato y ningún precio supera el límite. |
| CP-3.2.2 | Precio | Funcional | **Valores límite** (superior) | max = 200; min = `floor(precio máximo)` y `ceil(precio máximo)` | Con `floor`: aparece el producto más caro y ningún precio es menor al límite. Con `ceil`: sin resultados. |
| CP-3.2.3 | Precio | Positivo | Partición de equivalencia **válida** | rango 10–30 | Slider muestra 10 y 30; nº de tarjetas = oráculo; todos los precios en [10, 30]. |
| CP-3.2.4 R1/R2/R3 | Búsqueda + precio | Funcional | **Tabla de decisión** | R1: `Pliers` + rango que incluye; R2: `Pliers` + rango que excluye; R3: `zzzxyz` + rango que incluye | R1: solo coincidencias dentro del rango; R2 y R3: sin resultados. |
| WB-3.1.1 | Búsqueda | Caja blanca | **Cobertura de ramas** – rama A | `!!!???` (sanitizado = vacío) | `1=0` → sin resultados. |
| WB-3.1.2 | Búsqueda | Caja blanca | Cobertura de ramas – rama B | `enc` (< 4 caracteres → `LIKE`) | Encuentra «Adjustable Wrench», «Workbench…» (coincidencia en cualquier posición). |
| WB-3.1.3 | Búsqueda | Caja blanca | Cobertura de ramas – rama C | `wren` (≥ 4 → `FULLTEXT`) | Encuentra «Adjustable Wrench» por prefijo de palabra. |
| WB-3.1.4 | Búsqueda | Caja blanca | Cobertura de ramas (consistencia B vs C) | `renc` | «Adjustable Wrench» debería aparecer, igual que con `enc`. **FALLA → DEF-01** |

Los precios del catálogo no se fijan en el código: cada prueba lee el catálogo por la API (`GET /products`)
y calcula el resultado esperado de forma independiente a la UI (oráculo).

## 4. Buenas prácticas aplicadas

* **Locators**: `data-test` (contrato de testabilidad del proyecto) y `getByRole('slider')` para el slider; sin XPath ni clases CSS frágiles.
* **Actions**: `fill`, `click` y `keyboard.press` sobre el slider; cada pulsación espera la respuesta `QUERY /products` que dispara (sin `waitForTimeout`).
* **Assertions**: web-first (`toBeVisible`, `toHaveCount`, `toContainText`, `toHaveAttribute`); cada `expect` está comentado con el resultado esperado (RE) que valida.

## 5. Resultados de la ejecución (Chromium, 2026-11-14)

| Resultado | Cantidad |
|-----------|----------|
| PASS | 14 |
| FAIL | 1 (WB-3.1.4 → DEF-01) |

Evidencia: `playwright-report/` (HTML), y por prueba `test-results/**/video.webm` y capturas (`screenshot: 'on'`, `video: 'on'` en `playwright.config.ts`).

## 6. Defecto encontrado

**DEF-01 – La búsqueda es inconsistente según la longitud del término (subcadena de 3 vs 4 caracteres)**

* **Severidad**: media · **Prioridad**: media · **Módulo**: `sprint5/API/app/Services/ProductService.php` → `searchProducts()`
* **Pasos**: 1) abrir `/`. 2) Buscar `enc` → aparecen «Adjustable Wrench», «Workbench with Drawers», «Wooden Workbench». 3) Buscar `renc`.
* **Resultado esperado**: «Adjustable Wrench» aparece (`renc` es subcadena de «Wrench», igual que `enc`).
* **Resultado obtenido**: «There are no products found» (0 resultados). Verificable con `GET /products/search?q=renc` → `total: 0`.
* **Causa probable**: términos de < 4 caracteres usan `LIKE '%t%'` (subcadena), pero los de ≥ 4 usan `MATCH … AGAINST('+t*' IN BOOLEAN MODE)`, que solo coincide por **prefijo de palabra**. El mismo tipo de consulta devuelve resultados distintos según su longitud.
* **Nota**: puede ser una decisión de diseño intencional; se reporta como defecto de coherencia/usabilidad para validación del docente.

## 7. Reflexiones individuales

Las dos reflexiones (cambio de visión del rol de QA y QA como área profesional, con el uso de IA) son personales
y deben ser redactadas por cada integrante en el informe final (`Examen final 2026-II.docx`).
