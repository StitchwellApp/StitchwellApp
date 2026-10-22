import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const authorization = request.headers.get("Authorization");
  const jwt = authorization?.replace(/^Bearer\s+/i, "");
  if (!jwt)
    return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey)
    return Response.json({ error: "Account deletion is not configured" }, { status: 500, headers: corsHeaders });

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(jwt);
  if (authError || !authData.user)
    return Response.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders });

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userId = authData.user.id;
  const { data: sals, error: salError } = await admin
    .from("sals")
    .select("id,cover_path")
    .eq("designer_id", userId);
  if (salError)
    return Response.json({ error: "Could not prepare account data for deletion" }, { status: 500, headers: corsHeaders });

  const salIds = (sals || []).map((sal) => sal.id);
  const { data: files, error: filesError } = salIds.length
    ? await admin.from("pattern_files").select("storage_path").in("sal_id", salIds)
    : { data: [], error: null };
  if (filesError)
    return Response.json({ error: "Could not prepare pattern files for deletion" }, { status: 500, headers: corsHeaders });

  const patternPaths = (files || []).map((file) => file.storage_path);
  const coverPaths = (sals || []).map((sal) => sal.cover_path).filter(Boolean);
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("avatar_path")
    .eq("id", userId)
    .maybeSingle();
  if (profileError)
    return Response.json({ error: "Could not prepare profile photo for deletion" }, { status: 500, headers: corsHeaders });
  const avatarPaths = profile?.avatar_path ? [profile.avatar_path] : [];

  const removals = await Promise.all([
    patternPaths.length ? admin.storage.from("sal-patterns").remove(patternPaths) : Promise.resolve({ error: null }),
    coverPaths.length ? admin.storage.from("sal-covers").remove(coverPaths) : Promise.resolve({ error: null }),
    avatarPaths.length ? admin.storage.from("avatars").remove(avatarPaths) : Promise.resolve({ error: null }),
  ]);
  if (removals.some((result) => result.error))
    return Response.json({ error: "Could not remove all stored files; account was not deleted" }, { status: 500, headers: corsHeaders });

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError)
    return Response.json({ error: "Could not delete the account" }, { status: 500, headers: corsHeaders });
  return Response.json({ deleted: true }, { headers: corsHeaders });
});
