import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types";

export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== role) return null;
  return <>{children}</>;
}
