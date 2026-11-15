import { test, expect } from "@playwright/test";

test.describe("CP-3.3.4 - Actualización de Estado de Órdenes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByTestId("email").fill("admin@practicesoftwaretesting.com");
    await page.getByTestId("password").fill("welcome01");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/admin/**");
  });

  test("Editar el estado de una orden a un nuevo estado válido", async ({
    page,
  }) => {
    await page.waitForSelector("table");

    // Apuntamos a la orden 35 para tener un registro fresco que editar
    await page
      .getByRole("row")
      .filter({ hasText: "INV-20260000035" })
      .getByText("Edit")
      .click();

    await page.getByTestId("order-status").selectOption({ label: "COMPLETED" });
    await page
      .getByTestId("status-message")
      .fill("Orden verificada y completada.");
    await page.getByText("Update status").click();

    await expect(page.getByText(/updated/i)).toBeVisible();
  });
});
