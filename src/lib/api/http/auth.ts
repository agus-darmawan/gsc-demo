import type { AuthSession, User } from "@/types/auth";
import { http } from "../client/http";
import type { AuthApi } from "../contracts";

export const httpAuthApi: AuthApi = {
  async login(request) {
    const { data } = await http.post<AuthSession>("/auth/login", request, {
      skipAuthHandling: true,
    });
    return data;
  },
  async me() {
    const { data } = await http.get<User>("/auth/me");
    return data;
  },
  async changePassword(request) {
    const { data } = await http.post<AuthSession>(
      "/auth/change-password",
      request,
    );
    return data;
  },
  async logout() {
    await http.post("/auth/logout", null, { skipAuthHandling: true });
  },
};
