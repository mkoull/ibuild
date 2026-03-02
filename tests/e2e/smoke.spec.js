import { test, expect } from "@playwright/test";

test("dashboard and global navigation render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "All Projects" })).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});

test("quotes list page opens", async ({ page }) => {
  await page.goto("/quotes");
  await expect(page.getByRole("heading", { name: "Quotes" })).toBeVisible();
});

