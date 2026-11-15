import { test, expect } from "@playwright/test";

test.describe("CP-3.3.3 - Campos Vacíos", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Usuario autenticado como Admin y 2. Ingresar a la sesión de Productos
    await page.goto("/auth/login");
    await page.getByTestId("email").fill("admin@practicesoftwaretesting.com");
    await page.getByTestId("password").fill("welcome01");
    await page.getByTestId("login-submit").click();

    await page.waitForURL("**/admin/**");
    await page.goto("/admin/products/add");
  });

  test("Crear un producto dejando campos obligatorios vacíos", async ({
    page,
  }) => {
    // 1. Dejar el campo "Name" (y los demás obligatorios) vacíos
    // 3. Hacer clic en el botón "Save"
    await page.getByTestId("product-submit").click();

    // Resultado Esperado: El sistema no permite guardar y muestra errores
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Description is required")).toBeVisible();
    await expect(page.getByText("Price is required")).toBeVisible();
  });
});
