import { useEffect, useState } from "react";
import { adminUsersApi } from "../api/adminUsers.api";
import { Modal } from "../components/common/Modal";
import { PasswordField } from "../components/common/PasswordField";
import type { Role, User } from "../types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

function AddUserForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminUsersApi.create({ name, email, password, role, phone: phone || undefined });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <PasswordField value={password} onChange={setPassword} minLength={8} required />
      </label>
      <label>
        Role
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label>
        Phone (optional)
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create user"}
      </button>
    </form>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  function load() {
    adminUsersApi.listAll().then(setUsers).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function runAction(id: string, action: (id: string) => Promise<User>) {
    setBusyId(id);
    setError(null);
    try {
      await action(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Users</h1>
          <p className="hint">Manage all users: approve signups, activate/deactivate accounts, or add one manually.</p>
        </div>
        <button type="button" onClick={() => setShowAddUser(true)}>
          Add user
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge">{u.role}</span>
                </td>
                <td>
                  <span className={`badge status-${u.status}`}>{STATUS_LABELS[u.status]}</span>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? "badge-active" : "badge-inactive"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="action-row">
                    {u.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => runAction(u.id, adminUsersApi.approve)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => runAction(u.id, adminUsersApi.reject)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="secondary"
                      disabled={busyId === u.id}
                      onClick={() =>
                        runAction(u.id, u.isActive ? adminUsersApi.deactivate : adminUsersApi.activate)
                      }
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddUser && (
        <Modal title="Add user" onClose={() => setShowAddUser(false)}>
          <AddUserForm onClose={() => setShowAddUser(false)} onCreated={load} />
        </Modal>
      )}
    </div>
  );
}
