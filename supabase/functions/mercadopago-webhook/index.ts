import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAN_DAYS: Record<string, number> = {
  dante_plus: 30,
  dante_premium: 30,
  dante_premium_plus: 30,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "not_configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({})) as {
      type?: string;
      data?: { id?: string };
      action?: string;
    };

    // Mercado Pago sends notification with type and data.id
    const resourceId = body.data?.id;
    const resourceType = body.type;

    if (!resourceId) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the preapproval details from Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!mpRes.ok) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const preapproval = await mpRes.json() as {
      external_reference?: string;
      status?: string;
      auto_recurring?: { frequency?: number; frequency_type?: string };
    };

    // external_reference is "userId:planId"
    const ref = preapproval.external_reference ?? "";
    const [userId, planId] = ref.split(":");

    if (!userId || !planId || !PLAN_DAYS[planId]) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only activate when the preapproval is authorized/active
    const validStatuses = ["authorized", "active", "pending"];
    if (!validStatuses.includes(preapproval.status ?? "")) {
      return new Response(JSON.stringify({ ok: true, status: preapproval.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const days = PLAN_DAYS[planId] ?? 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase.rpc("activate_subscription_plan", {
      p_user_id: userId,
      p_plan: planId,
      p_expires_at: expiresAt.toISOString(),
    });

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also award referral subscription bonus if applicable
    await supabase.rpc("award_referral_subscription", {
      p_referred_id: userId,
      p_plan: planId,
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
