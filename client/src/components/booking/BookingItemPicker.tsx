import { useEffect, useState } from "react";
import { inventoryApi } from "../../api/inventory.api";
import type { InventoryItem, Session } from "../../types";

export interface PickedLine {
  inventoryItem: string;
  quantity: number;
}

export function BookingItemPicker({
  date,
  session,
  value,
  onChange
}: {
  date: string;
  session: Session;
  value: PickedLine[];
  onChange: (lines: PickedLine[]) => void;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [availability, setAvailability] = useState<Record<string, number>>({});

  useEffect(() => {
    inventoryApi.list(false).then(setItems);
  }, []);

  useEffect(() => {
    if (!date || items.length === 0) return;
    let cancelled = false;
    Promise.all(
      items.map((item) =>
        inventoryApi
          .availability(item._id, date, session)
          .then((res) => [item._id, res.available] as const)
          .catch(() => [item._id, item.totalQuantity] as const)
      )
    ).then((results) => {
      if (cancelled) return;
      setAvailability(Object.fromEntries(results));
    });
    return () => {
      cancelled = true;
    };
  }, [date, session, items]);

  function quantityFor(itemId: string): number {
    return value.find((l) => l.inventoryItem === itemId)?.quantity ?? 0;
  }

  function setQuantity(itemId: string, quantity: number) {
    const rest = value.filter((l) => l.inventoryItem !== itemId);
    if (quantity > 0) {
      onChange([...rest, { inventoryItem: itemId, quantity }]);
    } else {
      onChange(rest);
    }
  }

  return (
    <div className="item-picker">
      {items.map((item) => (
        <div key={item._id} className="item-picker-row">
          <div>
            <strong>{item.name}</strong>
            {item.category && <span className="badge">{item.category}</span>}
            {date && (
              <span className="hint">
                {" "}
                available: {availability[item._id] ?? item.totalQuantity} / {item.totalQuantity}
              </span>
            )}
          </div>
          <input
            type="number"
            min={0}
            max={item.totalQuantity}
            value={quantityFor(item._id)}
            onChange={(e) => setQuantity(item._id, Number(e.target.value))}
          />
        </div>
      ))}
    </div>
  );
}
