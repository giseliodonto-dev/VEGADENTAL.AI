import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_ROLES = [
  "dono",
  "recepcao",
  "dentista",
  "crm",
  "sdr",
  "admin",
  "protetico",
] as const;

type AppRole = (typeof VALID_ROLES)[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autenticado" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return json({ error: "Sessão inválida" }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Body inválido" }, 400);

    const email = String(body.email ?? "").trim().toLowerCase();
    const clinicId = String(body.clinicId ?? "").trim();
    const role = String(body.role ?? "").trim() as AppRole;
    const origin = String(body.origin ?? "").trim().replace(/\/+$/, "");

    if (!email || !email.includes("@")) {
      return json({ error: "E-mail inválido" }, 400);
    }
    if (!clinicId) return json({ error: "clinicId obrigatório" }, 400);
    if (!VALID_ROLES.includes(role)) {
      return json({ error: `Cargo inválido. Use: ${VALID_ROLES.join(", ")}` }, 400);
    }
    if (!origin) return json({ error: "origin obrigatório" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Caller must be 'dono' of this clinic
    const { data: membership, error: memErr } = await admin
      .from("clinic_members")
      .select("role")
      .eq("user_id", userId)
      .eq("clinic_id", clinicId)
      .maybeSingle();
    if (memErr) return json({ error: memErr.message }, 500);
    if (!membership || membership.role !== "dono") {
      return json({ error: "Apenas o dono da clínica pode convidar" }, 403);
    }

    // Check for existing invite (any status) — unique key is (clinic_id, email)
    const { data: existing } = await admin
      .from("invites")
      .select("id, token, status")
      .eq("clinic_id", clinicId)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      // Reactivate (covers cancelled/accepted/pending) and refresh role/inviter
      const { data: updated, error: updErr } = await admin
        .from("invites")
        .update({
          status: "pending",
          role,
          invited_by: userId,
          accepted_at: null,
        })
        .eq("id", existing.id)
        .select("token")
        .single();

      if (updErr) return json({ error: updErr.message }, 500);

      return json({
        inviteUrl: `${origin}/convite/${updated.token}`,
        reused: true,
      });
    }

    const { data: inserted, error: insErr } = await admin
      .from("invites")
      .insert({
        email,
        clinic_id: clinicId,
        role,
        invited_by: userId,
        status: "pending",
      })
      .select("token")
      .single();

    if (insErr) return json({ error: insErr.message }, 500);

    return json({
      inviteUrl: `${origin}/convite/${inserted.token}`,
      reused: false,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
