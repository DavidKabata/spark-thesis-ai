// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.104.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  // Use unpdf — a serverless-friendly PDF text extractor (no native deps)
  const { extractText, getDocumentProxy } = await import("https://esm.sh/unpdf@0.12.1");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return typeof text === "string" ? text : (Array.isArray(text) ? text.join("\n") : "");
}

async function extractTextFromDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("https://esm.sh/mammoth@1.8.0?bundle");
  const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
  return result.value || "";
}

const mvpSchema = {
  type: "object",
  description: "A pragmatic MVP plan to validate the venture in 8-12 weeks.",
  properties: {
    name: { type: "string", description: "Catchy MVP / product name (2-5 words)." },
    one_liner: { type: "string", description: "One-sentence pitch (max 25 words)." },
    target_user: { type: "string", description: "The single beachhead user/segment to validate first." },
    core_problem: { type: "string", description: "The specific pain the MVP addresses." },
    core_features: {
      type: "array",
      description: "3-5 must-have features for the first usable version. Cut everything non-essential.",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5,
    },
    out_of_scope: {
      type: "array",
      description: "2-4 things explicitly NOT in the MVP to stay focused.",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    tech_stack: { type: "string", description: "Recommended lightweight tech / tools to ship fast (1-2 sentences)." },
    success_metrics: {
      type: "array",
      description: "2-4 measurable signals that prove the MVP is working.",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    timeline_weeks: { type: "integer", description: "Estimated weeks to ship MVP (4-16)." },
    first_experiment: { type: "string", description: "The first concrete validation experiment to run after launch." },
  },
  required: [
    "name",
    "one_liner",
    "target_user",
    "core_problem",
    "core_features",
    "out_of_scope",
    "tech_stack",
    "success_metrics",
    "timeline_weeks",
    "first_experiment",
  ],
  additionalProperties: false,
};

const businessModelSchema = {
  name: "extract_business_model_canvas",
  description: "Extract a Business Model Canvas + value pillars + executive summary + MVP plan from a thesis.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Inferred thesis or venture title (3-12 words)." },
      executive_summary: {
        type: "string",
        description: "2-3 sentence summary of the commercial opportunity in the research.",
      },
      value_create: {
        type: "string",
        description: "How value is CREATED — the core innovation, IP, or insight from the research that solves a real problem.",
      },
      value_deliver: {
        type: "string",
        description: "How value is DELIVERED — channels, partners, and the path to customers.",
      },
      value_capture: {
        type: "string",
        description: "How value is CAPTURED — revenue model, pricing, monetization.",
      },
      canvas: {
        type: "object",
        properties: {
          customer_segments: { type: "string" },
          value_propositions: { type: "string" },
          channels: { type: "string" },
          customer_relationships: { type: "string" },
          revenue_streams: { type: "string" },
          key_resources: { type: "string" },
          key_activities: { type: "string" },
          key_partnerships: { type: "string" },
          cost_structure: { type: "string" },
        },
        required: [
          "customer_segments",
          "value_propositions",
          "channels",
          "customer_relationships",
          "revenue_streams",
          "key_resources",
          "key_activities",
          "key_partnerships",
          "cost_structure",
        ],
        additionalProperties: false,
      },
      mvp: mvpSchema,
    },
    required: ["title", "executive_summary", "value_create", "value_deliver", "value_capture", "canvas", "mvp"],
    additionalProperties: false,
  },
};

const leanCanvasSchema = {
  name: "extract_lean_canvas",
  description: "Extract a Lean Canvas + value pillars + executive summary from a thesis.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      executive_summary: { type: "string" },
      value_create: { type: "string" },
      value_deliver: { type: "string" },
      value_capture: { type: "string" },
      canvas: {
        type: "object",
        properties: {
          problem: { type: "string" },
          customer_segments: { type: "string" },
          unique_value_proposition: { type: "string" },
          solution: { type: "string" },
          channels: { type: "string" },
          revenue_streams: { type: "string" },
          cost_structure: { type: "string" },
          key_metrics: { type: "string" },
          unfair_advantage: { type: "string" },
        },
        required: [
          "problem",
          "customer_segments",
          "unique_value_proposition",
          "solution",
          "channels",
          "revenue_streams",
          "cost_structure",
          "key_metrics",
          "unfair_advantage",
        ],
        additionalProperties: false,
      },
    },
    required: ["title", "executive_summary", "value_create", "value_deliver", "value_capture", "canvas"],
    additionalProperties: false,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      console.error("Auth error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { file_path, canvas_type, abstract_text } = body || {};
    if (!["business_model", "lean"].includes(canvas_type)) {
      return new Response(JSON.stringify({ error: "Invalid canvas type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!file_path && !abstract_text) {
      return new Response(JSON.stringify({ error: "Provide a file_path or abstract_text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let text = "";

    if (abstract_text) {
      if (typeof abstract_text !== "string" || abstract_text.length < 200) {
        return new Response(
          JSON.stringify({ error: "Abstract is too short — please provide at least 200 characters." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (abstract_text.length > 30000) {
        return new Response(
          JSON.stringify({ error: "Abstract is too long — keep it under 30,000 characters." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      text = abstract_text;
    } else {
      // Ensure file belongs to this user (path starts with userId/)
      if (!file_path.startsWith(`${userId}/`)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: fileData, error: dlErr } = await adminClient.storage
        .from("theses")
        .download(file_path);
      if (dlErr || !fileData) {
        console.error("Download error", dlErr);
        return new Response(JSON.stringify({ error: "Could not download file" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bytes = new Uint8Array(await fileData.arrayBuffer());
      const lower = file_path.toLowerCase();
      try {
        if (lower.endsWith(".pdf")) {
          text = await extractTextFromPdf(bytes);
        } else if (lower.endsWith(".docx")) {
          text = await extractTextFromDocx(bytes);
        } else {
          return new Response(JSON.stringify({ error: "Only PDF or DOCX supported" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error("Extract error", e);
        return new Response(
          JSON.stringify({ error: "Failed to extract text from document" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    text = text.replace(/\s+/g, " ").trim();
    if (text.length < 200) {
      return new Response(
        JSON.stringify({ error: "Document text too short to analyze" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // Cap input to keep the request fast & affordable
    const MAX_CHARS = 24000;
    const excerpt = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

    const schema = canvas_type === "lean" ? leanCanvasSchema : businessModelSchema;
    const systemPrompt = `You are a research commercialization analyst. Read the provided thesis excerpt and extract a ${
      canvas_type === "lean" ? "Lean Canvas" : "Business Model Canvas"
    } that turns the research into a viable venture. Be concrete, actionable, and grounded in the research. Each canvas field should be 1-3 short sentences. Focus on Africa's innovation ecosystem context where relevant, but stay globally applicable.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Thesis excerpt:\n\n${excerpt}` },
        ],
        tools: [{ type: "function", function: schema }],
        tool_choice: { type: "function", function: { name: schema.name } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response", JSON.stringify(aiJson).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI did not return structured output" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);

    // Save to analyses (admin client to bypass RLS — we already verified the user)
    const insertClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: inserted, error: insertErr } = await insertClient
      .from("analyses")
      .insert({
        user_id: userId,
        title: parsed.title,
        canvas_type,
        file_path: file_path ?? null,
        executive_summary: parsed.executive_summary,
        value_create: parsed.value_create,
        value_deliver: parsed.value_deliver,
        value_capture: parsed.value_capture,
        canvas_data: parsed.canvas,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error", insertErr);
      return new Response(JSON.stringify({ error: "Could not save analysis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
