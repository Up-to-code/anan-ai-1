/**
 * Anan agent tools – composes domain tool modules.
 */
import type { AgentToolsApi } from "./types";
import type { FunctionReference } from "convex/server";
import { createPropertyTools } from "./property";
import { createBanksTools } from "./banks";
import { createProfileTools } from "./profile";
import { createKnowledgeTools } from "./knowledge";
import { createHandoffTools } from "./handoff";
import { createWebTools } from "./web";
import { createFormatTools } from "./format";
import { createAnalysisTools } from "./analysis";
import { createMemoryAwarePropertyTools } from "../memory";

export type { AgentToolsApi } from "./types";

type MemoryApi = {
  store: FunctionReference<"mutation", "public" | "internal">;
  storeInteraction: FunctionReference<"mutation", "public" | "internal">;
  storeEntityRelation: FunctionReference<"mutation", "public" | "internal">;
  getRelevantContext: FunctionReference<"query", "public" | "internal">;
};

function hasCompleteMemoryApi(memory: AgentToolsApi["memory"]): memory is MemoryApi {
  return Boolean(
    memory &&
      memory.store &&
      memory.storeInteraction &&
      memory.storeEntityRelation &&
      memory.getRelevantContext,
  );
}

export function createAgentTools(appApi: AgentToolsApi) {
  const propertyTools = createPropertyTools(appApi);
  const banksTools = createBanksTools(appApi);
  const profileTools = createProfileTools(appApi);
  const knowledgeTools = createKnowledgeTools(appApi);
  const handoffTools = createHandoffTools(appApi);
  const webTools = createWebTools(appApi);
  const formatTools = createFormatTools();
  const analysisTools = createAnalysisTools();

  const memoryTools = hasCompleteMemoryApi(appApi.memory)
    ? createMemoryAwarePropertyTools(appApi, appApi.memory)
    : {};

  return {
    ...propertyTools,
    ...banksTools,
    ...profileTools,
    ...knowledgeTools,
    ...handoffTools,
    ...webTools,
    ...formatTools,
    ...analysisTools,
    ...memoryTools,
  };
}
