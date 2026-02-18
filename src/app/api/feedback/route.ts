import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/feedback
 * Save user feedback with text and star rating.
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

    const body = await request.json();
    const { feedbackText, stars } = body as {
      feedbackText: string;
      stars: number;
    };

    // Validate feedback text
    if (!feedbackText?.trim()) {
      return NextResponse.json(
        { error: "Feedback text is required" },
        { status: 400 }
      );
    }

    // Validate stars
    if (!stars || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 stars" },
        { status: 400 }
      );
    }

    // Derive user name from metadata or email
    const userName =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Anonymous";

    const { data, error } = await supabase
      .from("funnel_feedback")
      .insert({
        user_id: user.id,
        user_name: userName,
        feedback_text: feedbackText.trim(),
        stars,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ feedback: data }, { status: 201 });
  } catch (error) {
    console.error("Save feedback error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save feedback",
      },
      { status: 500 }
    );
  }
}
