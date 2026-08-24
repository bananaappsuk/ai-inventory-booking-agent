import { z } from "zod/v4";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";
import * as inventoryService from "../../services/inventory.service.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import type { ToolContext } from "../toolContext.js";

// Read-only tools: available to both roles, execute immediately (no confirm step).
export function buildInventoryTools(_ctx: ToolContext): BetaRunnableTool<any>[] {
  const listInventory = betaZodTool({
    name: "list_inventory",
    description: "List inventory items (tables, chairs, marquees, etc.), optionally filtered by category.",
    inputSchema: z.object({
      category: z.string().optional().describe("Optional category filter, e.g. 'Chairs'")
    }),
    run: async (args) => {
      const items = await inventoryService.listInventory({ includeHidden: false });
      const filtered = args.category
        ? items.filter((i) => i.category?.toLowerCase() === args.category!.toLowerCase())
        : items;
      return JSON.stringify(
        filtered.map((i) => ({
          id: i._id.toString(),
          name: i.name,
          category: i.category,
          totalQuantity: i.totalQuantity
        }))
      );
    }
  });

  const checkAvailability = betaZodTool({
    name: "check_inventory_availability",
    description:
      "Check how many units of an inventory item are available for a given date and session (AM or PM). " +
      "Provide either itemId (if known) or itemName to look it up by name.",
    inputSchema: z.object({
      itemId: z.string().optional(),
      itemName: z.string().optional(),
      date: z.string().describe("ISO date, e.g. 2026-09-05"),
      session: z.enum(["AM", "PM"])
    }),
    run: async (args) => {
      let itemId = args.itemId;
      if (!itemId && args.itemName) {
        const found = await InventoryItem.findOne({
          name: new RegExp(`^${args.itemName}$`, "i"),
          status: "active"
        });
        if (!found) return `No inventory item found matching "${args.itemName}"`;
        itemId = found._id.toString();
      }
      if (!itemId) return "Provide either itemId or itemName";

      const result = await inventoryService.checkAvailability({
        itemId,
        date: new Date(args.date),
        session: args.session
      });
      return JSON.stringify(result);
    }
  });

  return [listInventory, checkAvailability];
}
