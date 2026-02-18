import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
  }

  try {
    const { routes, persona } = await request.json();

    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json({ error: 'No routes provided' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routeSummaries = routes.map((route: any, index: number) => {
      const props = route.properties;
      const summary = props.summary || {};

      // Instructions
      let stepsText = '';
      if (props.segments && props.segments[0] && props.segments[0].steps) {
         stepsText = props.segments[0].steps.map((s: { instruction: string }) => s.instruction).join('; ');
      }

      // Limit text length to avoid token issues, but keep enough for analysis
      if (stepsText.length > 2000) stepsText = stepsText.substring(0, 2000) + '...';

      return `Route ${index}:
      - Distance: ${summary.distance} meters
      - Duration: ${summary.duration} seconds
      - Path description: ${stepsText}`;
    }).join('\n\n');

    const prompt = `
      You are an intelligent navigation assistant.
      User Persona: "${persona}"

      I have ${routes.length} route options for a driving trip.
      Here are the details for each route:
      ${routeSummaries}

      Analyze the routes based on the persona.
      - "Relaxed Driver": Prefers simpler roads, fewer turns, scenic if possible (though you might not know scenery, infer from road types). Avoids highways if specified or implied complexity.
      - "Speed Demon" / "Early Bird": Prefers fastest duration.
      - "Sightseer": Prefers routes that might be interesting, maybe longer but less highway.
      - "Cautious Driver": Avoids complex intersections or heavy traffic areas if inferable.

      Select the best route index (0 to ${routes.length - 1}).
      Provide a reasoning explaining why this route fits the persona better than others.

      Return ONLY a JSON object with this structure:
      {
        "recommended_route_index": number,
        "reasoning": "string"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      console.error('JSON Parse Error:', text);
      return NextResponse.json({
        recommended_route_index: 0,
        reasoning: "Gemini analysis format error. Defaulting to first route."
      });
    }

  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json({
      recommended_route_index: 0,
      reasoning: "Gemini service unavailable. Defaulting to first route."
    });
  }
}
