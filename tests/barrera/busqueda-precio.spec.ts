// Examen Final - Pruebas y Calidad de Software 2026-II (ECCI)
// Autor: Janeer Barrera
// Funcionalidades: (1) Búsqueda de productos, (2) Filtro por rango de precios
//
// Convenciones:
//  - Locators: preferencia por data-test (contrato de testabilidad de la app) y por rol ARIA (slider).
//  - Actions: fill / click / keyboard.press (el slider ngx-slider es operable por teclado).
//  - Assertions: cada expect(...) está comentado con el resultado esperado (RE) del caso que valida.
//  - Oráculo: el catálogo completo se lee por la API REST (GET /products) y se calcula el resultado
//    esperado de forma independiente a la UI, así las pruebas no dependen de precios fijos.

import {test, expect, Page, APIRequestContext, Locator} from '@playwright/test';

const API = 'http://localhost:8091';

type Product = { id: string; name: string; price: number };

// ---------------------------------------------------------------- oráculo (API)
async function fetchCatalog(request: APIRequestContext): Promise<Product[]> {
    const all: Product[] = [];
    for (let page = 1; ; page++) {
        const res = await request.get(`${API}/products?page=${page}`);
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        all.push(...body.data.map((p: any) => ({id: p.id, name: p.name, price: Number(p.price)})));
        if (page >= body.last_page) break;
    }
    return all;
}

const inRange = (p: Product, min: number, max: number) => p.price >= min && p.price <= max;

// ---------------------------------------------------------------- helpers de UI
async function openHome(page: Page) {
    await page.goto('');
    await expect(page.locator('[data-test="product-name"]').first()).toBeVisible();
}

async function search(page: Page, term: string) {
    await page.locator('[data-test="search-query"]').fill(term);
    await page.locator('[data-test="search-submit"]').click();
    // resultState pasa a "search_completed" cuando la API respondió
    await expect(page.locator('[data-test="search_completed"]')).toBeVisible();
}

const minHandle = (page: Page) => page.getByRole('slider', {name: 'ngx-slider', exact: true});
const maxHandle = (page: Page) => page.getByRole('slider', {name: 'ngx-slider-max'});

/** Pulsa una tecla en el handle y espera la respuesta de la API que dispara (userChangeEnd). */
async function pressAndWait(page: Page, key: string) {
    await Promise.all([
        page.waitForResponse(r => r.request().method() === 'QUERY' && /\/products$/.test(r.url())),
        page.keyboard.press(key),
    ]);
}

/** Lleva un handle del slider hasta `target` (paso 1; PageUp/PageDown = 20; Home/End = extremos). */
async function moveHandleTo(page: Page, handle: Locator, target: number) {
    await handle.focus();
    let current = Number(await handle.getAttribute('aria-valuenow'));
    while (current !== target) {
        const diff = target - current;
        let key: string;
        if (target === 0 && current > 20) key = 'Home';
        else if (target === 200 && current < 180) key = 'End';
        else if (Math.abs(diff) >= 20) key = diff > 0 ? 'PageUp' : 'PageDown';
        else key = diff > 0 ? 'ArrowRight' : 'ArrowLeft';
        await pressAndWait(page, key);
        current = Number(await handle.getAttribute('aria-valuenow'));
    }
}

async function shownPrices(page: Page): Promise<number[]> {
    const texts = await page.locator('[data-test="product-price"]').allTextContents();
    return texts.map(t => Number(t.replace('$', '').trim()));
}

