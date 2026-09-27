import type { DropTarget } from "@/types/drop";
import { http } from "../client/http";
import type { DropsApi } from "../contracts";

const path = (id: string) => `/drops/${encodeURIComponent(id)}`;

export const httpDropsApi: DropsApi = {
  async list() {
    const { data } = await http.get<DropTarget[]>("/drops");
    return data;
  },
  async create(input) {
    const { data } = await http.post<DropTarget>("/drops", input);
    return data;
  },
  async update(id, input) {
    const { data } = await http.put<DropTarget>(path(id), input);
    return data;
  },
  async remove(id) {
    await http.delete(path(id));
  },
  async execute(id) {
    const { data } = await http.post<DropTarget>(`${path(id)}/execute`);
    return data;
  },
  async cancel(id) {
    const { data } = await http.post<DropTarget>(`${path(id)}/cancel`);
    return data;
  },
};
