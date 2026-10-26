// The model is told to reply with JSON only, but strip code fences or stray prose just in case.
export function parseJsonReply(text: string): unknown {
  const unfenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = unfenced.search(/[[{]/);
  const end = Math.max(unfenced.lastIndexOf(']'), unfenced.lastIndexOf('}'));
  if (start < 0 || end < start) throw new Error('no JSON found in reply');
  return JSON.parse(unfenced.slice(start, end + 1));
}
