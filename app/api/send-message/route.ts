import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type SendPayload = {
  conversationId?: string;
  body?: string;
};

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? getRequired("SUPABASE_URL");
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      getRequired("SUPABASE_ANON_KEY");
    const whatsappToken = process.env.WHATSAPP_TOKEN ?? "";

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const payload = (await request.json()) as SendPayload;
    const conversationId = payload.conversationId?.trim();
    const body = payload.body?.trim();

    if (!conversationId || !body) {
      return NextResponse.json(
        { error: "conversationId and body are required" },
        { status: 400 },
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await userSupabase
      .from("clinic_users")
      .select("clinic_id, clinics(phone_number_id)")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "No clinic mapping for this user" },
        { status: 403 },
      );
    }

    const phoneNumberId = (membership as { clinics?: { phone_number_id?: string } | null })
      .clinics?.phone_number_id;

    if (!phoneNumberId) {
      return NextResponse.json(
        { error: "Clinic phone_number_id not configured" },
        { status: 400 },
      );
    }

    const { data: conversation, error: conversationError } = await userSupabase
      .from("conversations")
      .select("id, patient_wa_number")
      .eq("id", conversationId)
      .eq("clinic_id", membership.clinic_id)
      .maybeSingle();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found for this clinic" },
        { status: 404 },
      );
    }

    const endpoint = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const providerPayload = {
      messaging_product: "whatsapp",
      to: conversation.patient_wa_number,
      type: "text",
      text: { body },
    };

    // This route is intentionally safe for local development: if WHATSAPP_TOKEN is
    // not configured, it returns a stubbed success response.
    if (!whatsappToken || whatsappToken.startsWith("replace_with_")) {
      return NextResponse.json({
        ok: true,
        mode: "stubbed",
        endpoint,
        payload: providerPayload,
      });
    }

    const providerResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(providerPayload),
      cache: "no-store",
    });

    const providerResult = await providerResponse.json().catch(() => ({}));

    if (!providerResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          mode: "live",
          error: "WhatsApp provider request failed",
          details: providerResult,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "live",
      provider: providerResult,
    });
  } catch (error) {
    console.error("/api/send-message failed", error);
    return NextResponse.json(
      { error: "Unexpected server error in send-message route" },
      { status: 500 },
    );
  }
}
