import type { CookieOptions } from 'express';

export function getAuthCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSiteEnv = process.env.COOKIE_SAME_SITE?.toLowerCase();

  const sameSite: 'none' | 'lax' | 'strict' =
    sameSiteEnv === 'none' || sameSiteEnv === 'lax' || sameSiteEnv === 'strict'
      ? (sameSiteEnv as 'none' | 'lax' | 'strict')
      : isProduction
        ? 'none'
        : 'lax';

  const secureEnv = process.env.COOKIE_SECURE;
  const secure =
    secureEnv !== undefined
      ? secureEnv === 'true'
      : sameSite === 'none' || isProduction;

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

export function getClearCookieOptions(): CookieOptions {
  const { maxAge, ...clearOptions } = getAuthCookieOptions();
  return clearOptions;
}
