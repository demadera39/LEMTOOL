import { GoogleGenAI } from "@google/genai";
import { Marker, EmotionType, AnalysisReport, Persona } from "../types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export interface GeminiAnalysisResult {
  markers: Marker[];
  report: AnalysisReport;
}

// Helper to fetch a screenshot as base64
// Note: In production, this should be your own proxy to avoid rate limits/CORS issues.
// We are using a public placeholder service for demonstration.
async function getWebsiteScreenshotBase64(url: string): Promise<string | null> {
    try {
        // Use a reliable public screenshot API for the demo.
        // thum.io allows direct image access. 
        // UPDATED: Used 'fullpage' instead of crop to capture entire scroll.
        // UPDATED: Added 'wait/5' to allow lazy loading/animations to finish.
        const screenshotServiceUrl = `https://image.thum.io/get/width/1200/fullpage/wait/5/noanimate/${url}`;
        
        const response = await fetch(screenshotServiceUrl);
        if (!response.ok) throw new Error('Screenshot fetch failed');
        
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Remove the data URL prefix (e.g., "data:image/png;base64,")
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Screenshot capture failed, falling back to text-only analysis:", e);
        return null;
    }
}

// SLICE & CONQUER: Helper to slice a tall screenshot into screen-sized chunks
async function sliceImageBase64(base64Full: string): Promise<{ slices: string[], sliceHeights: number[], totalHeight: number, totalWidth: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject("No canvas ctx"); return; }

            const totalWidth = img.width;
            const totalHeight = img.height;
            
            // We use a 16:9 aspect ratio slice height to match standard screens
            // This ensures Gemini sees "familiar" viewports
            const sliceHeight = Math.floor(totalWidth * (9/16));
            
            const slices: string[] = [];
            const sliceHeights: number[] = [];
            const numSlices = Math.ceil(totalHeight / sliceHeight);

            canvas.width = totalWidth;

            for (let i = 0; i < numSlices; i++) {
                const sourceY = i * sliceHeight;
                // The last slice might be shorter
                const currentSliceHeight = Math.min(sliceHeight, totalHeight - sourceY);
                
                // Resize canvas to fit this specific slice exactly
                canvas.height = currentSliceHeight;
                ctx.clearRect(0, 0, totalWidth, currentSliceHeight);
                
                ctx.drawImage(img, 0, sourceY, totalWidth, currentSliceHeight, 0, 0, totalWidth, currentSliceHeight);
                
                const data = canvas.toDataURL('image/png').split(',')[1];
                slices.push(data);
                sliceHeights.push(currentSliceHeight);
            }
            resolve({ slices, sliceHeights, totalHeight, totalWidth });
        };
        img.onerror = reject;
        img.src = `data:image/png;base64,${base64Full}`;
    });
}

function cleanJson(text: string): string {
  if (!text) return "{}";
  
  // Remove Markdown code blocks
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(markdownRegex);
  if (match && match[1]) {
    text = match[1];
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    console.warn("AI returned non-JSON response (no braces found):", text);
    return "{}";
  }

  return text.substring(firstBrace, lastBrace + 1).trim();
}

const TEXT_ONLY_PROMPT = `
You are an Elite Senior UX Researcher & Ethnographer using the LEMtool.
Target URL: {URL}

**STEP 1: LIVE FORENSIC INVESTIGATION (MANDATORY)**
You MUST use the 'googleSearch' tool to visit {URL} and read its *current* live text, structure, and value propositions.
- **DO NOT** rely on your internal training data. TRUST THE SEARCH RESULTS.
- **VERIFY** that every piece of text you plan to quote actually exists in the search snippets.

**STEP 2: DEEP ANALYSIS**
Analyze the content for emotional triggers, psychological needs (SDT), and strategic opportunities.

**STEP 3: HIGH DENSITY OUTPUT**
Generate a JSON object with a deep psychographic profile and **at least 60 precise markers**.
- ~20 Markers for 'emotions'
- ~20 Markers for 'needs'
- ~20 Markers for 'strategy'

**OUTPUT JSON STRUCTURE**
Return ONLY a valid JSON object wrapped in \`\`\`json \`\`\`.
{
  "markers": [
    {
      "x": number (0-100, horizontal),
      "y": number (0-100, vertical),
      "layer": "emotions" | "needs" | "strategy",
      "comment": "Start with: 'The element [Name/Text]...' then explain.",
      "emotion": "Joy" | "Desire" | "Interest" | "Satisfaction" | "Neutral" | "Sadness" | "Aversion" | "Boredom" | "Dissatisfaction",
      "need": "Autonomy" | "Competence" | "Relatedness",
      "brief_type": "Opportunity" | "Pain Point" | "Insight"
    }
  ],
  "overallScore": number (0-100),
  "summary": string (Rich text paragraph, no bullets),
  "targetAudience": string,
  "audienceSplit": [{ "label": string, "percentage": number }],
  "brandValues": [string],
  "personas": [
    { "name": string, "role": string, "bio": string, "goals": string, "quote": string, "techLiteracy": "Low"|"Mid"|"High", "psychographics": string, "values": [string], "frustrations": [string] }
  ],
  "layoutStructure": [
    { "type": "hero"|"features"|"testimonials"|"pricing"|"footer"|"cta"|"unknown"|"social_proof"|"faq", "estimatedHeight": number, "backgroundColorHint": "light"|"dark"|"colorful" }
  ],
  "sdtScores": { "autonomy": { "score": number, "justification": string }, "competence": { "score": number, "justification": string }, "relatedness": { "score": number, "justification": string } },
  "creativeBrief": { 
     "problemStatement": string, 
     "targetEmotion": string, 
     "howMightWe": string, 
     "strategicDirection": string,
     "actionableSteps": [string],
     "benchmarks": [{ "name": string, "reason": string }]
  },
  "keyFindings": [{ "title": string, "description": string, "type": "positive"|"negative"|"neutral" }],
  "suggestions": [string]
}
`;

