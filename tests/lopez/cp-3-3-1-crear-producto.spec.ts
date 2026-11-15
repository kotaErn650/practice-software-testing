import { test, expect } from '@playwright/test';

test.describe('CP-3.3.1 - Crear Productos (Caso Positivo)', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Usuario autenticado como Admin y 2. Ingresar a la sesión de Productos
    await page.goto('/auth/login');
    await page.getByTestId('email').fill('admin@practicesoftwaretesting.com');
    await page.getByTestId('password').fill('welcome01');
    await page.getByTestId('login-submit').click();
    
    await page.waitForURL('**/admin/**');
    await page.goto('/admin/products/add');
  });

  test('El sistema guarda el producto exitosamente', async ({ page }) => {
    // Pasos de ejecución
await page.getByTestId('name').fill('Hammer PRO');
    await page.getByTestId('description').fill('Hammer for use hands');
    await page.getByTestId('stock').fill('50');
    await page.getByTestId('price').fill('25.50');
    
    // Seleccionamos la primera opción de los desplegables usando su posición en la página
    await page.locator('select').nth(1).selectOption({ index: 1 }); // Brand
    await page.locator('select').nth(2).selectOption({ index: 1 }); // Category
    await page.locator('select').nth(3).selectOption({ index: 1 }); // Image
    
    await page.getByTestId('product-submit').click();

    const successMessage = page.getByText('Product saved!');
    await expect(successMessage).toBeVisible();
  });
});