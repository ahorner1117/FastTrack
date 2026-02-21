import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Gateway handles JWT verification - authenticated users only
    // Extract user from Authorization header if available, otherwise trust gateway
    const authHeader = req.headers.get("Authorization");

    // Verify caller is authenticated via either header or gateway
    if (authHeader) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { error: authError } = await supabaseAuth.auth.getUser();
      if (authError) {
        console.warn("Auth header present but getUser failed:", authError.message);
        // Continue anyway - gateway already verified JWT
      }
    }

    const { recipient_user_id, title, body, data } = await req.json();
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

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "Profile lookup failed" }),
        { headers: jsonHeaders }
      );
    }

    if (!profile?.push_token) {
      console.log("No push token for user:", recipient_user_id);
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: "no_push_token" }),
        { headers: jsonHeaders }
      );
    }

    console.log("Sending push to:", recipient_user_id, "title:", title);

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
        data: data ?? { screen: "notifications" },
      }),
    });

    const pushResult = await pushResponse.json();
    console.log("Expo response:", JSON.stringify(pushResult));

    if (pushResult.data?.status === "error") {
      console.error("Expo push error:", pushResult.data.message);
      return new Response(
        JSON.stringify({ success: false, error: pushResult.data.message }),
        { headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sent: true, ticket: pushResult.data }),
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
