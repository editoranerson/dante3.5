import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLANS: Record<string, { title: string; price: number }> = {
  dante_plus: { title: "Dante Plus", price: 4.9 },
  dante_premium: { title: "Dante Premium", price: 9.9 },
  dante_premium_plus: { title: "Dante Premium+", price: 19.9 },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function mpError(raw: string, status: number): string {
  let msg = `Mercado Pago recusou a solicitação (${status}).`;
  try {
    const e = JSON.parse(raw) as {
      message?: string;
      error?: string;
      cause?: Array<{ description?: string }>;
    };
    if (e.cause?.[0]?.description) msg = e.cause[0].description;
    else if (e.message) msg = e.message;
    else if (e.error) msg = e.error;
  } catch {
    /* mantém mensagem padrão */
  }
  return msg;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!token) return json({ error: "Pagamento não configurado." }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Não autenticado." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) {
      return json({ error: "Sessão inválida. Faça login novamente." }, 401);
    }

    const body = await req.json().catch(() => ({})) as {
      plan?: string;
      card_token_id?: string;
      payer_email?: string;
      success_url?: string;
    };

    const planId = String(body.plan ?? "");
    const plan = PLANS[planId];
    if (!plan) return json({ error: `Plano inválido: ${planId}` }, 400);

    const payerEmail = String(body.payer_email ?? "").trim() || userData.user.email || "";
    if (!payerEmail) {
      return json({ error: "E-mail não encontrado. Atualize seu cadastro." }, 400);
    }

    const cardTokenId = String(body.card_token_id ?? "");
    if (!cardTokenId) {
      // Checkout Transparente é obrigatório: sem token de cartão não há como
      // cobrar sem redirecionar o usuário para o app/site do Mercado Pago.
      return json({ error: "Cartão não informado." }, 400);
    }

    // ===== Checkout Transparente: assinatura recorrente mensal (preapproval) =====
    // O cartão foi tokenizado no navegador pelo SDK do Mercado Pago, então o
    // usuário nunca sai do site e nenhum deep link abre o app.
    const preapproval = {
      reason: `${plan.title} — assinatura mensal`,
      external_reference: `${userData.user.id}:${planId}`,
      payer_email: payerEmail,
      card_token_id: cardTokenId,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.price,
        currency_id: "BRL",
      },
      back_url: /^https:\/\//.test(String(body.success_url ?? ""))
        ? String(body.success_url)
        : `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      status: "authorized",
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${userData.user.id}-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(preapproval),
    });

    const raw = await mpRes.text();
    if (!mpRes.ok) return json({ error: mpError(raw, mpRes.status) }, 400);

    const data = JSON.parse(raw) as { id?: string; status?: string };
    const status = data.status ?? "";

    if (status === "authorized") {
      // Libera o plano na hora; o webhook continua confirmando as renovações.
      const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await admin.rpc("activate_subscription_plan", {
        p_user_id: userData.user.id,
        p_plan: planId,
        p_expires_at: expiresAt.toISOString(),
      });
      if (error) {
        return json({ error: "Pagamento aprovado, mas falhou ao liberar o plano." }, 500);
      }

      await admin
        .rpc("award_referral_subscription", { p_referred_id: userData.user.id, p_plan: planId })
        .catch(() => {});

      return json({ id: data.id, status, activated: true });
    }

    return json({ id: data.id, status, activated: false });
  } catch {
    return json({ error: "Erro interno do servidor." }, 500);
  }
});
