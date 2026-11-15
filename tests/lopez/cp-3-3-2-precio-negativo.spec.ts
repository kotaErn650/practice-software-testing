import { test, expect } from "@playwright/test";

test.describe("CP-3.3.2 - Precio Negativo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByTestId("email").fill("admin@practicesoftwaretesting.com");
    await page.getByTestId("password").fill("welcome01");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/admin/**");
    await page.goto("/admin/products/add");
  });

  test("Agregar un producto con un precio negativo (-1)", async ({ page }) => {
    await page.getByTestId("name").fill("hammer");
    await page.getByTestId("description").fill("Hammer for use hands");
    await page.getByTestId("stock").fill("10");

    // 1. Clic real en el campo
    await page.getByTestId("price").click();

    // 2. Escribir tecla por tecla con un ligero retraso simulando a un humano
    await page.getByTestId("price").pressSequentially("-1", { delay: 100 });

    // 3. Clic real en otro campo para forzar el evento "blur" (pérdida de foco)
    await page.getByTestId("name").click();

    await page.getByTestId("product-submit").click();

    // 4. Validamos el mensaje de error
    await expect(page.getByText(/price cannot be negative/i)).toBeVisible();
  });
});
