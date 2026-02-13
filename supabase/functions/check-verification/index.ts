import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

async function hashPhone(phone: string): Promise<string> {
  // Match logic from src/services/contactsService.ts:
  // Strip non-digits, take last 10 digits, SHA-256 hex
  const normalized = phone.replace(/\D/g, "").slice(-10);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        headers: jsonHeaders,
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: jsonHeaders,
      });
    }

    const { request_id, code, phone } = await req.json();
    if (!request_id || !code || !phone) {
      return new Response(
        JSON.stringify({ error: "request_id, code, and phone are required" }),
        { headers: jsonHeaders }
      );
    }

    const apiKey = Deno.env.get("VONAGE_API_KEY")!;
    const apiSecret = Deno.env.get("VONAGE_API_SECRET")!;

    const params = new URLSearchParams({
      api_key: apiKey,
      api_secret: apiSecret,
      request_id: request_id,
      code: code,
    });

    const vonageRes = await fetch(
      `https://api.nexmo.com/verify/check/json?${params.toString()}`
    );
    const vonageData = await vonageRes.json();

    if (vonageData.status !== "0") {
      console.error("Vonage check error:", vonageData);
      return new Response(
        JSON.stringify({ error: vonageData.error_text || "Invalid verification code" }),
        { headers: jsonHeaders }
      );
    }

    // Verification succeeded — compute phone hash and update profile
    const phone_hash = await hashPhone(phone);

    // Use service role client to bypass RLS
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({ phone_hash })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Verified but failed to save. Try again." }),
        { headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${err.message}` }),
      { headers: jsonHeaders }
    );
  }
});
