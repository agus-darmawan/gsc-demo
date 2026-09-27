export type UserRole = "admin" | "operator" | "observer";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  /** Unit / satuan the operator belongs to. */
  unit: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: "Bearer";
  /** Epoch millis, null when the token does not expire. */
  expiresAt: number | null;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
