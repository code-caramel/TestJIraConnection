import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * API Integration Tests - SCRUM-13
 * Backend API endpoint tests for authentication, cars, users, roles
 *
 * These tests verify all API endpoints work correctly.
 * The webServer configuration in playwright.config.ts ensures both servers are running.
 */

const API_BASE = 'http://localhost:5051/api';

// Store tokens for reuse across tests
let adminToken: string = '';
let userToken: string = '';

// Configure all tests to run serially to avoid race conditions
test.describe.configure({ mode: 'serial' });

// Helper function to login and get token
async function login(request: APIRequestContext, username: string, password: string): Promise<string> {
  const response = await request.post(`${API_BASE}/Auth/login`, {
    data: { userName: username, password: password }
  });
  if (response.status() === 200) {
    const body = await response.json();
    return body.token;
  }
  return '';
}

// This test forces Playwright to start the webServer by using the page fixture
// and also initializes the tokens for subsequent tests
test('API server health check and initialization', async ({ page, request }) => {
  // Navigate to frontend to ensure both servers are started via webServer config
  await page.goto('/');
  // Wait for form to be visible (language-agnostic)
  await expect(page.locator('form')).toBeVisible({ timeout: 30000 });

  // Verify API is accessible
  const carsResponse = await request.get(`${API_BASE}/Car`);
  expect(carsResponse.status()).toBe(200);

  // Initialize tokens for subsequent tests
  adminToken = await login(request, 'admin', 'admin123');
  userToken = await login(request, 'user', 'user123');

  expect(adminToken).toBeTruthy();
  expect(userToken).toBeTruthy();
});

// ============================================================
// Authentication Endpoints
// ============================================================

