import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { env } from './env.js';
import { logger } from './logger.js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns a singleton server-side Supabase client instance.
 * Uses the Service Role Key for administrative authentication if available,
 * falling back to the anon key.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
    const supabaseKey =
      env.SUPABASE_SERVICE_ROLE_KEY ||
      env.SUPABASE_ANON_KEY ||
      'placeholder-service-role-key-for-offline-or-tests';

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Verified user payload extracted from Supabase Auth
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

/**
 * Verifies an access token with Supabase Auth and returns the verified user.
 * Never logs the token or credentials.
 */
export async function verifySupabaseToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      if (error) {
        logger.debug({ error: error.message }, 'Supabase auth.getUser token verification failed');
      }
      return null;
    }

    const user: User = data.user;
    return {
      id: user.id,
      email: user.email || '',
      fullName: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || undefined,
      avatarUrl: (user.user_metadata?.avatar_url as string) || undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown auth error';
    logger.error({ error: message }, 'Unexpected failure during Supabase token verification');
    return null;
  }
}

