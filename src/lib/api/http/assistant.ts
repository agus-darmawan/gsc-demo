import type { SttResult, VlmAskResponse } from "@/types/assistant";
import { http } from "../client/http";
import type { AssistantApi } from "../contracts";

export const httpAssistantApi: AssistantApi = {
  async askVlm(request) {
    const { data } = await http.post<VlmAskResponse>("/vlm/ask", request, {
      timeout: 120_000,
    });
    return data;
  },
  async transcribe(audio, language) {
    const form = new FormData();
    const extension = audio.type.includes("ogg") ? "ogg" : "webm";
    form.append("audio", audio, `speech.${extension}`);
    form.append("language", language);
    const { data } = await http.post<SttResult>("/stt/transcribe", form, {
      timeout: 60_000,
    });
    return data;
  },
};
