
import { test, expect } from '@playwright/test';

test('TC-GAR-002 - Buscar producto inexistente', async ({ page }) => {
  await page.goto('/');

  const buscador = page.locator('[data-test="search-query"]');
  const botonBuscar = page.locator('[data-test="search-submit"]');
  const resultados = page.locator('[data-test="product-name"]');

  await expect(buscador).toBeVisible();

  await buscador.fill('zzproducto_inexistente_987654');
  await botonBuscar.click();

  await expect(resultados).toHaveCount(0);

  await expect(buscador).toBeVisible();

  await page.screenshot({
    path: 'evidencias/TC-GAR-002.png',
    fullPage: true
  });
});

