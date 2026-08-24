import type { InventoryItem } from "../../types";

export function InventoryItemCard({
  item,
  actions
}: {
  item: InventoryItem;
  actions?: React.ReactNode;
}) {
  return (
    <div className={`inventory-card ${item.status === "hidden" ? "is-hidden" : ""}`}>
      {item.images[0] ? (
        <img className="inventory-card-photo" src={item.images[0].url} alt={item.name} />
      ) : (
        <div className="inventory-card-photo placeholder" />
      )}
      <div className="inventory-card-body">
        <h3>{item.name}</h3>
        {item.category && <span className="badge">{item.category}</span>}
        {item.description && <p className="muted">{item.description}</p>}
        <p>Total quantity: {item.totalQuantity}</p>
        {item.status === "hidden" && <span className="badge badge-warning">Hidden</span>}
        {actions}
      </div>
    </div>
  );
}