// =====================================================================================
// FUNCIONALIDAD 1: BÚSQUEDA DE PRODUCTOS
// =====================================================================================
test.describe('Funcionalidad: Búsqueda de productos', () => {

    // CP-3.1.1 | Sistema | Funcional positivo | Partición de equivalencia VÁLIDA
    test('CP-3.1.1 Buscar un término existente muestra solo productos que coinciden', async ({page, request}) => {
        const term = 'Pliers';
        const expected = (await fetchCatalog(request)).filter(p => /pliers/i.test(p.name));

        await openHome(page);
        await search(page, term);

        // RE1: el encabezado refleja el término buscado
        await expect(page.locator('[data-test="search-term"]')).toHaveText(term);
        // RE2: el contador de resultados coincide con el oráculo (API)
        await expect(page.locator('[data-test="search-result-count"]')).toContainText(String(expected.length));
        // RE3: no aparece el mensaje "sin resultados"
        await expect(page.locator('[data-test="no-results"]')).toHaveCount(0);
        // RE4: cada tarjeta mostrada contiene el término en su nombre
        const names = await page.locator('[data-test="product-name"]').allTextContents();
        expect(names.length).toBe(Math.min(expected.length, 9));
        for (const n of names) expect(n.toLowerCase()).toContain('pliers');
    });

    // CP-3.1.2 | Sistema | Funcional negativo | Partición de equivalencia INVÁLIDA
    test('CP-3.1.2 Buscar un término inexistente muestra "sin resultados"', async ({page}) => {
        await openHome(page);
        await search(page, 'zzzxyz');

        // RE1: se muestra el mensaje de no resultados
        await expect(page.locator('[data-test="no-results"]')).toBeVisible();
        // RE2: no se muestra ninguna tarjeta de producto
        await expect(page.locator('[data-test="product-name"]')).toHaveCount(0);
        // RE3: el contador informa 0 resultados
        await expect(page.locator('[data-test="search-result-count"]')).toContainText('0');
    });

    // CP-3.1.3 | Sistema | Funcional negativo | Adivinanza de errores (error guessing)
    const hostileInputs: Array<[string, string]> = [
        ['CP-3.1.3a inyección SQL', "' OR '1'='1"],
        ['CP-3.1.3b script XSS', '<script>alert(1)</script>'],
        ['CP-3.1.3c solo símbolos', '@#$%'],
    ];
    for (const [title, payload] of hostileInputs) {
        test(`${title}: entrada hostil no rompe la búsqueda ni devuelve datos`, async ({page}) => {
            let dialogOpened = false;
            page.on('dialog', async d => { dialogOpened = true; await d.dismiss(); });

            await openHome(page);
            await search(page, payload);

            // RE1: la búsqueda termina de forma controlada, sin resultados
            await expect(page.locator('[data-test="no-results"]')).toBeVisible();
            await expect(page.locator('[data-test="product-name"]')).toHaveCount(0);
            // RE2: el payload no se ejecuta como script
            expect(dialogOpened).toBe(false);
            // RE3: la interfaz sigue operativa (campo de búsqueda disponible)
            await expect(page.locator('[data-test="search-query"]')).toBeEnabled();
        });
    }
});

