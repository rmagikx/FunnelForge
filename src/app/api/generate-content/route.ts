import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContent } from "@/lib/anthropic";
import { checkRateLimit } from "@/lib/rate-limit";
import type { BrandPersona, GeneratedPlan } from "@/lib/types";

const VALID_CHANNELS = [
  "linkedin",
  "instagram",
  "twitter",
  "email",
  "blog",
  "facebook",
  "tiktok",
];
const VALID_STAGES = ["awareness", "consideration", "conversion"];
const MAX_PROBLEM_LENGTH = 5000;
const MAX_CHANNELS = 7;
const RATE_LIMIT = 10; // per hour

/**
 * POST /api/generate-content
 *
 * Body: {
 *   personaId: string,
 *   problemStatement: string,
 *   channels: string[]
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit: 10 generations per user per hour ──
    const { allowed, remaining, resetAt } = checkRateLimit(
      user.id,
      RATE_LIMIT
    );
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You can generate ${RATE_LIMIT} times per hour. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(RATE_LIMIT),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // ── Parse & validate input ──
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { personaId, problemStatement, channels, stage } = body as {
      personaId?: string;
      problemStatement?: string;
      channels?: string[];
      stage?: string;
    };

    if (!personaId || typeof personaId !== "string") {
      return NextResponse.json(
        { error: "personaId is required and must be a string" },
        { status: 400 }
      );
    }

    // UUID format check
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(personaId)) {
      return NextResponse.json(
        { error: "Invalid personaId format" },
        { status: 400 }
      );
    }

    if (
      !problemStatement ||
      typeof problemStatement !== "string" ||
      !problemStatement.trim()
    ) {
      return NextResponse.json(
        { error: "problemStatement is required" },
        { status: 400 }
      );
    }

    if (problemStatement.length > MAX_PROBLEM_LENGTH) {
      return NextResponse.json(
        {
          error: `problemStatement must be under ${MAX_PROBLEM_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { error: "channels must be a non-empty array" },
        { status: 400 }
      );
    }

    if (channels.length > MAX_CHANNELS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_CHANNELS} channels allowed` },
        { status: 400 }
      );
    }

    const invalidChannels = channels.filter(
      (ch) => typeof ch !== "string" || !VALID_CHANNELS.includes(ch)
    );
    if (invalidChannels.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid channels: ${invalidChannels.join(", ")}. Valid: ${VALID_CHANNELS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!stage || typeof stage !== "string" || !VALID_STAGES.includes(stage)) {
      return NextResponse.json(
        {
          error: `stage is required and must be one of: ${VALID_STAGES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ── Fetch persona (RLS ensures ownership) ──
    const { data: persona, error: fetchError } = await supabase
      .from("personas")
      .select("*")
      .eq("id", personaId)
      .single();

    if (fetchError || !persona) {
      return NextResponse.json(
        { error: "Persona not found" },
        { status: 404 }
      );
    }

    const personaData = persona.persona_data as Record<string, unknown> | null;
    if (!personaData || !("name" in personaData)) {
      return NextResponse.json(
        {
          error:
            "Persona has not been analyzed yet. Please analyze it first.",
        },
        { status: 400 }
      );
    }

    // ── Generate content via Claude ──
    const brandPersona = personaData as unknown as BrandPersona;
    const plan: GeneratedPlan = await generateContent(
      brandPersona,
      problemStatement.trim(),
      channels,
      stage
    );

    // ── Save to generations table ──
    const { data: generation, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        persona_id: personaId,
        problem_statement: problemStatement.trim(),
        channels,
        generated_content: plan as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json(
      { generation },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (error) {
    console.error("Generate content error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate content",
      },
      { status: 500 }
    );
  }
}
