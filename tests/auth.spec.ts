import { test, expect } from '@playwright/test';

/**
 * Authentication Tests - SCRUM-13
 * Tests for login, logout, and authentication flows
 * Note: Tests use language-agnostic selectors to work regardless of UI language
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form when not authenticated', async ({ page }) => {
    // Verify login form elements are visible (language-agnostic)
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('form input').first()).toBeVisible();
    await expect(page.locator('form input[type="password"]')).toBeVisible();
    await expect(page.locator('form button')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Try to login with invalid credentials
    await page.locator('form input').first().fill('invaliduser');
    await page.locator('form input[type="password"]').fill('wrongpassword');
    await page.locator('form button').click();

    // Should show error message (MUI Alert component)
    await expect(page.locator('.MuiAlert-root')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with admin user', async ({ page }) => {
    // Login with admin credentials (from DbSeeder)
    await page.locator('form input').first().fill('admin');
    await page.locator('form input[type="password"]').fill('admin123');
    await page.locator('form button').click();

    // Should show logged in state with tabs (wait for logout button to appear)
    await expect(page.locator('button').filter({ hasText: /logout|abmelden/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab').first()).toBeVisible();
  });

  test('should login successfully with regular user', async ({ page }) => {
    // Login with user credentials (from DbSeeder)
    await page.locator('form input').first().fill('user');
    await page.locator('form input[type="password"]').fill('user123');
    await page.locator('form button').click();

    // Should show logged in state
    await expect(page.locator('button').filter({ hasText: /logout|abmelden/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab').first()).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.locator('form input').first().fill('admin');
    await page.locator('form input[type="password"]').fill('admin123');
    await page.locator('form button').click();

    // Wait for login to complete
    const logoutButton = page.locator('button').filter({ hasText: /logout|abmelden/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });

    // Click logout
    await logoutButton.click();

    // Should return to login form
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('form input').first()).toBeVisible();
  });
});
