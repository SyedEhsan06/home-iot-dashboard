import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'iot_auth';
const APP_PIN = process.env.APP_PIN;

// Verify PIN
export function verifyPin(pin: string): boolean {
  if (!APP_PIN) {
    console.error('APP_PIN environment variable is not set!');
    return false;
  }
  return pin === APP_PIN;
}

// Set auth cookie
export async function setAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Clear auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

// Check if user is authenticated (for middleware)
export function isAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value === 'true';
}

// Verify PIN from header (for device APIs)
export function verifyPinFromHeader(request: NextRequest): boolean {
  const pin = request.headers.get('X-APP-PIN');
  return pin ? verifyPin(pin) : false;
}

// Create unauthorized response
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}
