export type InferredMemoryFact = {
  key: string;
  value: string;
  memoryType: "preference" | "constraint" | "fact";
  confidence: number;
  source: "explicit_user_message";
};

function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function toSafeKeySegment(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function cleanValue(input: string, maxLen = 120): string {
  return collapseWhitespace(input).replace(/[.،,;:!?]+$/g, "").slice(0, maxLen);
}

export function inferMemoryFactsFromMessage(
  rawMessage: string,
): InferredMemoryFact[] {
  const message = collapseWhitespace(rawMessage);
  if (!message) return [];

  const facts: InferredMemoryFact[] = [];
  const pushFact = (fact: InferredMemoryFact) => {
    if (!fact.key || !fact.value) return;
    if (fact.value.length < 2 && !/^\d+$/.test(fact.value)) return;
    facts.push(fact);
  };

  const nameMatch =
    message.match(/\bmy name is\s+([a-z][a-z\s'-]{1,40})/i) ??
    message.match(/\bi am\s+([a-z][a-z\s'-]{1,30})/i) ??
    message.match(/\b(?:اسمي|أنا اسمي)\s+([\u0600-\u06ff]{2,30})/i);
  if (nameMatch?.[1]) {
    pushFact({
      key: "user_name",
      value: cleanValue(nameMatch[1], 40),
      memoryType: "fact",
      confidence: 0.95,
      source: "explicit_user_message",
    });
  }

  const budgetMatch =
    message.match(
      /\b(?:budget|up to|under|max|less than)\s*[:\-]?\s*(\d[\d,]{2,9})\b/i,
    ) ??
    message.match(/\b(?:ميزانية|حدي|حتى|اقل من)\s*[:\-]?\s*(\d[\d,]{2,9})\b/i);
  if (budgetMatch?.[1]) {
    const numeric = budgetMatch[1].replace(/[^\d]/g, "");
    if (numeric.length >= 4) {
      pushFact({
        key: "budget_preference",
        value: numeric,
        memoryType: "constraint",
        confidence: 0.9,
        source: "explicit_user_message",
      });
    }
  }

  const bedroomsMatch =
    message.match(/\b(\d{1,2})\s*(?:bed|beds|bedroom|bedrooms)\b/i) ??
    message.match(/\b(\d{1,2})\s*(?:غرف|غرفة)\b/i);
  if (bedroomsMatch?.[1]) {
    pushFact({
      key: "bedrooms_preference",
      value: bedroomsMatch[1],
      memoryType: "preference",
      confidence: 0.9,
      source: "explicit_user_message",
    });
  }

  const locationMatch =
    message.match(/\b(?:in|at|near)\s+([a-z][a-z\s'-]{2,40})\b/i) ??
    message.match(/\b(?:في|بحي|بالقرب من)\s+([\u0600-\u06ff]{2,30})\b/i);
  if (locationMatch?.[1]) {
    pushFact({
      key: "location_preference",
      value: cleanValue(locationMatch[1], 50),
      memoryType: "preference",
      confidence: 0.8,
      source: "explicit_user_message",
    });
  }

  const rememberNoteMatch =
    message.match(/\b(?:remember that|don't forget)\s+(.{3,120})$/i) ??
    message.match(/\b(?:تذكر|لا تنسى)\s+(.{3,120})$/i);
  if (rememberNoteMatch?.[1]) {
    pushFact({
      key: "user_note",
      value: cleanValue(rememberNoteMatch[1], 120),
      memoryType: "fact",
      confidence: 0.85,
      source: "explicit_user_message",
    });
  }

  const myFactMatch =
    message.match(/\bmy\s+([a-z][a-z0-9_\s-]{1,25})\s+is\s+(.{2,60})$/i) ??
    message.match(/\b(?:انا|أنا)\s+([\u0600-\u06ff]{2,20})\s+(.{2,60})$/i);
  if (myFactMatch?.[1] && myFactMatch?.[2]) {
    const keySegment = toSafeKeySegment(myFactMatch[1]);
    if (keySegment && !["name", "budget"].includes(keySegment)) {
      pushFact({
        key: `user_fact_${keySegment}`,
        value: cleanValue(myFactMatch[2], 60),
        memoryType: "fact",
        confidence: 0.7,
        source: "explicit_user_message",
      });
    }
  }

  const byKey = new Map<string, InferredMemoryFact>();
  for (const fact of facts) {
    const existing = byKey.get(fact.key);
    if (!existing || fact.confidence > existing.confidence) {
      byKey.set(fact.key, fact);
    }
  }
  return [...byKey.values()];
}
