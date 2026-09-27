import type { Camera } from "@/types/camera";
import { http } from "../client/http";
import type { CamerasApi } from "../contracts";

const path = (id: string) => `/cameras/${encodeURIComponent(id)}`;

export const httpCamerasApi: CamerasApi = {
  async list() {
    const { data } = await http.get<Camera[]>("/cameras");
    return data;
  },
  async create(input) {
    const { data } = await http.post<Camera>("/cameras", input);
    return data;
  },
  async update(id, input) {
    const { data } = await http.put<Camera>(path(id), input);
    return data;
  },
  async remove(id) {
    await http.delete(path(id));
  },
};
