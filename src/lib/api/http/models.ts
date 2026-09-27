import type { DetectionModel } from "@/types/model";
import { http } from "../client/http";
import type { ModelsApi } from "../contracts";

const path = (id: string) => `/models/${encodeURIComponent(id)}`;

export const httpModelsApi: ModelsApi = {
  async list() {
    const { data } = await http.get<DetectionModel[]>("/models");
    return data;
  },
  async upload(request, onProgress, signal) {
    const form = new FormData();
    form.append("file", request.file, request.file.name);
    form.append("name", request.name);
    if (request.description) form.append("description", request.description);
    form.append("classes", JSON.stringify(request.classes));

    const { data } = await http.post<DetectionModel>("/models", form, {
      signal,
      timeout: 0,
      onUploadProgress: (event) => {
        const total = event.total ?? request.file.size;
        onProgress?.({
          loaded: event.loaded,
          total,
          percent: total > 0 ? Math.round((event.loaded / total) * 100) : 0,
        });
      },
    });
    return data;
  },
  async update(id, patch) {
    const { data } = await http.patch<DetectionModel>(path(id), patch);
    return data;
  },
  async remove(id) {
    await http.delete(path(id));
  },
  async load(id) {
    const { data } = await http.post<DetectionModel>(`${path(id)}/load`, null, {
      timeout: 120_000,
    });
    return data;
  },
  async unload(id) {
    const { data } = await http.post<DetectionModel>(`${path(id)}/unload`);
    return data;
  },
};