const MULTIMODAL_PROMPT = `
You are an Elite Senior UX Researcher analyzing the **HERO SECTION / TOP PART** of a website.
Target URL: {URL}

**TASK**: 
1. Analyze this screenshot viewport for Emotional Markers, SDT Needs, and Strategic Insights.
2. Generate the **MASTER STRATEGIC REPORT** based on this primary visual context.

**CRITICAL REQUIREMENT 1: PERSONAS**
- You **MUST** generate **4 to 5 DISTINCT PERSONAS**.
- Do not just generate 1 or 2. We need a full spectrum of users (e.g., The Skeptic, The Power User, The Novice, The Decision Maker).

**CRITICAL REQUIREMENT 2: APPRAISAL THEORY BRIEF**
- The "creativeBrief" must use **Appraisal Theory Statements** to guide improvements.
- For each "actionableStep", structure it as ONE of these three types:
  1. **Goal-Based**: "GOAL: [User wants X]. FIX: [UI Change]. RESULT: Evokes [Emotion]."
  2. **Attitude-Based**: "ATTITUDE: [User thinks X]. FIX: [UI Change]. RESULT: Evokes [Emotion]."
  3. **Norm-Based**: "NORM: [User believes X]. FIX: [UI Change]. RESULT: Evokes [Emotion]."
- Provide 3-5 specific steps in this format.
- Also include "benchmarks" of real world examples.

**CRITICAL REQUIREMENT 3: PRECISION & PLACEMENT**
- **Center of Mass**: Coordinates (x,y) must range from 0-100.
  - x=0 is Left, x=100 is Right.
  - y=0 is Top, y=100 is Bottom.
- **Visual Mapping**: Place the marker at the **exact visual center** of the UI element (button, headline, image face) you are discussing.
- **DO NOT** place markers on empty whitespace or margins.
- **DO NOT** cluster markers. If you have 3 insights about one section, pick 3 distinct visual anchors within that section.

**OUTPUT JSON STRUCTURE**
Return ONLY a valid JSON object wrapped in \`\`\`json \`\`\`.
{
  "markers": [
    {
      "x": number (0-100),
      "y": number (0-100),
      "layer": "emotions" | "needs" | "strategy",
      "comment": "Start with: 'The element [Name/Text]...' then explain.",
      "emotion": "Joy" | "Desire" | "Interest" | "Satisfaction" | "Neutral" | "Sadness" | "Aversion" | "Boredom" | "Dissatisfaction",
      "need": "Autonomy" | "Competence" | "Relatedness",
      "brief_type": "Opportunity" | "Pain Point" | "Insight"
    }
  ],
  "overallScore": number (0-100),
  "summary": string,
  "targetAudience": string,
  "audienceSplit": [{ "label": string, "percentage": number }],
  "brandValues": [string],
  "personas": [
    { "name": string, "role": string, "bio": string, "goals": string, "quote": string, "techLiteracy": "Low"|"Mid"|"High", "psychographics": string, "values": [string], "frustrations": [string] }
  ],
  "layoutStructure": [
    { "type": "hero"|"features"|"testimonials"|"pricing"|"footer"|"cta"|"unknown"|"social_proof"|"faq", "estimatedHeight": number, "backgroundColorHint": "light"|"dark"|"colorful" }
  ],
  "sdtScores": { "autonomy": { "score": number, "justification": string }, "competence": { "score": number, "justification": string }, "relatedness": { "score": number, "justification": string } },
  "creativeBrief": { 
     "problemStatement": string, 
     "targetEmotion": string, 
     "howMightWe": string, 
     "strategicDirection": string,
     "actionableSteps": [string],
     "benchmarks": [{ "name": string, "reason": string }]
  },
  "keyFindings": [{ "title": string, "description": string, "type": "positive"|"negative"|"neutral" }],
  "suggestions": [string]
}
`;

