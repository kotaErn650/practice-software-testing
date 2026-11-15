
import { test, expect } from '@playwright/test';

test('TC-GAR-001 - Buscar producto existente', async ({ page }) => {
  await page.goto('/');

  const buscador = page.locator('[data-test="search-query"]');
  const botonBuscar = page.locator('[data-test="search-submit"]');
  const resultados = page.locator('[data-test="product-name"]');

  await expect(buscador).toBeVisible();

  await buscador.fill('hammer');
  await botonBuscar.click();

  await expect.poll(async () => resultados.count()).toBeGreaterThan(0);

  const nombres = await resultados.allTextContents();

  expect(
    nombres.some(nombre => nombre.toLowerCase().includes('hammer'))
  ).toBeTruthy();

  await page.screenshot({
    path: 'evidencias/TC-GAR-001.png',
    fullPage: true
  });
});
