import { test, expect } from '@playwright/test';

/**
 * Authentication Tests - SCRUM-13
 * Tests for login, logout, and authentication flows
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form when not authenticated', async ({ page }) => {
    // Verify login form elements are visible
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Try to login with invalid credentials
    await page.getByLabel('Username').fill('invaliduser');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show error message
    await expect(page.getByText(/invalid credentials|error/i)).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with admin user', async ({ page }) => {
    // Login with admin credentials (from DbSeeder)
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show logged in state with tabs
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: 'Cars' })).toBeVisible();
  });

  test('should login successfully with regular user', async ({ page }) => {
    // Login with user credentials (from DbSeeder)
    await page.getByLabel('Username').fill('user');
    await page.getByLabel('Password').fill('user123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show logged in state
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: 'Cars' })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for login to complete
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });

    // Click logout
    await page.getByRole('button', { name: 'Logout' }).click();

    // Should return to login form
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
  });
});
