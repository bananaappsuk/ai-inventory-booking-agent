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
    if (!date || items.length === 0) {
      setAvailability({});
      return;
    }
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

  function maxFor(item: InventoryItem): number {
    const available = availability[item._id];
    return available !== undefined ? Math.max(0, available) : item.totalQuantity;
  }

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

  // If availability drops below a previously picked quantity (e.g. the date/session changed),
  // clamp the selection down so the dropdown never shows a stale, no-longer-available value.
  useEffect(() => {
    if (Object.keys(availability).length === 0) return;
    const clamped = value
      .map((line) => {
        const item = items.find((i) => i._id === line.inventoryItem);
        const max = item ? maxFor(item) : line.quantity;
        return { ...line, quantity: Math.min(line.quantity, max) };
      })
      .filter((line) => line.quantity > 0);
    const changed =
      clamped.length !== value.length || clamped.some((line, i) => line.quantity !== value[i]?.quantity);
    if (changed) onChange(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability]);

  return (
    <div className="item-picker">
      <div className="item-picker-row item-picker-header">
        <span>Item</span>
        <span>Quantity</span>
        <span>Available</span>
      </div>
      {items.map((item) => {
        const max = maxFor(item);
        const selected = Math.min(quantityFor(item._id), max);
        const options = Array.from({ length: max + 1 }, (_, n) => n);
        return (
          <div key={item._id} className="item-picker-row">
            <div className="item-picker-name">
              <strong>{item.name}</strong>
              {item.category && <span className="badge">{item.category}</span>}
            </div>
            <select value={selected} onChange={(e) => setQuantity(item._id, Number(e.target.value))}>
              {options.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="item-picker-available">{date ? `${max} available` : `${item.totalQuantity} total`}</span>
          </div>
        );
      })}
    </div>
  );
}
