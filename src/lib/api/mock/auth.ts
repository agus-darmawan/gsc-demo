import type { AuthSession, User } from "@/types/auth";
import { ApiError } from "../client/errors";
import { currentToken } from "../client/http";
import type { AuthApi } from "../contracts";
import { latency, readDb, updateDb } from "./db";
import type { MockUser } from "./seed";

const SESSION_TTL_MS = 12 * 3_600_000;

const toUser = (u: MockUser): User => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  role: u.role,
  unit: u.unit,
});

function userFromToken(): MockUser {
  const token = currentToken();
  const userId = token?.split(".")[1];
  const user = readDb().users.find((u) => u.id === userId);
  if (!user) throw new ApiError("Sesi berakhir, silakan masuk kembali", 401);
  return user;
}

export const mockAuthApi: AuthApi = {
  async login({ username, password }) {
    await latency(250);
    const user = readDb().users.find(
      (u) => u.username === username.trim().toLowerCase(),
    );
    if (!user || user.password !== password) {
      throw new ApiError("Nama pengguna atau kata sandi salah", 401);
    }
    const session: AuthSession = {
      accessToken: `mock.${user.id}.${Date.now().toString(36)}`,
      tokenType: "Bearer",
      expiresAt: Date.now() + SESSION_TTL_MS,
      user: toUser(user),
    };
    return session;
  },

  async me() {
    await latency();
    return toUser(userFromToken());
  },

  async changePassword({ currentPassword, newPassword }) {
    await latency(200);
    const user = userFromToken();
    if (user.password !== currentPassword) {
      throw new ApiError("Kata sandi saat ini salah", 400);
    }
    if (newPassword.length < 8) {
      throw new ApiError("Kata sandi baru minimal 8 karakter", 422);
    }
    updateDb((db) => {
      const target = db.users.find((u) => u.id === user.id);
      if (target) target.password = newPassword;
    });
    return mockAuthApi.login({
      username: user.username,
      password: newPassword,
    });
  },

  async logout() {
    await latency();
  },
};
