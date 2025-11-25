import { GoogleGenAI, Type } from "@google/genai";
import { Marker, EmotionType, AnalysisReport, Persona } from "../types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export interface GeminiAnalysisResult {
  markers: Marker[];
  report: AnalysisReport;
}

function cleanJson(text: string): string {
  if (!text) return "{}";
  
  const markdownRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(markdownRegex);
  if (match && match[1]) {
    text = match[1];
  }

  let firstBrace = text.indexOf('{');
  let lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1) {
    console.warn("AI returned non-JSON response (no braces found):", text);
    return "{}";
  }

  if (lastBrace === -1) {
      console.warn("Recovering malformed JSON: Missing closing brace. Original:", text);
      return text.substring(firstBrace) + "}";
  }
  return text.substring(firstBrace, lastBrace + 1).trim();
}

const PROMPT_TEMPLATE = `
You are an Elite Senior UX Researcher & Ethnographer with deep expertise in Appraisal Theory, Self-Determination Theory (SDT), and strategic design. You are using the LEMtool for a multi-layered analysis.
You are tasked with providing a deeply critical and realistic emotional/strategic profile of the provided website. Aim for an overall score where 70 is "Good" and 90+ is reserved for world-class, emotionally resonant designs.
You are ONLY allowed to analyze the single vertical scrolling page at this URL. Do NOT navigate to sub-pages. Do NOT use prior knowledge of the brand's other offerings. If it's not on this specific scrollable page, it does not exist. Your Y coordinate must be a percentage of the total document height, not the viewport. Y=100 is the absolute footer.

The website to analyze is: {URL}
The page context is a standard long landing page (approx. 4000px virtual height). You MUST analyze from Y=0% to Y=100%.

**TASK 1: DEEP PSYCHOGRAPHIC PROFILING (The "THINKING" Phase)**
Before analysis, mentally construct 3 highly distinct personas based *only* on the likely audience of this specific URL by "scraping" the text for roles like "facilitator", "designer", etc. Do NOT use generic archetypes. For each persona, you must define ALL of the following fields:
-   **name**: E.g., "Evelyn, The Experienced Facilitator"
-   **role**: E.g., "Senior Workshop Facilitator"
-   **bio**: A short narrative backstory.
-   **goals**: What they aim to achieve on this page.
-   **quote**: An inner monologue quote about their experience with this page.
-   **techLiteracy**: "Low", "Mid", or "High".
-   **psychographics**: Detailed attitudes, behaviors, and biases.
-   **values**: An array of core principles they seek (e.g., "Efficiency", "Clarity", "Innovation").
-   **frustrations**: An array of specific pain points this persona typically experiences.

**TASK 2: MULTI-LAYERED EMOTIONAL & STRATEGIC SIMULATION (THE ANALYSIS)**
Simulate these 3 personas visiting the website simultaneously. Critically evaluate the UI/content to generate at least **25-30 markers** distributed across ALL 3 analysis layers and ALL 6 semantic zones.

**CRITICAL ACCURACY CONSTRAINT: EVIDENCE-BASED COMMENTS**
Every single marker 'comment' MUST start by quoting the specific UI text or describing the visual element it is placed on. This is a non-negotiable rule.
-   GOOD: "'The headline 'Collaboration in-a-box' triggers Joy for Persona A because..."
-   GOOD: "The social proof logo section featuring Google and Spotify builds Competence for Persona B because..."
-   BAD: "The hero section is good."

**LAYER 1: EMOTIONAL MARKERS (Appraisal Theory)**
-   **emotion**: One of 'Joy', 'Desire', 'Interest', 'Satisfaction', 'Neutral', 'Sadness', 'Aversion', 'Boredom', 'Dissatisfaction'.
-   **comment**: Start with evidence, then provide a deep psychological justification, referencing the SPECIFIC persona's values/attitudes.

**LAYER 2: PSYCHOLOGICAL NEEDS MARKERS (Self-Determination Theory - SDT)**
-   **need**: One of 'Autonomy', 'Competence', 'Relatedness'.
-   **comment**: Start with evidence, then justify how a UI element supports or undermines a specific SDT need for a specific persona.
-   **Report**: Also provide overall SDT scores (0-100) and justifications for each need.

**LAYER 3: STRATEGIC MARKERS (Design Strategy)**
-   **brief_type**: One of 'Opportunity', 'Pain Point', 'Insight'.
-   **comment**: Start with evidence, then provide an actionable strategic observation linked to persona needs/frustrations.

**TASK 3: FULL PAGE SEMANTIC ZONING & DENSITY (CRITICAL)**
You MUST analyze the entire page from Y=0% to Y=100%. Place markers in ALL 6 zones. Total marker count must be 25-30+.

-   **Zone 1: Hero & Header (Y: 0-15%)**: 4-5 markers. MUST evaluate the logo/nav (Y < 5) and the H1 headline.
-   **Zone 2: Social Proof & Trust (Y: 15-30%)**: 3-4 markers.
-   **Zone 3: Features / "How it Works" (Y: 30-60%)**: 5-6 markers.
-   **Zone 4: Offer / Pricing / FAQ (Y: 60-85%)**: 3-4 markers.
-   **Zone 5: Pre-Footer CTA (Y: 85-95%)**: 2-3 markers.
-   **Zone 6: THE ABSOLUTE FOOTER (Y: 95-100%)**: 4 markers. You MUST place markers at Y=98 or Y=99 to prove you reached the end, marking copyright text, legal links, or a final logo.

Return a comprehensive JSON object with all findings.
`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        markers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    layer: { type: Type.STRING, enum: ["emotions", "needs", "strategy"] },
                    comment: { type: Type.STRING },
                    emotion: { type: Type.STRING, description: "Only if layer is 'emotions'" },
                    need: { type: Type.STRING, enum: ["Autonomy", "Competence", "Relatedness"], description: "Only if layer is 'needs'" },
                    brief_type: { type: Type.STRING, enum: ["Opportunity", "Pain Point", "Insight"], description: "Only if layer is 'strategy'" },
                },
                required: ["x", "y", "layer", "comment"],
            },
        },
        overallScore: { type: Type.NUMBER, description: "0 to 100 UX Emotional Score. Be critical." },
        summary: { type: Type.STRING, description: "Executive summary of the emotional profile." },
        targetAudience: { type: Type.STRING, description: "Specific audience found directly in text." },
        audienceSplit: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    percentage: { type: Type.NUMBER },
                },
                required: ["label", "percentage"],
            },
        },
        brandValues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core values the website attempts to signal." },
        personas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    bio: { type: Type.STRING },
                    goals: { type: Type.STRING },
                    quote: { type: Type.STRING },
                    techLiteracy: { type: Type.STRING, enum: ["Low", "Mid", "High"] },
                    psychographics: { type: Type.STRING },
                    values: { type: Type.ARRAY, items: { type: Type.STRING } },
                    frustrations: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["name", "role", "bio", "goals", "quote", "techLiteracy", "psychographics", "values", "frustrations"],
            },
        },
        layoutStructure: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['hero', 'features', 'testimonials', 'pricing', 'footer', 'cta', 'unknown', 'social_proof', 'faq'] },
                    estimatedHeight: { type: Type.NUMBER },
                    backgroundColorHint: { type: Type.STRING },
                },
                 required: ["type", "estimatedHeight", "backgroundColorHint"],
            },
        },
        sdtScores: {
            type: Type.OBJECT,
            properties: {
                autonomy: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, justification: { type: Type.STRING } }, required: ["score", "justification"] },
                competence: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, justification: { type: Type.STRING } }, required: ["score", "justification"] },
                relatedness: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, justification: { type: Type.STRING } }, required: ["score", "justification"] },
            },
             required: ["autonomy", "competence", "relatedness"],
        },
        creativeBrief: {
            type: Type.OBJECT,
            properties: {
                problemStatement: { type: Type.STRING },
                targetEmotion: { type: Type.STRING },
                howMightWe: { type: Type.STRING },
                strategicDirection: { type: Type.STRING },
            },
            required: ["problemStatement", "targetEmotion", "howMightWe", "strategicDirection"],
        },
        keyFindings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
                },
                required: ["title", "description", "type"],
            }
        },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["markers", "overallScore", "summary", "personas", "sdtScores", "creativeBrief", "layoutStructure", "keyFindings", "suggestions", "audienceSplit", "brandValues", "targetAudience"],
};