const MARKER_ONLY_PROMPT = `
You are analyzing a **LOWER SCROLL SECTION (BODY/FOOTER)** of a website.
Target URL: {URL}

**TASK**:
Identify specific UX/UI elements in this slice that trigger emotions, fulfill psychological needs, or represent strategic opportunities.

**CRITICAL COORDINATE INSTRUCTIONS**:
- The provided image is a **SLICE** of a larger page.
- **x=0, y=0** is the TOP-LEFT of *this specific image*.
- **x=100, y=100** is the BOTTOM-RIGHT of *this specific image*.
- You **MUST** pinpoint the exact element. 
- Example: If discussing a "Pricing Card" on the left, x should be ~25. If discussing a "Contact Button" on the right, x should be ~85.
- **AVOID** placing markers at exactly 50,50 or 0,0. Be precise.

**OUTPUT JSON STRUCTURE**
Return ONLY a valid JSON object wrapped in \`\`\`json \`\`\`.
{
  "markers": [
    {
      "x": number (0-100),
      "y": number (0-100),
      "layer": "emotions" | "needs" | "strategy",
      "comment": "Start with: 'The element [Name/Text]...' then explain.",
      "emotion": "Joy" | "Desire" | "Interest" | "Satisfaction" | "Neutral" | "Sadness" | "Aversion" | "Boredom" | "Dissatisfaction",
      "need": "Autonomy" | "Competence" | "Relatedness",
      "brief_type": "Opportunity" | "Pain Point" | "Insight"
    }
  ]
}
`;

export const analyzeWebsite = async (url: string): Promise<GeminiAnalysisResult> => {
    
    // Attempt to get a screenshot for Multimodal analysis (Much more precise)
    const screenshotBase64 = await getWebsiteScreenshotBase64(url);
    
    if (screenshotBase64) {
        console.log("Starting Slice & Conquer Analysis...");
        
        // 1. Slice the image
        const { slices, sliceHeights, totalHeight } = await sliceImageBase64(screenshotBase64);
        console.log(`Sliced into ${slices.length} chunks. Total Height: ${totalHeight}px`);

        // 2. Prepare Parallel Requests
        // Chunk 0 gets the Master Prompt (Reports + Markers)
        const masterPromise = ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { inlineData: { mimeType: "image/png", data: slices[0] } },
                { text: MULTIMODAL_PROMPT.replace(/{URL}/g, url) }
            ],
            config: { thinkingConfig: { thinkingBudget: 4096 } }
        });

        // Chunks 1..N get the Marker Only Prompt
        const bodyPromises = slices.slice(1).map(slice => 
            ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { inlineData: { mimeType: "image/png", data: slice } },
                    { text: MARKER_ONLY_PROMPT.replace(/{URL}/g, url) }
                ],
                config: { thinkingConfig: { thinkingBudget: 2048 } }
            })
        );

        // 3. Await all AI analysis
        const [masterResponse, ...bodyResponses] = await Promise.all([masterPromise, ...bodyPromises]);

        // 4. Process Master Result
        const masterResult = processResponse(masterResponse.text, screenshotBase64);
        let allMarkers = [...masterResult.markers];

        // 5. Adjust Master Markers (Chunk 0) coordinates to Global Space
        // Chunk 0 starts at Y=0, so we just scale Y based on (SliceHeight / TotalHeight)
        const h0 = sliceHeights[0];
        allMarkers.forEach(m => {
            // m.y is 0-100 in Slice 0
            // Convert to pixels in Slice 0
            const yPx = (m.y / 100) * h0;
            // Convert to Global %
            m.y = (yPx / totalHeight) * 100;
        });

        // 6. Process Body Results & Stitch Coordinates
        let currentYOffset = h0;
        
        bodyResponses.forEach((resp, index) => {
            try {
                const bodyJson = cleanJson(resp.text);
                const bodyData = JSON.parse(bodyJson);
                const rawMarkers = bodyData.markers || [];
                
                // Get height of this specific slice (index + 1 because we skipped 0)
                const thisSliceHeight = sliceHeights[index + 1];

                const processedBodyMarkers = rawMarkers.map((m: any) => {
                     // Parse standard fields
                     const marker = parseMarker(m);
                     
                     // STITCHING MATH:
                     // 1. Convert local % to local pixels
                     const localYPx = (marker.y / 100) * thisSliceHeight;
                     // 2. Add offset of previous slices
                     const globalYPx = currentYOffset + localYPx;
                     // 3. Convert to Global %
                     marker.y = (globalYPx / totalHeight) * 100;
                     
                     return marker;
                });

                allMarkers = [...allMarkers, ...processedBodyMarkers];
                currentYOffset += thisSliceHeight;

            } catch (e) {
                console.warn(`Failed to process markers for slice ${index + 1}`, e);
            }
        });

        // 7. Filter & Decluster
        // Filter out markers that are suspiciously exactly at corners or center (hallucination artifacts)
        allMarkers = allMarkers.filter(m => {
             // Reject lazy defaults like 0,0, 50,50, 100,100 (unless it's a very specific edge case)
             // We check global coordinates for x, but local-ish logic for y is harder. 
             // Just check X and Y being exact integers like 0, 50, 100 is usually a sign of AI guessing.
             if (m.x === 0 || m.x === 100) return false;
             return true;
        });

        if (allMarkers.length > 0) {
            allMarkers = declusterMarkers(allMarkers);
        }

        return {
            ...masterResult,
            markers: allMarkers
        };

    } else {
        // Fallback: Text-only
        console.log("Using Text-Only Search Analysis");
        const prompt = TEXT_ONLY_PROMPT.replace(/{URL}/g, url);
        const response = await ai.models.generateContent({ 
            model: "gemini-2.5-flash", 
            contents: prompt, 
            config: { tools: [{ googleSearch: {} }] } 
        });
        return processResponse(response.text, null);
    }
};

