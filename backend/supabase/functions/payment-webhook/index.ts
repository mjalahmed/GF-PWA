/**
 * Payment provider webhooks — separate from the user JWT API.
 * Verifies provider signatures; does not use Authorization Bearer user tokens.
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-provider-signature, x-request-id",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: { code: "METHOD_NOT_ALLOWED" } }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const signature = req.headers.get("x-provider-signature");
  const rawBody = await req.text();

  // Foundation stub: signature verification + event persistence land with payments phase.
  if (!signature) {
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: {
          code: "AUTH_REQUIRED",
          message: "Provider signature is required.",
          details: null,
        },
        meta: { requestId },
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId },
      },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY");
  if (!supabaseUrl || !secretKey) {
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: { code: "CONFIGURATION_ERROR", message: "Server is misconfigured.", details: null },
        meta: { requestId },
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Placeholder: hash body for future idempotent event storage keyed by provider event id.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${signature}:${rawBody}`),
  );
  const eventHash = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        accepted: true,
        eventHash,
        note: "Payment webhook foundation stub — full processing arrives in payments phase.",
      },
      error: null,
      meta: { requestId },
    }),
    {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId },
    },
  );
});
