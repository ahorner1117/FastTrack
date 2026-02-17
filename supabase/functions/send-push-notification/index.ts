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
        status: 401,
        headers: jsonHeaders,
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const { recipient_user_id, title, body } = await req.json();
    if (!recipient_user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "recipient_user_id, title, and body are required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Use service role to look up recipient's push token
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("push_token")
      .eq("id", recipient_user_id)
      .single();

    if (profileError || !profile?.push_token) {
      // No push token = user hasn't enabled notifications, not an error
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: "no_push_token" }),
        { headers: jsonHeaders }
      );
    }

    // Send push notification via Expo Push API
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: profile.push_token,
        title,
        body,
        sound: "default",
        data: { screen: "friend-requests" },
      }),
    });

    const pushResult = await pushResponse.json();

    if (pushResult.data?.status === "error") {
      console.error("Expo push error:", pushResult.data.message);
      return new Response(
        JSON.stringify({ success: false, error: pushResult.data.message }),
        { headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sent: true }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${err.message}` }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
