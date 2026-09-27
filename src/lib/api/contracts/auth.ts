import type {
  AuthSession,
  ChangePasswordRequest,
  LoginRequest,
  User,
} from "@/types/auth";

export interface AuthApi {
  /** POST /auth/login */
  login(request: LoginRequest): Promise<AuthSession>;
  /** GET /auth/me */
  me(): Promise<User>;
  /** POST /auth/change-password -> fresh session (other sessions are signed out) */
  changePassword(request: ChangePasswordRequest): Promise<AuthSession>;
  /** POST /auth/logout */
  logout(): Promise<void>;
}
