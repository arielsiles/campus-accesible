// FR-901: Authentication and user types

export type UserRole = "contributor" | "reviewer" | "admin";

export type RouteStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "published"
  | "rejected"
  | "archived";

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  deviceId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface ReviewAction {
  action: "approved" | "changes_requested" | "rejected";
  comment?: string;
}

export const ROUTE_STATUS_LABELS: Record<RouteStatus, string> = {
  draft: "Borrador",
  pending_review: "Pendiente de revisión",
  changes_requested: "Cambios solicitados",
  published: "Publicada",
  rejected: "Rechazada",
  archived: "Archivada",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  contributor: "Contribuidor",
  reviewer: "Revisor",
  admin: "Administrador",
};