// =====================================================================================
// FUNCIONALIDAD 2: FILTRO POR RANGO DE PRECIOS (slider)
// =====================================================================================
test.describe('Funcionalidad: Filtro por rango de precios', () => {

    // CP-3.2.1 | Sistema | Funcional | Análisis de valores límite (límite INFERIOR del catálogo)
    test('CP-3.2.1 Valores límite alrededor del producto más barato', async ({page, request}) => {
        const catalog = await fetchCatalog(request);
        const cheapest = Math.min(...catalog.map(p => p.price));
        const justBelow = Math.floor(cheapest);   // límite por debajo del precio mínimo
        const justAbove = Math.ceil(cheapest);    // límite que ya incluye el precio mínimo
        test.skip(justBelow === justAbove, 'El precio mínimo es entero: no existe valor límite inferior fraccional');

        await openHome(page);
        await moveHandleTo(page, minHandle(page), 0); // piso del slider

        // Valor límite fuera: max = floor(min precio) -> ningún producto
        await moveHandleTo(page, maxHandle(page), justBelow);
        // RE1: no hay productos y se muestra el mensaje de sin resultados
        await expect(page.locator('[data-test="no-results"]')).toBeVisible();
        await expect(page.locator('[data-test="product-name"]')).toHaveCount(0);

        // Valor límite dentro: max = ceil(min precio) -> aparece el producto más barato
        await moveHandleTo(page, maxHandle(page), justAbove);
        const expected = catalog.filter(p => inRange(p, 0, justAbove));
        // RE2: se muestran los productos del oráculo y el más barato está presente
        await expect(page.locator('[data-test="no-results"]')).toHaveCount(0);
        const names = await page.locator('[data-test="product-name"]').allTextContents();
        expect(names.length).toBe(Math.min(expected.length, 9));
        const cheapestName = catalog.find(p => p.price === cheapest)!.name;
        expect(names.map(n => n.trim())).toContain(cheapestName);
        // RE3: ningún precio mostrado supera el límite superior
        for (const price of await shownPrices(page)) expect(price).toBeLessThanOrEqual(justAbove);
    });

    // CP-3.2.2 | Sistema | Funcional | Análisis de valores límite (límite SUPERIOR del catálogo)
    test('CP-3.2.2 Valores límite alrededor del producto más caro', async ({page, request}) => {
        const catalog = await fetchCatalog(request);
        const priciest = Math.max(...catalog.map(p => p.price));
        const justBelow = Math.floor(priciest);  // mínimo que aún incluye al más caro
        const justAbove = Math.ceil(priciest);   // mínimo que lo excluye
        test.skip(justBelow === justAbove, 'El precio máximo es entero');
        expect(justAbove).toBeLessThanOrEqual(200); // techo del slider

        await openHome(page);
        await moveHandleTo(page, maxHandle(page), 200);

        // Valor límite dentro: min = floor(max precio) -> aparece el producto más caro
        await moveHandleTo(page, minHandle(page), justBelow);
        const expectedIn = catalog.filter(p => inRange(p, justBelow, 200));
        // RE1: se listan exactamente los productos del oráculo dentro del rango
        const names = await page.locator('[data-test="product-name"]').allTextContents();
        expect(names.length).toBe(Math.min(expectedIn.length, 9));
        const priciestName = catalog.find(p => p.price === priciest)!.name;
        expect(names.map(n => n.trim())).toContain(priciestName);
        // RE2: ningún precio mostrado es menor que el límite inferior
        for (const price of await shownPrices(page)) expect(price).toBeGreaterThanOrEqual(justBelow);

        // Valor límite fuera: min = ceil(max precio) -> sin productos
        await moveHandleTo(page, minHandle(page), justAbove);
        // RE3: sin productos y mensaje de sin resultados
        await expect(page.locator('[data-test="no-results"]')).toBeVisible();
        await expect(page.locator('[data-test="product-name"]')).toHaveCount(0);
    });

    // CP-3.2.3 | Sistema | Funcional positivo | Partición de equivalencia VÁLIDA (rango intermedio)
    test('CP-3.2.3 Un rango intermedio solo muestra productos dentro del rango', async ({page, request}) => {
        const min = 10, max = 30;
        const catalog = await fetchCatalog(request);
        const expected = catalog.filter(p => inRange(p, min, max));

        await openHome(page);
        await moveHandleTo(page, maxHandle(page), max);
        await moveHandleTo(page, minHandle(page), min);

        // RE1: el slider refleja los valores elegidos
        await expect(minHandle(page)).toHaveAttribute('aria-valuenow', String(min));
        await expect(maxHandle(page)).toHaveAttribute('aria-valuenow', String(max));
        // RE2: cantidad de tarjetas = oráculo (paginado de 9)
        await expect(page.locator('[data-test="product-name"]')).toHaveCount(Math.min(expected.length, 9));
        // RE3: todos los precios mostrados están dentro de [min, max]
        for (const price of await shownPrices(page)) {
            expect(price).toBeGreaterThanOrEqual(min);
            expect(price).toBeLessThanOrEqual(max);
        }
    });

    // CP-3.2.4 | Sistema | Funcional | TABLA DE DECISIÓN (término de búsqueda x rango de precios)
    //   Regla | ¿término coincide? | ¿rango incluye coincidencias? | Resultado esperado
    //   R1    | Sí                 | Sí                            | solo coincidencias dentro del rango
    //   R2    | Sí                 | No                            | sin resultados
    //   R3    | No                 | Sí                            | sin resultados
    const rules = [
        {rule: 'R1', term: 'Pliers', matches: true, rangeIncludes: true},
        {rule: 'R2', term: 'Pliers', matches: true, rangeIncludes: false},
        {rule: 'R3', term: 'zzzxyz', matches: false, rangeIncludes: true},
    ];
    for (const r of rules) {
        test(`CP-3.2.4-${r.rule} Tabla de decisión: coincide=${r.matches}, rango incluye=${r.rangeIncludes}`, async ({page, request}) => {
            const catalog = await fetchCatalog(request);
            const matching = catalog.filter(p => p.name.toLowerCase().includes(r.term.toLowerCase()));
            // Rango dinámico: incluye todas las coincidencias (R1/R3) o queda por debajo de todas (R2)
            let max: number;
            if (r.rangeIncludes) max = Math.min(200, Math.ceil(Math.max(...(matching.length ? matching : catalog).map(p => p.price))));
            else max = Math.max(1, Math.floor(Math.min(...matching.map(p => p.price))));
            const expected = r.matches ? matching.filter(p => inRange(p, 1, max)) : [];

            await openHome(page);
            await search(page, r.term);
            // El slider vuelve a [1,100] tras buscar; se ajusta el máximo
            await moveHandleTo(page, maxHandle(page), max);

            if (expected.length === 0) {
                // RE: sin resultados
                await expect(page.locator('[data-test="no-results"]')).toBeVisible();
                await expect(page.locator('[data-test="product-name"]')).toHaveCount(0);
            } else {
                // RE: solo las coincidencias que además están dentro del rango
                await expect(page.locator('[data-test="no-results"]')).toHaveCount(0);
                const names = (await page.locator('[data-test="product-name"]').allTextContents()).map(n => n.trim());
                expect(names.sort()).toEqual(expected.map(p => p.name).sort().slice(0, 9));
                for (const price of await shownPrices(page)) expect(price).toBeLessThanOrEqual(max);
            }
        });
    }
});

