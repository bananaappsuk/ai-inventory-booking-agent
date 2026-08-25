import { useEffect, useState } from "react";
import { adminUsersApi } from "../api/adminUsers.api";
import type { User } from "../types";

export function AdminApproveUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    adminUsersApi.listPending().then(setUsers).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await adminUsersApi.approve(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve user");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await adminUsersApi.reject(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject user");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1>Approve users</h1>
      <p className="hint">New signups need your approval before they can log in.</p>
      {error && <p className="error-text">{error}</p>}
      {users.length === 0 && <p className="hint">No signups awaiting approval.</p>}
      <div className="booking-list">
        {users.map((u) => (
          <div key={u.id} className="booking-card">
            <div className="booking-card-header">
              <strong>{u.name}</strong>
            </div>
            <p className="muted">{u.email}</p>
            {u.phone && <p className="hint">{u.phone}</p>}
            <div className="action-row">
              <button type="button" onClick={() => approve(u.id)} disabled={busyId === u.id}>
                Approve
              </button>
              <button type="button" onClick={() => reject(u.id)} disabled={busyId === u.id}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
