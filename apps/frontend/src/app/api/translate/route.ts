import { NextRequest, NextResponse } from "next/server";

interface TranslateRequestBody {
  title: string;
  content: string;
  answer?: string;
  targetLocale: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Translation service not configured" },
      { status: 503 },
    );
  }

  let body: TranslateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, content, answer, targetLocale } = body;

  if (!title || !content || !targetLocale) {
    return NextResponse.json(
      { error: "title, content, and targetLocale are required" },
      { status: 400 },
    );
  }

  const localeNames: Record<string, string> = {
    vi: "Vietnamese",
    en: "English",
  };

  const targetLanguage = localeNames[targetLocale] ?? targetLocale;

  const fieldsToTranslate = [
    `<title>${title}</title>`,
    `<content>${content}</content>`,
    answer ? `<answer>${answer}</answer>` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Translate the following interview question fields from English to ${targetLanguage}.
Return ONLY a valid JSON object with keys: "title", "content"${answer ? ', "answer"' : ""}.
Preserve all HTML tags exactly as-is. Do not add explanations.

${fieldsToTranslate}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 502 },
    );
  }

  const data = await response.json();
  const rawText: string = data.choices?.[0]?.message?.content ?? "";

  try {
    const translated = JSON.parse(rawText);
    return NextResponse.json(translated);
  } catch {
    console.error("Failed to parse translation response:", rawText);
    return NextResponse.json(
      { error: "Failed to parse translation" },
      { status: 502 },
    );
  }
}
