// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
  // Lightweight PDF text extraction using pdf.js (Deno-compatible build)
  const pdfjs = await import("https://esm.sh/pdfjs-serverless@0.5.0");
  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: true }).promise;
  let text = "";
  const max = Math.min(doc.numPages, 60);
  for (let i = 1; i <= max; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return text;
}

async function extractTextFromDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("https://esm.sh/mammoth@1.8.0?bundle");
  const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
  return result.value || "";
}

const businessModelSchema = {
  name: "extract_business_model_canvas",
  description: "Extract a Business Model Canvas + value pillars + executive summary from a thesis.",
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
    },
    required: ["title", "executive_summary", "value_create", "value_deliver", "value_capture", "canvas"],
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
    // Verify JWT using getClaims (signing-keys compatible)
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
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      console.error("Auth error", claimsErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

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