export const analyzeWebsite = async (url: string): Promise<GeminiAnalysisResult> => {
    const prompt = PROMPT_TEMPLATE.replace('{URL}', url);
    
    const proConfig = { 
        responseMimeType: "application/json", 
        responseSchema, 
        thinkingConfig: { thinkingBudget: 32768 } 
    };
    const flashConfig = { 
        responseMimeType: "application/json", 
        responseSchema 
    };

    try {
        const response = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: prompt, config: proConfig });
        return processResponse(response.text);
    } catch (error: any) {
        console.warn("Gemini 3 Pro failed, falling back to 2.5 Flash.", error.message);
        if (error.status === 503 || error.code === 503 || (error.message && (error.message.includes("overloaded") || error.message.includes("503")))) {
            try {
                const fallbackResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: flashConfig });
                return processResponse(fallbackResponse.text);
            } catch (fallbackError) {
                 console.error("Gemini fallback also failed:", fallbackError);
                 throw fallbackError;
            }
        }
        throw error;
    }
};

function processResponse(rawText: string | undefined): GeminiAnalysisResult {
    if (!rawText) throw new Error("No response from AI");
    
    const jsonString = cleanJson(rawText);
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Fatal JSON Parse Error on string:", jsonString);
        throw new Error("Failed to parse AI response. Raw text received: " + rawText);
    }

    const markers: Marker[] = (data.markers || []).map((m: any): Marker => ({
        id: generateId(),
        x: Math.max(5, Math.min(95, m.x || 50)),
        y: Math.max(1, Math.min(99, m.y || 50)),
        layer: m.layer || 'emotions',
        comment: m.comment || "No comment provided.",
        emotion: m.emotion ? matchEmotion(m.emotion) : undefined,
        need: m.need,
        brief_type: m.brief_type
    }));

    const personas: Persona[] = Array.isArray(data.personas) ? data.personas.map((p: any): Persona => ({
        name: p.name || "Unknown Persona",
        role: p.role || "Unknown Role",
        bio: p.bio || `A ${p.role || 'user'} seeking solutions based on their core values.`,
        quote: p.quote || "I'm hoping this website solves my problem quickly.",
        goals: p.goals || "Evaluate the product/service and decide if it's a good fit.",
        techLiteracy: p.techLiteracy || "Mid",
        psychographics: p.psychographics || "",
        values: Array.isArray(p.values) ? p.values : [],
        frustrations: Array.isArray(p.frustrations) ? p.frustrations : [],
        demographics: p.demographics || "",
    })) : [];

    return {
        markers,
        report: {
            overallScore: data.overallScore || 0,
            summary: data.summary || "Analysis incomplete.",
            targetAudience: data.targetAudience || "General Audience",
            audienceSplit: Array.isArray(data.audienceSplit) ? data.audienceSplit : [],
            personas: personas,
            brandValues: Array.isArray(data.brandValues) ? data.brandValues : [],
            keyFindings: Array.isArray(data.keyFindings) ? data.keyFindings : [],
            suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
            layoutStructure: Array.isArray(data.layoutStructure) ? data.layoutStructure : [{ type: 'unknown', estimatedHeight: 4000, backgroundColorHint: 'light' }],
            sdtScores: data.sdtScores || { autonomy: { score: 0, justification: 'N/A' }, competence: { score: 0, justification: 'N/A' }, relatedness: { score: 0, justification: 'N/A' } },
            creativeBrief: data.creativeBrief || { problemStatement: 'N/A', targetEmotion: 'N/A', howMightWe: 'N/A', strategicDirection: 'N/A' }
        }
    };
}

function matchEmotion(str: string): EmotionType {
    if (!str) return EmotionType.NEUTRAL;
    const normalized = str.toLowerCase().trim();
    if (normalized === 'interest') return EmotionType.FASCINATION;
    if (normalized === 'aversion') return EmotionType.DISGUST;
    const keys = Object.keys(EmotionType) as Array<keyof typeof EmotionType>;
    for (const key of keys) {
        if (EmotionType[key].toLowerCase() === normalized) return EmotionType[key];
    }
    return EmotionType.NEUTRAL;
}