test.describe('API - Authentication Endpoints', () => {
  test('POST /Auth/login - should login with valid admin credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/Auth/login`, {
      data: {
        userName: 'admin',
        password: 'admin123'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('permissions');
    expect(Array.isArray(body.permissions)).toBe(true);
  });

  test('POST /Auth/login - should login with valid user credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/Auth/login`, {
      data: {
        userName: 'user',
        password: 'user123'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('permissions');
  });

  test('POST /Auth/login - should return 401 for invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/Auth/login`, {
      data: {
        userName: 'invaliduser',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('GET /Auth/me - should return current user info with valid token', async ({ request }) => {
    const response = await request.get(`${API_BASE}/Auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('userName');
    expect(body.userName).toBe('admin');
    expect(body).toHaveProperty('roles');
    expect(body).toHaveProperty('permissions');
  });

  test('GET /Auth/me - should return 401 without token', async ({ request }) => {
    const response = await request.get(`${API_BASE}/Auth/me`);
    expect(response.status()).toBe(401);
  });
});

// ============================================================
// Car Endpoints
// ============================================================

test.describe('API - Car Endpoints', () => {
  test('GET /Car - should return list of cars', async ({ request }) => {
    const response = await request.get(`${API_BASE}/Car`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const cars = await response.json();
    expect(Array.isArray(cars)).toBe(true);
    expect(cars.length).toBeGreaterThanOrEqual(2); // At least Car A and Car B from seeder

    // Check car structure
    if (cars.length > 0) {
      expect(cars[0]).toHaveProperty('id');
      expect(cars[0]).toHaveProperty('name');
      expect(cars[0]).toHaveProperty('status');
    }
  });

  test('GET /Car/{id} - should return specific car', async ({ request }) => {
    // First get all cars
    const carsResponse = await request.get(`${API_BASE}/Car`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const cars = await carsResponse.json();

    expect(cars.length).toBeGreaterThan(0);
    const carId = cars[0].id;

    const response = await request.get(`${API_BASE}/Car/${carId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const car = await response.json();
    expect(car).toHaveProperty('id');
    expect(car.id).toBe(carId);
    expect(car).toHaveProperty('name');
    expect(car).toHaveProperty('status');
  });

  test('GET /Car/{id} - should return 404 for non-existent car', async ({ request }) => {
    const response = await request.get(`${API_BASE}/Car/99999`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(404);
  });

  test('GET /Car/statuses - should return car statuses', async ({ request }) => {
    const response = await request.get(`${API_BASE}/Car/statuses`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const statuses = await response.json();
    expect(Array.isArray(statuses)).toBe(true);
    expect(statuses.length).toBeGreaterThanOrEqual(2); // Stopped and Running

    // Verify expected statuses exist
    const statusNames = statuses.map((s: any) => s.status);
    expect(statusNames).toContain('Stopped');
    expect(statusNames).toContain('Running');
  });

  test('POST /Car/{id}/start - user should be able to start a car', async ({ request }) => {
    // Get a car first
    const carsResponse = await request.get(`${API_BASE}/Car`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const cars = await carsResponse.json();
    expect(cars.length).toBeGreaterThan(0);

    const carId = cars[0].id;

    // Start the car (user has StartCar permission)
    const response = await request.post(`${API_BASE}/Car/${carId}/start`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: {}
    });

    expect(response.status()).toBe(200);

    // Verify the car is now running
    const carResponse = await request.get(`${API_BASE}/Car/${carId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const car = await carResponse.json();
    expect(car.status.status).toBe('Running');
  });

  test('POST /Car/{id}/stop - user should be able to stop a car', async ({ request }) => {
    // Get a car first
    const carsResponse = await request.get(`${API_BASE}/Car`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const cars = await carsResponse.json();
    expect(cars.length).toBeGreaterThan(0);

    const carId = cars[0].id;

    // Stop the car (user has StopCar permission)
    const response = await request.post(`${API_BASE}/Car/${carId}/stop`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: {}
    });

    expect(response.status()).toBe(200);

    // Verify the car is now stopped
    const carResponse = await request.get(`${API_BASE}/Car/${carId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const car = await carResponse.json();
    expect(car.status.status).toBe('Stopped');
  });

  test('POST /Car/{id}/start - admin without StartCar permission should fail', async ({ request }) => {
    // Get a car first
    const carsResponse = await request.get(`${API_BASE}/Car`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const cars = await carsResponse.json();
    expect(cars.length).toBeGreaterThan(0);

    const carId = cars[0].id;

    // Admin doesn't have StartCar permission (only ManageUsers, ManageRoles, ManageCars)
    const response = await request.post(`${API_BASE}/Car/${carId}/start`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {}
    });

    // Should be forbidden
    expect(response.status()).toBe(403);
  });
});

// ============================================================
// User Endpoints
// ============================================================

test.describe('API - User Endpoints', () => {
  test('GET /User - admin should get list of users', async ({ request }) => {
    const response = await request.get(`${API_BASE}/User`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(2); // admin and user from seeder

    // Check user structure
    if (users.length > 0) {
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('userName');
      expect(users[0]).toHaveProperty('roles');
    }
  });

  test('GET /User - regular user should be forbidden', async ({ request }) => {
    const response = await request.get(`${API_BASE}/User`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    expect(response.status()).toBe(403);
  });

  test('GET /User/{id} - admin should get specific user', async ({ request }) => {
    // First get all users
    const usersResponse = await request.get(`${API_BASE}/User`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const users = await usersResponse.json();

    expect(users.length).toBeGreaterThan(0);
    const userId = users[0].id;

    const response = await request.get(`${API_BASE}/User/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const user = await response.json();
    expect(user).toHaveProperty('id');
    expect(user.id).toBe(userId);
  });
});

// ============================================================
// Role Endpoints
// ============================================================

test.describe('API - Role Endpoints', () => {
  test('GET /Role - admin should get list of roles', async ({ request }) => {
    const response = await request.get(`${API_BASE}/Role`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const roles = await response.json();
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBeGreaterThanOrEqual(2); // Admin and User from seeder

    // Check role structure
    if (roles.length > 0) {
      expect(roles[0]).toHaveProperty('id');
      expect(roles[0]).toHaveProperty('name');
      expect(roles[0]).toHaveProperty('permissions');
    }
  });

  test('GET /Role - regular user should be forbidden', async ({ request }) => {
    const response = await request.get(`${API_BASE}/Role`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    expect(response.status()).toBe(403);
  });

  test('GET /Role/{id} - admin should get specific role', async ({ request }) => {
    // First get all roles
    const rolesResponse = await request.get(`${API_BASE}/Role`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const roles = await rolesResponse.json();

    expect(roles.length).toBeGreaterThan(0);
    const roleId = roles[0].id;

    const response = await request.get(`${API_BASE}/Role/${roleId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const role = await response.json();
    expect(role).toHaveProperty('id');
    expect(role.id).toBe(roleId);
    expect(role).toHaveProperty('name');
    expect(role).toHaveProperty('permissions');
  });
});

// ============================================================
// Permission Endpoints
// ============================================================

test.describe('API - Permission Endpoints', () => {
  test('GET /Permission - admin should get list of permissions', async ({ request }) => {
    const response = await request.get(`${API_BASE}/Permission`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const permissions = await response.json();
    expect(Array.isArray(permissions)).toBe(true);
    expect(permissions.length).toBeGreaterThanOrEqual(6); // From seeder

    // Check expected permissions exist
    const permissionNames = permissions.map((p: any) => p.name);
    expect(permissionNames).toContain('ManageUsers');
    expect(permissionNames).toContain('ManageRoles');
    expect(permissionNames).toContain('ManageCars');
    expect(permissionNames).toContain('StartCar');
    expect(permissionNames).toContain('StopCar');
    expect(permissionNames).toContain('GetCarStatus');
  });
});
