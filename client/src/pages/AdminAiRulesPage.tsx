import { useEffect, useState } from "react";
import { adminAiApi } from "../api/adminAi.api";
import { NumberField } from "../components/common/NumberField";
import type { ApprovalRule, RuleType } from "../types";

const RULE_LABELS: Record<RuleType, string> = {
  min_prior_approvals: "User has prior approval history",
  no_date_overlap: "No conflicting booking on the same date/session",
  max_quantity_share: "Request below inventory share cap",
  inventory_available: "Inventory available for the period"
};

const RULE_DESCRIPTIONS: Record<RuleType, string> = {
  min_prior_approvals: "Requires the user to have at least this many previously fulfilled bookings.",
  no_date_overlap: "Fails if the user already has another active booking on the same date and session.",
  max_quantity_share: "Fails if any single line item requests this percentage (or more) of that item's total quantity.",
  inventory_available: "Fails if there isn't enough remaining inventory for the requested date and session."
};

// Which numeric param each rule exposes for editing, if any.
const RULE_PARAM_KEY: Partial<Record<RuleType, { key: string; label: string; suffix?: string }>> = {
  min_prior_approvals: { key: "minApprovals", label: "Minimum prior approvals" },
  max_quantity_share: { key: "maxSharePct", label: "Max share of inventory", suffix: "%" }
};

function RuleCard({ rule, onSaved }: { rule: ApprovalRule; onSaved: (rule: ApprovalRule) => void }) {
  const [enabled, setEnabled] = useState(rule.enabled);
  const paramMeta = RULE_PARAM_KEY[rule.ruleType];
  const [paramValue, setParamValue] = useState(paramMeta ? (rule.params[paramMeta.key] ?? 0) : 0);
  const [note, setNote] = useState(rule.naturalLanguageText ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await adminAiApi.upsertRule(rule.ruleType, {
        enabled,
        params: paramMeta ? { ...rule.params, [paramMeta.key]: paramValue } : rule.params,
        naturalLanguageText: note
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="booking-card">
      <div className="booking-card-header">
        <strong>{RULE_LABELS[rule.ruleType]}</strong>
        <label className="checkbox-label">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>
      <p className="hint">{RULE_DESCRIPTIONS[rule.ruleType]}</p>
      {paramMeta && (
        <label>
          {paramMeta.label}
          {paramMeta.suffix ? ` (${paramMeta.suffix})` : ""}
          <NumberField min={0} value={paramValue} onChange={setParamValue} />
        </label>
      )}
      <label className="note-label">
        Notes for admins (optional)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </label>
      {error && <p className="error-text">{error}</p>}
      <button type="button" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function AdminAiRulesPage() {
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [flagEnabled, setFlagEnabled] = useState(false);
  const [flagBusy, setFlagBusy] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminAiApi.listRules().then(setRules).catch((err) => setError(err.message));
    adminAiApi.getFlag().then((f) => setFlagEnabled(f.enabled));
    adminAiApi.getPrompt().then((p) => setPrompt(p.prompt));
  }

  useEffect(load, []);

  async function toggleFlag() {
    setFlagBusy(true);
    setError(null);
    try {
      const result = await adminAiApi.setFlag(!flagEnabled);
      setFlagEnabled(result.enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update setting");
    } finally {
      setFlagBusy(false);
    }
  }

  function onRuleSaved(updated: ApprovalRule) {
    setRules((prev) => prev.map((r) => (r.ruleType === updated.ruleType ? updated : r)));
  }

  return (
    <div>
      <h1>AI approval rules</h1>
      <p className="hint">
        Bookings are only auto-approved when every enabled rule below passes and the AI's confidence is
        high. If any rule fails, the booking is never auto-rejected — it's routed to an admin for manual
        review with the AI's reasoning attached.
      </p>

      {error && <p className="error-text">{error}</p>}

      <section>
        <div className="booking-card-header">
          <h2>Auto-approval</h2>
        </div>
        <div className="action-row">
          <span className={`badge ${flagEnabled ? "badge-active" : "badge-inactive"}`}>
            {flagEnabled ? "Enabled" : "Disabled"}
          </span>
          <button type="button" onClick={toggleFlag} disabled={flagBusy}>
            {flagEnabled ? "Turn off" : "Turn on"}
          </button>
        </div>
        <p className="hint">Takes effect immediately for the next booking submitted — no restart needed.</p>
      </section>

      <section>
        <h2>Rules</h2>
        <div className="booking-list">
          {rules.map((rule) => (
            <RuleCard key={rule.ruleType} rule={rule} onSaved={onRuleSaved} />
          ))}
        </div>
      </section>

      <section>
        <h2>AI prompt</h2>
        <p className="hint">
          The system prompt given to the AI when it's asked to recommend approve/reject based on a
          user's booking history (only ever called after all rules above have already passed).
        </p>
        <pre className="ai-prompt-block">{prompt}</pre>
      </section>
    </div>
  );
}
