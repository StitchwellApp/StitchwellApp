import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The local preview deliberately runs without credentials. Live auth and data
// screens will use this client after the Client-owned project is available.
export const supabase = url && key ? createClient(url, key) : null;
