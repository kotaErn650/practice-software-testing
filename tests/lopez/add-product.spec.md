import { test, expect } from '@playwright/test';

test.describe('Gestión de Productos (Admin) - Toolshop', () => {

  // PRECONDICIÓN PARA TODOS LOS CASOS[cite: 12, 14, 15]
  // 1. Usuario autenticado como Admin
  // 2. Ingresar a la sesión de Productos
test.beforeEach(async ({ page }) => {
    // Navegar usando la ruta correcta sin "#"
    await page.goto('/auth/login');
    await page.getByTestId('email').fill('admin@practicesoftwaretesting.com');
    await page.getByTestId('password').fill('welcome01');
    await page.getByTestId('login-submit').click();
    
    // Esperar a que cargue el dashboard de admin y navegar a "Add Product"
    await page.waitForURL('**/admin/**');
    await page.goto('/admin/products/add');
  });

  
  // =======================================================
  // CASO CP-3.3.1: Crear Productos (Add Product)[cite: 12]
  // =======================================================
  test('CP-3.3.1 - Crear Productos (Caso Positivo)', async ({ page }) => {
    // Pasos de ejecución[cite: 12]
    await page.getByTestId('name').fill('Hammer PRO');
    await page.getByTestId('description').fill('Hammer for use hands');
    await page.getByTestId('stock').fill('50');
    await page.getByTestId('price').fill('25.50');
    
    // (Opcional) Seleccionar listas desplegables. Si los dropdowns usan la etiqueta select de HTML:
    // await page.locator('select[formcontrolname="brand_id"]').selectOption({ label: 'ForgeFlex Tools' });
    
    // 6. Hacer clic en el botón "Save"[cite: 12]
    await page.getByText('Save').click();

    // Resultado Esperado: Notificación de guardado exitoso[cite: 12]
    // Buscamos el banner verde que dice "Product saved!" tal como se ve en tu evidencia[cite: 13]
    const successMessage = page.getByText('Product saved!');
    await expect(successMessage).toBeVisible();
  });

  // =======================================================
  // CASO CP-3.3.2: Precio Negativo[cite: 14]
  // =======================================================
  test('CP-3.3.2 - Agregar un producto con un precio negativo (-1)', async ({ page }) => {
    // Pasos de ejecución[cite: 14]
    await page.getByTestId('name').fill('hammer');
    await page.getByTestId('description').fill('Hammer for use hands');
    await page.getByTestId('stock').fill('10');
    
    // 4. Ingresar en el campo "Price" el valor -1[cite: 14]
    await page.getByTestId('price').fill('-1');
    
    // 6. Hacer clic en el botón "Save"[cite: 14]
    await page.getByText('Save').click();

    // Resultado Esperado: Mensaje de error de validación en el campo "Price"[cite: 14]
    // Validamos el texto exacto rojo que aparece debajo del input según tu captura[cite: 15]
    const priceError = page.getByText('The price cannot be negative. Please enter a valid amount.');
    await expect(priceError).toBeVisible();
  });

  // =======================================================
  // CASO CP-3.3.3: Campos Vacíos[cite: 15]
  // =======================================================
  test('CP-3.3.3 - Crear un producto dejando campos obligatorios vacíos', async ({ page }) => {
    // Pasos de ejecución[cite: 15, 16]
    // 1. Dejar campos vacíos (simplemente no los llenamos)
    // 3. Hacer clic en el botón "Save"[cite: 15, 16]
    await page.getByText('Save').click();

    // Resultado Esperado: El sistema no permite guardar y muestra errores de validación[cite: 16, 18]
    // Validamos los textos rojos exactos que aparecen en tu evidencia para Name, Description y Price[cite: 16, 18]
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Description is required')).toBeVisible();
    await expect(page.getByText('Price is required')).toBeVisible();
  });

});