// =====================================================================================
// CAJA BLANCA: cobertura de ramas de ProductService::searchProducts()
//   Rama A: texto sanitizado vacío        -> whereRaw('1=0')
//   Rama B: longitud < 4                  -> LIKE '%texto%'
//   Rama C: longitud >= 4 (MySQL/MariaDB) -> MATCH ... AGAINST (+palabra*) en modo BOOLEAN
// =====================================================================================
test.describe('Caja blanca: cobertura de ramas de searchProducts()', () => {

    test('WB-3.1.1 Rama A (texto sanitizado vacío) devuelve conjunto vacío', async ({page}) => {
        await openHome(page);
        await search(page, '!!!???');
        // RE: la rama "1=0" no devuelve ningún producto
        await expect(page.locator('[data-test="no-results"]')).toBeVisible();
        await expect(page.locator('[data-test="product-name"]')).toHaveCount(0);
    });

    test('WB-3.1.2 Rama B (< 4 caracteres, LIKE) encuentra coincidencias en cualquier posición', async ({page, request}) => {
        const expected = (await fetchCatalog(request)).filter(p => /enc/i.test(p.name));
        expect(expected.length).toBeGreaterThan(0);

        await openHome(page);
        await search(page, 'enc'); // 3 caracteres -> LIKE '%enc%'
        // RE: LIKE encuentra "enc" dentro de "Wrench" / "Workbench"
        await expect(page.locator('[data-test="search-result-count"]')).toContainText(String(expected.length));
        const names = (await page.locator('[data-test="product-name"]').allTextContents()).join('|');
        expect(names).toMatch(/Wrench/);
    });

    test('WB-3.1.3 Rama C (>= 4 caracteres, FULLTEXT) encuentra por prefijo de palabra', async ({page}) => {
        await openHome(page);
        await search(page, 'wren'); // 4 caracteres -> MATCH(+wren*)
        // RE: el prefijo de palabra "wren" encuentra "Adjustable Wrench"
        await expect(page.locator('[data-test="product-name"]').first()).toContainText('Wrench');
    });

    // DEF-01 (defecto candidato): las ramas B y C no son consistentes entre sí.
    // "enc" (rama B) encuentra "Wrench", pero "renc" (rama C) NO, aunque ambos son subcadenas del nombre.
    // RE (según el comportamiento de la rama B y la expectativa del usuario): "renc" también debe encontrar "Wrench".
    test('WB-3.1.4 [DEF-01] Subcadena de 4 caracteres debe comportarse igual que una de 3', async ({page}) => {
        await openHome(page);
        await search(page, 'renc');
        await expect(page.locator('[data-test="product-name"]').first()).toContainText('Wrench');
    });
});
