/** Connection details for the optional Supabase account. */
export interface SupabaseConfig {
  /** Project URL, for example https://abcd.supabase.co (no trailing slash). */
  readonly url: string;
  /** The project's public anon key. It is safe in the browser; row-level security protects the data. */
  readonly anonKey: string;
}

/**
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Returns null when either is
 * missing or the URL is not https, in which case progress stays on this device.
 */
export function readSupabaseConfig(
  env: Readonly<Record<string, string | boolean | undefined>> = import.meta.env,
): SupabaseConfig | null {
  const url = typeof env.VITE_SUPABASE_URL === "string" ? env.VITE_SUPABASE_URL.trim() : "";
  const anonKey = typeof env.VITE_SUPABASE_ANON_KEY === "string" ? env.VITE_SUPABASE_ANON_KEY.trim() : "";
  if (!url || !anonKey) {
    return null;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return null;
    }
  } catch {
    return null;
  }
  return { url: url.replace(/\/+$/, ""), anonKey };
}