function parseMarker(m: any): Marker {
    return {
        id: generateId(),
        x: Math.max(1, Math.min(99, m.x || 50)), 
        y: Math.max(0, Math.min(100, m.y || 50)),
        layer: m.layer || 'emotions',
        comment: m.comment || "No comment provided.",
        source: 'AI',
        emotion: m.emotion ? matchEmotion(m.emotion) : undefined,
        need: m.need,
        brief_type: m.brief_type
    };
}

function declusterMarkers(markers: Marker[]): Marker[] {
    const SPREAD_THRESHOLD = 3.0; // Minimal distance % (Euclidean in 0-100 space)
    const ITERATIONS = 5; // Run a few times to settle

    // Deep copy to avoid mutating original during calculation
    let adjusted = JSON.parse(JSON.stringify(markers));

    for (let i = 0; i < ITERATIONS; i++) {
        for (let j = 0; j < adjusted.length; j++) {
            for (let k = j + 1; k < adjusted.length; k++) {
                let m1 = adjusted[j];
                let m2 = adjusted[k];

                let dx = m1.x - m2.x;
                let dy = m1.y - m2.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < SPREAD_THRESHOLD && dist > 0.01) {
                    // Push apart
                    let overlap = SPREAD_THRESHOLD - dist;
                    let moveX = (dx / dist) * overlap * 0.5;
                    let moveY = (dy / dist) * overlap * 0.5;

                    m1.x += moveX;
                    m1.y += moveY;
                    m2.x -= moveX;
                    m2.y -= moveY;
                }
            }
        }
    }

    // Clamp values to ensure they stay on screen (with padding)
    return adjusted.map((m: Marker) => ({
        ...m,
        x: Math.max(2, Math.min(98, m.x)),
        y: Math.max(0.5, Math.min(99.5, m.y))
    }));
}

function processResponse(rawText: string | undefined, screenshotBase64: string | null): GeminiAnalysisResult {
    if (!rawText) throw new Error("No response from AI");
    
    const jsonString = cleanJson(rawText);
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Fatal JSON Parse Error on string:", jsonString);
        throw new Error("Failed to parse AI response. The model might have failed to generate valid JSON.");
    }

    let markers: Marker[] = (data.markers || []).map(parseMarker);

    // APPLY DE-CLUSTERING ALGORITHM
    if (markers.length > 5) {
        markers = declusterMarkers(markers);
    }

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
            layoutStructure: Array.isArray(data.layoutStructure) ? data.layoutStructure : [{ type: 'unknown', estimatedHeight: 3000, backgroundColorHint: 'light' }],
            sdtScores: data.sdtScores || { autonomy: { score: 0, justification: 'N/A' }, competence: { score: 0, justification: 'N/A' }, relatedness: { score: 0, justification: 'N/A' } },
            creativeBrief: data.creativeBrief || { 
                problemStatement: 'N/A', 
                targetEmotion: 'N/A', 
                howMightWe: 'N/A', 
                strategicDirection: 'N/A',
                actionableSteps: [],
                benchmarks: []
            },
            screenshot: screenshotBase64 ? `data:image/png;base64,${screenshotBase64}` : undefined
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