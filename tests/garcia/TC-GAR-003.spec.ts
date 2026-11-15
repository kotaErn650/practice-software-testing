
import { test, expect } from '@playwright/test';

test('TC-GAR-003 - Ordenar productos por precio ascendente', async ({ page }) => {
  await page.goto('/');

  const selector = page.locator('[data-test="sort"]');
  const elementosPrecio = page.locator('[data-test="product-price"]');

  await expect(selector).toBeVisible();

  await selector.selectOption('price,asc');

  await expect.poll(async () => elementosPrecio.count())
    .toBeGreaterThan(1);

  const textos = await elementosPrecio.allTextContents();

  const precios = textos.map(texto => {
    const limpio = texto.replace(/[^\d.,]/g, '');
    return Number(limpio.replace(/,/g, ''));
  });

  expect(precios.every(Number.isFinite)).toBeTruthy();

  const ordenados = [...precios].sort((a, b) => a - b);

  expect(precios).toEqual(ordenados);

  await page.screenshot({
    path: 'evidencias/TC-GAR-003.png',
    fullPage: true
  });
});
