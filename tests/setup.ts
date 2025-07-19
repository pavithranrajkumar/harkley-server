import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test configuration
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after all tests
});
