import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: jsonHeaders,
      });
    }

    const { phone } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), {
        headers: jsonHeaders,
      });
    }

    // Strip the + prefix for Vonage (expects digits only)
    const vonagePhone = phone.replace(/^\+/, "");

    const apiKey = Deno.env.get("VONAGE_API_KEY")!;
    const apiSecret = Deno.env.get("VONAGE_API_SECRET")!;

    const params = new URLSearchParams({
      api_key: apiKey,
      api_secret: apiSecret,
      number: vonagePhone,
      brand: "FastTrack",
      code_length: "6",
    });

    const vonageRes = await fetch(
      `https://api.nexmo.com/verify/json?${params.toString()}`
    );
    const vonageData = await vonageRes.json();

    if (vonageData.status !== "0") {
      console.error("Vonage error:", vonageData);
      return new Response(
        JSON.stringify({ error: vonageData.error_text || "Failed to send verification" }),
        { headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ request_id: vonageData.request_id }),
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
