const requiredEnvironmentVariables = [
  'DATABASE_URL',
  'FRONTEND_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CALLBACK_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
] as const;

export function validateEnvironment(environment: Record<string, unknown>) {
  if (environment.NODE_ENV === 'test') {
    return environment;
  }

  const missingVariables = requiredEnvironmentVariables.filter(
    (name) =>
      typeof environment[name] !== 'string' ||
      environment[name].trim().length === 0,
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(', ')}`,
    );
  }

  if (
    environment.NODE_ENV === 'production' &&
    environment.JWT_SECRET === 'your-super-secret-jwt-key'
  ) {
    throw new Error('JWT_SECRET must be changed before running in production.');
  }

  return environment;
}