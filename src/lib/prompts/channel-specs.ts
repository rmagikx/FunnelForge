/**
 * Channel-specific content specifications.
 * Defines format constraints and best practices per marketing channel.
 */

export interface ChannelSpec {
  label: string;
  description: string;
  awareness: string;
  consideration: string;
  conversion: string;
}

export const CHANNEL_SPECS: Record<string, ChannelSpec> = {
  linkedin: {
    label: "LinkedIn",
    description: "Professional network for B2B and thought-leadership content",
    awareness:
      "Thought-leadership posts (1300 chars max), industry insight carousels, poll-style engagement posts. Professional tone, use relevant hashtags (3-5). Include a strong opening hook.",
    consideration:
      "Case study summaries, comparison posts, detailed how-to content, expert opinion articles. Use data points and proof. LinkedIn articles for longer content.",
    conversion:
      "Direct CTA posts, free trial/demo offers, testimonial quotes, event/webinar invitations. Use urgency without being pushy. Include clear next step.",
  },
  instagram: {
    label: "Instagram",
    description: "Visual-first platform for brand awareness and community",
    awareness:
      "Reels (15-30s), carousel infographics (up to 10 slides), eye-catching static posts. Caption under 2200 chars. Use 20-30 relevant hashtags. Focus on stopping the scroll.",
    consideration:
      "Behind-the-scenes Stories, product/service deep-dive carousels, user-generated content reposts, educational Reels. Use interactive stickers in Stories.",
    conversion:
      "Shoppable posts, limited-time offers in Stories, swipe-up/link-in-bio CTAs, customer transformation posts. Create urgency with countdown stickers.",
  },
  twitter: {
    label: "Twitter / X",
    description: "Real-time conversation and micro-content",
    awareness:
      "Hot takes and opinions (280 chars), thread starters, quote-tweet commentary, memes relevant to industry. Focus on shareability and engagement bait.",
    consideration:
      "Educational threads (5-10 tweets), mini case studies, poll questions, curated resource lists. Use numbered formats for clarity.",
    conversion:
      "Direct offer tweets, limited-availability announcements, social proof (screenshot testimonials), pinned tweet with primary CTA.",
  },
  email: {
    label: "Email",
    description: "Direct-to-inbox nurture sequences and campaigns",
    awareness:
      "Welcome sequence emails, newsletter-style value content, industry roundups. Subject line under 50 chars, preview text under 90 chars. Focus on building trust.",
    consideration:
      "Case study emails, product comparison guides, FAQ-style content, webinar invitations. Personalize with recipient name and segment data.",
    conversion:
      "Limited-time offers, abandoned-cart reminders, free trial nudges, testimonial-driven emails. Single clear CTA button. Create urgency with deadlines.",
  },
  blog: {
    label: "Blog / SEO",
    description: "Long-form content for organic search and thought leadership",
    awareness:
      "Listicles (Top 10...), how-to guides, industry trend analysis. 1500-2500 words, H2/H3 structure, meta description under 160 chars. Target informational keywords.",
    consideration:
      "In-depth comparison posts, ultimate guides, case studies with data, expert interviews. Include internal links, visuals, and downloadable resources.",
    conversion:
      "Product-focused landing page copy, ROI calculators, free tool pages, gated content (ebook, whitepaper). Strong above-the-fold CTA, trust signals.",
  },
  facebook: {
    label: "Facebook",
    description: "Community-driven platform for broad reach",
    awareness:
      "Shareable videos (under 3 min), conversation-starting questions, relatable memes, live video sessions. Optimise for reactions and shares.",
    consideration:
      "Longer-form posts with storytelling, Facebook Group discussions, event pages, polls and surveys. Build community engagement.",
    conversion:
      "Facebook Ads copy (primary text + headline + description), Messenger CTA, limited offers with clear landing page links. Retargeting ad copy.",
  },
  tiktok: {
    label: "TikTok",
    description: "Short-form video for discovery and virality",
    awareness:
      "Trending sound videos (15-60s), POV skits, day-in-the-life, quick tips. Hook viewers in first 2 seconds. Use 3-5 relevant hashtags.",
    consideration:
      "Tutorial/how-to content, myth-busting videos, product demonstrations, before/after transformations. Focus on value and entertainment.",
    conversion:
      "Product showcase with link-in-bio CTA, limited-time offers, unboxing/review style content, user testimonial stitches. Drive traffic to landing page.",
  },
};

/**
 * Build a formatted string describing channel specs for the given channel list.
 * Used inside the content generation prompt.
 */
export function formatChannelSpecs(channels: string[]): string {
  return channels
    .map((ch) => {
      const spec = CHANNEL_SPECS[ch];
      if (!spec) return `### ${ch}\nNo spec available — generate best-effort content.`;
      return `### ${spec.label}
- Awareness: ${spec.awareness}
- Consideration: ${spec.consideration}
- Conversion: ${spec.conversion}`;
    })
    .join("\n\n");
}
