import { buildInventoryTools } from "./tools/inventoryTools.js";
import { buildBookingTools } from "./tools/bookingTools.js";
import { buildAdminTools } from "./tools/adminTools.js";
import type { ToolContext } from "./toolContext.js";

// Admin-only tools are simply absent from a non-admin session's tool array — Claude
// physically cannot call a tool it was never given, regardless of what the conversation says.
export function buildToolsForRole(ctx: ToolContext) {
  const tools = [...buildInventoryTools(ctx), ...buildBookingTools(ctx)];
  if (ctx.role === "admin") {
    tools.push(...buildAdminTools(ctx));
  }
  return tools;
}
