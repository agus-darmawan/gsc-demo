import type { Drone, LinkTestResult } from "@/types/drone";
import type { FlightSession } from "@/types/telemetry";
import { http } from "../client/http";
import type { DronesApi } from "../contracts";

const path = (id: string) => `/drones/${encodeURIComponent(id)}`;

export const httpDronesApi: DronesApi = {
  async list() {
    const { data } = await http.get<Drone[]>("/drones");
    return data;
  },
  async get(id) {
    const { data } = await http.get<Drone>(path(id));
    return data;
  },
  async create(input) {
    const { data } = await http.post<Drone>("/drones", input);
    return data;
  },
  async update(id, input) {
    const { data } = await http.put<Drone>(path(id), input);
    return data;
  },
  async remove(id) {
    await http.delete(path(id));
  },
  async testLink(link, droneId) {
    const body = { ...link, droneId: droneId ?? null };
    const { data } = await http.post<LinkTestResult>(
      "/drones/test-link",
      body,
      {
        timeout: 20_000,
      },
    );
    return data;
  },
  async flights(id) {
    const { data } = await http.get<FlightSession[]>(`${path(id)}/flights`);
    return data;
  },
};
