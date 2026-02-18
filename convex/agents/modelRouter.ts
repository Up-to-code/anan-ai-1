/**
 * Deterministic weighted model routing for traffic splitting.
 *
 * Env format:
 * AGENT_MODEL_TRAFFIC_SPLIT="openrouter/model-a:70,openrouter/model-b:30"
 */

export type WeightedModel = {
  model: string;
  weight: number;
};

export function parseModelTrafficSplit(raw: string | undefined): WeightedModel[] {
  if (!raw) return [];
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const parsed: WeightedModel[] = [];
  for (const item of items) {
    const separatorIndex = item.lastIndexOf(":");
    if (separatorIndex <= 0 || separatorIndex >= item.length - 1) continue;
    const model = item.slice(0, separatorIndex).trim();
    const weightRaw = item.slice(separatorIndex + 1).trim();
    const weight = Number.parseInt(weightRaw, 10);
    if (!model || !Number.isFinite(weight) || weight <= 0) continue;
    parsed.push({ model, weight });
  }
  return parsed;
}

function hashToBucket(input: string): number {
  // FNV-1a 32-bit hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function selectModelByRoutingKey(
  routes: WeightedModel[],
  routingKey: string,
): string | undefined {
  if (!routes.length) return undefined;
  const totalWeight = routes.reduce((sum, route) => sum + route.weight, 0);
  if (totalWeight <= 0) return undefined;
  const bucket = hashToBucket(routingKey) % totalWeight;
  let acc = 0;
  for (const route of routes) {
    acc += route.weight;
    if (bucket < acc) return route.model;
  }
  return routes[routes.length - 1]?.model;
}

export function getRoutedModel(routingKey: string): string | undefined {
  const routes = parseModelTrafficSplit(process.env.AGENT_MODEL_TRAFFIC_SPLIT);
  return selectModelByRoutingKey(routes, routingKey);
}
