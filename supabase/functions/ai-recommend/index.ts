import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Build user context
    const { data: profile } = await supabase
      .from("profiles")
      .select("name,nickname,bio,interests,location,mbti")
      .eq("id", userId)
      .maybeSingle();

    const { data: myMem } = await supabase
      .from("memberships")
      .select("group_id")
      .eq("user_id", userId);
    const joinedIds = new Set((myMem ?? []).map((m: any) => m.group_id));

    const { data: groups } = await supabase
      .from("groups")
      .select("id,name,category,location,description,tags")
      .eq("status", "active")
      .limit(80);

    const candidates = (groups ?? [])
      .filter((g: any) => !joinedIds.has(g.id))
      .slice(0, 30)
      .map((g: any) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        location: g.location,
        description: (g.description ?? "").slice(0, 120),
        tags: g.tags ?? [],
      }));

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt =
      "당신은 한국 동호회 매칭 추천 엔진입니다. 사용자의 관심사·지역·성향(MBTI/소개)을 보고 가장 잘 맞는 모임 5개를 골라 한 줄짜리 한국어 추천 사유를 만들어 주세요.";

    const userPayload = {
      profile: {
        nickname: profile?.nickname ?? profile?.name ?? "",
        bio: profile?.bio ?? "",
        interests: profile?.interests ?? [],
        location: profile?.location ?? "",
        mbti: profile?.mbti ?? "",
      },
      candidates,
    };

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(userPayload) },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "recommend_groups",
                description: "Pick top 5 best-fit groups with reasons.",
                parameters: {
                  type: "object",
                  properties: {
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          reason: { type: "string" },
                          score: { type: "number" },
                        },
                        required: ["id", "reason", "score"],
                      },
                    },
                  },
                  required: ["recommendations"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "recommend_groups" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments)
      : { recommendations: [] };

    const byId = new Map(candidates.map((c: any) => [c.id, c]));
    const enriched = (args.recommendations ?? [])
      .map((r: any) => ({
        ...r,
        group: byId.get(r.id) ?? null,
      }))
      .filter((r: any) => r.group);

    return new Response(JSON.stringify({ recommendations: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-recommend error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});