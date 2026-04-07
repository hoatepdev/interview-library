interface SeniorAnswer {
  short_answer?: string;
  detailed_answer?: string;
  trade_offs?: Array<{
    approach: string;
    pros: string[];
    cons: string[];
  }>;
  real_world_example?: string;
  red_flags?: string[];
  follow_up_questions?: string[];
}

/**
 * Converts a senior-format JSON answer object into a readable markdown string.
 */
function seniorAnswerToMarkdown(parsed: SeniorAnswer): string {
  const parts: string[] = [];

  if (parsed.short_answer) {
    parts.push(`## Summary\n\n${parsed.short_answer}`);
  }

  if (parsed.detailed_answer) {
    parts.push(`## Detailed Answer\n\n${parsed.detailed_answer}`);
  }

  if (parsed.trade_offs?.length) {
    const tradeOffLines = parsed.trade_offs.map((t) => {
      const pros = t.pros?.map((p) => `  - ${p}`).join("\n") ?? "";
      const cons = t.cons?.map((c) => `  - ${c}`).join("\n") ?? "";
      return `### ${t.approach}\n\n**Pros:**\n${pros}\n\n**Cons:**\n${cons}`;
    });
    parts.push(`## Trade-offs\n\n${tradeOffLines.join("\n\n")}`);
  }

  if (parsed.real_world_example) {
    parts.push(`## Real-World Example\n\n${parsed.real_world_example}`);
  }

  if (parsed.red_flags?.length) {
    const flags = parsed.red_flags.map((f) => `- ${f}`).join("\n");
    parts.push(`## Red Flags\n\n${flags}`);
  }

  if (parsed.follow_up_questions?.length) {
    const questions = parsed.follow_up_questions.map((q) => `- ${q}`).join("\n");
    parts.push(`## Follow-up Questions\n\n${questions}`);
  }

  return parts.join("\n\n");
}

/**
 * Normalizes an answer string for display.
 * If the answer is a JSON-stringified senior answer object, converts it to markdown.
 * Otherwise returns the string as-is.
 */
export function normalizeAnswer(answer: string): string {
  if (!answer.trimStart().startsWith("{")) {
    return answer;
  }

  try {
    const parsed: SeniorAnswer = JSON.parse(answer);
    return seniorAnswerToMarkdown(parsed);
  } catch {
    return answer;
  }
}
