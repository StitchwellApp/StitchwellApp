import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The local preview can still run without credentials. When .env.local is
// configured, this client connects to the selected Supabase project.
export const supabase = url && key ? createClient(url, key) : null;
export const supabaseConfigured = Boolean(supabase);
