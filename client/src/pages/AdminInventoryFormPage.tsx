import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { inventoryApi } from "../api/inventory.api";
import { InventoryItemForm } from "../components/inventory/InventoryItemForm";
import type { InventoryItem } from "../types";

export function AdminInventoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItem | undefined>(undefined);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    inventoryApi.get(id).then((i) => {
      setItem(i);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1>{item ? "Edit item" : "Add item"}</h1>
      <InventoryItemForm
        item={item}
        onSaved={(saved) => {
          setItem(saved);
          if (!id) navigate(`/admin/inventory/${saved._id}/edit`);
        }}
      />
      <button type="button" onClick={() => navigate("/admin/inventory")}>
        Back to list
      </button>
    </div>
  );
}
