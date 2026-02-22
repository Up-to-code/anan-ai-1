import { getWhatsAppMediaDownloadUrl } from "../channels/whatsapp/api";

export type TranscriptionStatus = "success" | "failed" | "timeout";

export type TranscriptionResult = {
  status: TranscriptionStatus;
  text?: string;
  latencyMs: number;
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_POLL_INTERVAL_MS = 800;

function getAssemblyHeaders() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY not set");
  return { authorization: apiKey };
}

async function uploadAudioBytesToAssemblyAi(audioBytes: ArrayBuffer): Promise<string> {
  const res = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: getAssemblyHeaders(),
    body: audioBytes,
  });
  const data = (await res.json()) as { upload_url?: string; error?: string };
  if (!res.ok || !data.upload_url) {
    throw new Error(data.error ?? `AssemblyAI upload failed: ${res.status}`);
  }
  return data.upload_url;
}

async function startTranscription(audioUrl: string, languageCode: string): Promise<string> {
  const res = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      ...getAssemblyHeaders(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: languageCode,
      speech_model: "universal",
    }),
  });
  const data = (await res.json()) as { id?: string; error?: string };
  if (!res.ok || !data.id) {
    throw new Error(data.error ?? `AssemblyAI transcript start failed: ${res.status}`);
  }
  return data.id;
}

async function pollTranscription(
  transcriptId: string,
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<{ status: TranscriptionStatus; text?: string; error?: string }> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      method: "GET",
      headers: getAssemblyHeaders(),
    });
    const data = (await res.json()) as {
      status?: string;
      text?: string;
      error?: string;
    };
    if (!res.ok) {
      return { status: "failed", error: data.error ?? `AssemblyAI polling failed: ${res.status}` };
    }
    if (data.status === "completed") {
      return { status: "success", text: data.text ?? "" };
    }
    if (data.status === "error") {
      return { status: "failed", error: data.error ?? "AssemblyAI returned error state" };
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return { status: "timeout", error: "Transcription timed out" };
}

export async function transcribeWhatsAppAudio(params: {
  mediaId?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  languageCode?: string;
}): Promise<TranscriptionResult> {
  const start = Date.now();
  try {
    if (!params.mediaId) {
      return {
        status: "failed",
        latencyMs: Date.now() - start,
        error: "Missing mediaId",
      };
    }
    const media = await getWhatsAppMediaDownloadUrl(params.mediaId);
    if (!media.success || !media.url) {
      return {
        status: "failed",
        latencyMs: Date.now() - start,
        error: media.error ?? "Could not resolve media URL",
      };
    }
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token) {
      return {
        status: "failed",
        latencyMs: Date.now() - start,
        error: "WHATSAPP_ACCESS_TOKEN not set",
      };
    }
    const audioRes = await fetch(media.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!audioRes.ok) {
      return {
        status: "failed",
        latencyMs: Date.now() - start,
        error: `Media download failed: ${audioRes.status}`,
      };
    }
    const audioBytes = await audioRes.arrayBuffer();
    const uploadUrl = await uploadAudioBytesToAssemblyAi(audioBytes);
    const transcriptId = await startTranscription(
      uploadUrl,
      params.languageCode ?? process.env.ASSEMBLYAI_LANGUAGE_CODE ?? "ar",
    );
    const poll = await pollTranscription(
      transcriptId,
      params.timeoutMs ?? Number(process.env.ASSEMBLYAI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
      params.pollIntervalMs ??
        Number(process.env.ASSEMBLYAI_POLL_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL_MS),
    );
    return {
      status: poll.status,
      text: poll.text,
      error: poll.error,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "failed",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown transcription error",
    };
  }
}
