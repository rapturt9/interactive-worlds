import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_USER_COOKIE = 'anonymous_user_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Gets the current user ID - either from Clerk auth or generates/retrieves
 * a unique anonymous user ID stored in cookies.
 *
 * This ensures each anonymous user has their own isolated chats.
 */
export async function getUserId(): Promise<string> {
  // First, check if user is logged in with Clerk
  const { userId } = await auth();
  if (userId) {
    return userId;
  }

  // User is not logged in - get or create anonymous user ID
  const cookieStore = await cookies();
  let anonymousId = cookieStore.get(ANONYMOUS_USER_COOKIE)?.value;

  if (!anonymousId) {
    // Generate new anonymous user ID
    anonymousId = `anon_${uuidv4()}`;

    // Store in cookie
    cookieStore.set(ANONYMOUS_USER_COOKIE, anonymousId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
  }

  return anonymousId;
}
