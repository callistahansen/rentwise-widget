// Supabase Edge Function: import-listing
// Deploy with: supabase functions deploy import-listing
// Requires ANTHROPIC_API_KEY secret set in Supabase dashboard

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "No URL provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Fetch page content via Jina Reader
    console.log(`Fetching listing: ${url}`);
    const jinaUrl = `https://r.jina.ai/${url}`;
    const jinaRes = await fetch(jinaUrl, {
      headers: {
        Accept: "text/markdown",
        "X-Return-Format": "markdown",
      },
    });

    if (!jinaRes.ok) {
      throw new Error(`Failed to fetch listing page (${jinaRes.status})`);
    }

    const markdown = await jinaRes.text();

    if (!markdown || markdown.length < 100) {
      throw new Error("Could not read the listing page. The site may be blocking access.");
    }

    // Truncate if too long (Claude has token limits, and we want speed)
    const truncated = markdown.length > 30000 ? markdown.substring(0, 30000) : markdown;

    // Step 2: Parse with Claude
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured. Add it in Supabase Edge Function Secrets.");
    }

    console.log(`Parsing with Claude (${truncated.length} chars)...`);
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Extract apartment listing data from this page content. Return ONLY valid JSON, no other text.

The JSON must have this exact structure:
{
  "building": {
    "name": "Building Name",
    "address": "Full street address, City, State ZIP",
    "neighborhood": "Neighborhood name or area",
    "leaseTerms": "e.g. 6 - 24 months",
    "special": "Any current specials or promotions (null if none)",
    "fees": {
      "internet": monthly internet cost as number or null,
      "parking": monthly parking cost as number or null,
      "parkingGarage": monthly garage parking cost as number or null,
      "parkingSurface": monthly surface parking cost as number or null,
      "petRent": monthly pet rent as number or null,
      "petDeposit": one-time pet deposit as number or null,
      "storage": monthly storage cost as number or null,
      "applicationFee": application fee as number or null,
      "adminFee": admin fee as number or null,
      "securityDeposit": security deposit as number or null
    },
    "utilitiesIncluded": ["list of included utilities like Gas, Water, Trash Removal, etc."]
  },
  "units": [
    {
      "unit": "unit number or identifier",
      "plan": "floor plan name or null",
      "beds": "Studio" or "1 Bed" or "2 Bed" etc.,
      "baths": "1" or "1.5" or "2" etc.,
      "sqft": square footage as number,
      "rent": monthly rent as number,
      "available": "availability date like Now, Feb 1, Mar 15, etc."
    }
  ]
}

Rules:
- Extract ALL available units listed on the page
- For rent, use the exact number (not a range). If a range is shown for a unit, use the lower number.
- For fees, extract the numeric value. If a range like "$125 - $250", include both as parkingSurface and parkingGarage or keep the range as a string.
- beds should be "Studio", "1 Bed", "2 Bed", "3 Bed" etc.
- If data is not available, use null
- Return ONLY the JSON object, no explanation

Page content:
${truncated}`,
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude API error:", errText);
      throw new Error(`AI parsing failed (${claudeRes.status})`);
    }

    const claudeData = await claudeRes.json();
    const responseText = claudeData.content?.[0]?.text || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Parse the JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse Claude response as JSON:", jsonStr.substring(0, 500));
      throw new Error("AI could not parse this listing. Try a different listing URL.");
    }

    // Validate structure
    if (!parsed.building || !parsed.units || !Array.isArray(parsed.units)) {
      throw new Error("AI returned unexpected data structure. Try a different listing URL.");
    }

    console.log(`Successfully parsed: ${parsed.building.name}, ${parsed.units.length} units`);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
