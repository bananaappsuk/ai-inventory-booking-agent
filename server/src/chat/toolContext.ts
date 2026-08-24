import type { Role } from "../middleware/auth.js";

export interface ToolContext {
  id: string;
  role: Role;
}
