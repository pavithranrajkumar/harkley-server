import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment configuration interface
interface EnvConfig {
  // Server
  NODE_ENV: string;
  PORT: number;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Database
  DATABASE_URL: string;

  // Deepgram
  DEEPGRAM_API_KEY: string;

  // OpenAI
  OPENAI_API_KEY: string;

  // Server
  BASE_URL: string;
}

// Validate required environment variables
const validateEnv = (): EnvConfig => {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DEEPGRAM_API_KEY',
    'OPENAI_API_KEY',
    'BASE_URL',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),

    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,

    // Database
    DATABASE_URL: process.env.DATABASE_URL!,

    // Deepgram
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY!,

    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,

    // Server
    BASE_URL: process.env.BASE_URL!,
  };
};

// Export validated environment configuration
export const env = validateEnv();

// Helper functions
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';
