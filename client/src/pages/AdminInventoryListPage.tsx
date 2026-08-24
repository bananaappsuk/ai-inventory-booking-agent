import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { inventoryApi } from "../api/inventory.api";
import { InventoryItemCard } from "../components/inventory/InventoryItemCard";
import type { InventoryItem } from "../types";

export function AdminInventoryListPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    inventoryApi.list(true).then(setItems).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function toggleHidden(item: InventoryItem) {
    if (item.status === "active") {
      await inventoryApi.hide(item._id);
    } else {
      await inventoryApi.unhide(item._id);
    }
    load();
  }

  async function remove(item: InventoryItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await inventoryApi.remove(item._id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  return (
    <div>
      <div className="section-header">
        <h1>Manage inventory</h1>
        <Link to="/admin/inventory/new">Add item</Link>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="inventory-grid">
        {items.map((item) => (
          <InventoryItemCard
            key={item._id}
            item={item}
            actions={
              <div className="action-row">
                <Link to={`/admin/inventory/${item._id}/edit`}>Edit</Link>
                <button type="button" onClick={() => toggleHidden(item)}>
                  {item.status === "active" ? "Hide" : "Unhide"}
                </button>
                <button type="button" onClick={() => remove(item)}>
                  Delete
                </button>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
