import { createServerClient } from '@supabase/ssr';
import { cookies, CookieSerializeOptions } from 'next/headers'; // Import CookieSerializeOptions

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! as string,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieSerializeOptions) => cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: CookieSerializeOptions) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  );
};
