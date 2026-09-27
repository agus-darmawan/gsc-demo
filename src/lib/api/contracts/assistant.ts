import type {
  SttLanguage,
  SttResult,
  VlmAskRequest,
  VlmAskResponse,
} from "@/types/assistant";

export interface AssistantApi {
  /** POST /vlm/ask */
  askVlm(request: VlmAskRequest): Promise<VlmAskResponse>;
  /** POST /stt/transcribe (multipart: audio, language) */
  transcribe(audio: Blob, language: SttLanguage): Promise<SttResult>;
}
