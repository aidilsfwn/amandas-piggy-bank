import {
  useEffect,
  useMemo,
  useState,
  type FormEvent as ReactFormEvent,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  CalendarDays,
  ChevronDown,
  Download,
  Gift,
  Landmark,
  LogOut,
  Pencil,
  PiggyBank,
  Plus,
  Sparkles,
  Sprout,
  Trash2,
} from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Popover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import "./App.css";
import { Button } from "./components/ui/button";
import {
  calculateSummary,
  formatRM,
  parseAmountToSen,
  sortTransactions,
  transactionLabels,
  validateTransaction,
  type SavingsTransaction,
  type TransactionType,
} from "./domain";
import { exportCsv } from "./storage";
import {
  deleteRemoteTransaction,
  fetchRemoteTransactions,
  saveRemoteTransaction,
  supabase,
} from "./supabase";

const today = new Date().toISOString().slice(0, 10);
const blank = {
  type: "gift_received" as TransactionType,
  amount: "",
  date: today,
  dividendYear: "",
  dividendRate: "",
  note: "",
};
type FormEvent = ReactFormEvent<HTMLFormElement>;

function App() {
  const [owner, setOwner] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const summary = useMemo(() => calculateSummary(transactions), [transactions]);
  const history = useMemo(() => sortTransactions(transactions), [transactions]);
  const heldShare = summary.totalBelongingSen
    ? Math.max(
        0,
        Math.min(100, (summary.heldByMeSen / summary.totalBelongingSen) * 100),
      )
    : 0;
  const allocationLabel = summary.totalBelongingSen
    ? `${heldShare.toFixed(0)}% held by me and ${(100 - heldShare).toFixed(0)}% in SSPN`
    : "No savings recorded yet";

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!supabase) return;
    const loadSessionData = async (session: Session) => {
      setUserId(session.user.id);
      const email = session.user.email ?? "Owner";
      setOwner(email);
      try {
        const remote = await fetchRemoteTransactions();
        setTransactions(remote);
      } catch (reason) {
        const failure = reason as { message?: string; code?: string };
        setError(
          `Could not load synced transactions${failure.code ? ` (${failure.code})` : ""}: ${failure.message ?? "Unknown error"}`,
        );
      }
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void loadSessionData(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) window.setTimeout(() => void loadSessionData(session), 0);
        else setUserId(null);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const updateTransactions = async (
    next: SavingsTransaction[],
    changed?: SavingsTransaction,
    removed?: string,
  ) => {
    try {
      if (userId && changed) await saveRemoteTransaction(userId, changed);
      if (userId && removed) await deleteRemoteTransaction(userId, removed);
      if (userId) {
        const remote = await fetchRemoteTransactions();
        setTransactions(remote);
      } else {
        setTransactions(next);
      }
      return true;
    } catch (reason) {
      const failure = reason as {
        message?: string;
        code?: string;
        details?: string;
      };
      setError(
        `Sync failed${failure.code ? ` (${failure.code})` : ""}: ${failure.message ?? failure.details ?? "Check your Supabase permissions and try again."}`,
      );
      return false;
    }
  };
  const openNew = () => {
    setForm(blank);
    setEditing(null);
    setError("");
    setModalOpen(true);
  };
  const openEdit = (transaction: SavingsTransaction) => {
    setForm({
      type: transaction.type,
      amount: (transaction.amountSen / 100).toFixed(2),
      date: transaction.transactionDate,
      dividendYear: String(transaction.dividendYear ?? ""),
      dividendRate: transaction.dividendRateBps
        ? (transaction.dividendRateBps / 100).toFixed(2)
        : "",
      note: transaction.note ?? "",
    });
    setEditing(transaction.id);
    setError("");
    setModalOpen(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const current = editing
      ? transactions.find((t) => t.id === editing)
      : undefined;
    const message = validateTransaction(
      form,
      summary,
      current?.type === "sspn_transfer" ? current.amountSen : 0,
    );
    if (message) {
      setError(message);
      return;
    }
    const now = new Date().toISOString();
    const item: SavingsTransaction = {
      id: editing ?? crypto.randomUUID(),
      type: form.type,
      amountSen: parseAmountToSen(form.amount)!,
      transactionDate: form.date,
      dividendYear:
        form.type === "sspn_dividend" && form.dividendYear
          ? Number(form.dividendYear)
          : undefined,
      dividendRateBps:
        form.type === "sspn_dividend" && form.dividendRate
          ? Math.round(Number(form.dividendRate) * 100)
          : undefined,
      note: form.note.trim() || undefined,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    if (
      await updateTransactions(
        editing
          ? transactions.map((t) => (t.id === editing ? item : t))
          : [item, ...transactions],
        item,
      )
    )
      setModalOpen(false);
  };
  const remove = (id: string) => setDeleteId(id);
  const confirmDelete = () => {
    if (!deleteId) return;
    void updateTransactions(
      transactions.filter((t) => t.id !== deleteId),
      undefined,
      deleteId,
    );
    setDeleteId(null);
  };
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setOwner(null);
    setUserId(null);
    setTransactions([]);
  };
  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    const email = (
      event.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const password = (
      event.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;
    if (!supabase) {
      setAuthMessage("Supabase is not configured for this deployment.");
      return;
    }
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError || !data.user) {
      setAuthMessage(authError?.message ?? "Could not sign in.");
      return;
    }
    const signedInEmail = data.user.email ?? email;
    setOwner(signedInEmail);
    setUserId(data.user.id);
    try {
      const remote = await fetchRemoteTransactions();
      setTransactions(remote);
    } catch (reason) {
      const failure = reason as { message?: string; code?: string };
      setError(
        `Could not load synced transactions${failure.code ? ` (${failure.code})` : ""}: ${failure.message ?? "Unknown error"}`,
      );
    }
    setAuthMessage("");
  };
  const resetPassword = async () => {
    const email = window.prompt("Enter your account email");
    if (!email || !supabase) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: window.location.origin },
    );
    setResetMessage(
      resetError?.message ?? "Check your email for a password reset link.",
    );
  };

  if (!owner)
    return (
      <main className="auth">
        <section className="auth-intro">
          <div className="brand brand-on-dark">
            <span className="brand-mark">
              <PiggyBank size={21} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="brand-name">Amanda's Piggy Bank</span>
          </div>
          <div className="auth-intro-copy">
            <div className="eyebrow">Private family ledger</div>
            <h1>Every ringgit,<br />accounted for.</h1>
            <p>A simple record of Amanda’s gifts, transfers and SSPN savings.</p>
          </div>
          <div className="auth-note">Built for one family. Kept deliberately simple.</div>
        </section>
        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-head">
              <span className="auth-kicker">Welcome back</span>
              <h2>Sign in to the ledger</h2>
              <p>
                {supabase
                  ? "Use your account details to view and update Amanda’s savings."
                  : "A private place to keep Amanda’s savings clear and current."}
              </p>
            </div>
            <form onSubmit={signIn}>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="field">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <Button className="text-btn" onClick={() => void resetPassword()}>
                    Forgot password?
                  </Button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button className="add-btn auth-submit" type="submit">
                Sign in
              </Button>
            </form>
            {authMessage && <div className="error" role="status">{authMessage}</div>}
            {resetMessage && <div className="error" role="status">{resetMessage}</div>}
          </div>
        </section>
      </main>
    );

  return (
    <main className="app-shell">
      <div className="container">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">
              <PiggyBank size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="brand-name brand-name-app brand-name-app-full">Amanda's Piggy Bank</span>
            <span className="brand-name brand-name-app brand-name-app-short">Amanda's ledger</span>
          </div>
          <div className="top-actions">
            <Button
              className="secondary-btn export-btn"
              onClick={() => exportCsv(history)}
            >
              <Download size={15} aria-hidden="true" /> Export
            </Button>
            <Button
              className="account-btn"
              aria-label="Log out"
              onClick={() => setLogoutOpen(true)}
            >
              <span className="account-avatar" aria-hidden="true">A</span>
              <span className="account-label">{owner}</span>
              <LogOut size={15} aria-hidden="true" />
            </Button>
          </div>
        </header>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">Savings overview</div>
            <h1>Amanda’s ledger</h1>
            <p>Balances and activity, as of {new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}.</p>
          </div>
          <Button className="add-btn" onClick={openNew}>
            <Plus size={18} aria-hidden="true" /> Add transaction
          </Button>
        </section>
        <section className="overview-grid">
          <article className="total-panel">
            <div className="card-label">Total savings</div>
            <div className="total-amount">{formatRM(summary.totalBelongingSen)}</div>
            <div className="total-breakdown">
              <span><small>Gifts received</small>{formatRM(summary.giftsReceivedSen)}</span>
              <span><small>Dividends earned</small>{formatRM(summary.sspnDividendsSen)}</span>
            </div>
          </article>
          <article className="allocation-panel">
            <div className="panel-heading">
              <div>
                <div className="card-label">Where it’s held</div>
                <h2>Account allocation</h2>
              </div>
              <span className="year-badge">{new Date().getFullYear()}</span>
            </div>
            <div className="allocation-bar" aria-label={allocationLabel}>
              <span style={{ width: `${heldShare}%` }} />
            </div>
            <div className="balance-list">
              <div className="balance-row">
                <span className="balance-name"><i className="legend-dot held" />Held by me<small>Awaiting transfer</small></span>
                <strong>{formatRM(summary.heldByMeSen)}</strong>
              </div>
              <div className="balance-row">
                <span className="balance-name"><i className="legend-dot sspn" />SSPN account<small>Transfers + dividends</small></span>
                <strong>{formatRM(summary.sspnBalanceSen)}</strong>
              </div>
            </div>
          </article>
        </section>
        <section className="section-head">
          <div>
            <div className="eyebrow">Ledger</div>
            <h2>Recent activity</h2>
            <p>
              {history.length
                ? `${history.length} ${history.length === 1 ? "entry" : "entries"}, newest first`
                : "Transactions will appear here"}
            </p>
          </div>
          {history.length > 0 && (
            <Button className="secondary-btn section-add-btn" onClick={openNew}>
              <Plus size={16} aria-hidden="true" /> Add
            </Button>
          )}
        </section>
        <section className="transaction-list">
          {history.length === 0 ? (
            <div className="empty">
              <Sprout size={34} strokeWidth={1.8} aria-hidden="true" />
              <h3>No transactions yet</h3>
              <p>Add the first gift or SSPN entry to begin the ledger.</p>
              <Button className="add-btn" onClick={openNew}>
                Add first transaction
              </Button>
            </div>
          ) : (
            history.map((t) => (
              <article className="transaction-row" key={t.id}>
                <div
                  className={`transaction-icon ${t.type === "sspn_transfer" ? "transfer" : t.type === "sspn_dividend" ? "dividend" : ""}`}
                >
                  {t.type === "gift_received" ? (
                    <Gift size={18} aria-hidden="true" />
                  ) : t.type === "sspn_transfer" ? (
                    <Landmark size={18} aria-hidden="true" />
                  ) : (
                    <Sparkles size={18} aria-hidden="true" />
                  )}
                </div>
                <div className="transaction-main">
                  <div className="transaction-title">
                    {transactionLabels[t.type]}
                  </div>
                  <div className="transaction-meta">
                    {new Date(
                      `${t.transactionDate}T00:00:00`,
                    ).toLocaleDateString("en-MY", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {t.dividendYear
                      ? ` · ${t.dividendYear} dividend${t.dividendRateBps ? ` at ${(t.dividendRateBps / 100).toFixed(2)}%` : ""}`
                      : ""}
                    {t.note ? ` · ${t.note}` : ""}
                  </div>
                </div>
                <div className="transaction-amount">
                  {formatRM(t.amountSen)}
                </div>
                <div className="transaction-actions">
                  <Button
                    aria-label={`Edit ${transactionLabels[t.type]}`}
                    onClick={() => openEdit(t)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    <span className="action-label">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Delete ${transactionLabels[t.type]}`}
                    onClick={() => remove(t.id)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    <span className="action-label">Delete</span>
                  </Button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setModalOpen(false)
          }
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="modal-head">
              <div>
                <div className="eyebrow">Ledger entry</div>
                <h2 id="form-title" style={{ marginTop: 5 }}>
                  {editing ? "Edit transaction" : "Add transaction"}
                </h2>
              </div>
              <Button
                className="close"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
              >
                ×
              </Button>
            </div>
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="type">What happened?</label>
                <Select.Root
                  value={form.type}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      type: value as TransactionType,
                      dividendYear: "",
                      dividendRate: "",
                    })
                  }
                >
                  <Select.Trigger
                    className="select-trigger"
                    aria-label="What happened?"
                  >
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown size={16} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      className="select-content"
                      position="popper"
                    >
                      <Select.Viewport>
                        <Select.Item
                          className="select-item"
                          value="gift_received"
                        >
                          <Select.ItemText>Gift received</Select.ItemText>
                        </Select.Item>
                        <Select.Item
                          className="select-item"
                          value="sspn_transfer"
                        >
                          <Select.ItemText>
                            Transferred into SSPN
                          </Select.ItemText>
                        </Select.Item>
                        <Select.Item
                          className="select-item"
                          value="sspn_dividend"
                        >
                          <Select.ItemText>SSPN dividend</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="amount">Amount (RM)</label>
                  <input
                    id="amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="date">Date</label>
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <Button
                        type="button"
                        className="date-trigger"
                        aria-label="Choose transaction date"
                      >
                        <CalendarDays size={16} />
                        {new Date(`${form.date}T00:00:00`).toLocaleDateString(
                          "en-MY",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </Button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        className="calendar-content"
                        align="end"
                        sideOffset={8}
                      >
                        <DayPicker
                          mode="single"
                          selected={new Date(`${form.date}T00:00:00`)}
                          onSelect={(date) => {
                            if (date)
                              setForm({
                                ...form,
                                date: date.toISOString().slice(0, 10),
                              });
                          }}
                          required
                        />
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </div>
              </div>
              {form.type === "sspn_dividend" && (
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="year">
                      Dividend year{" "}
                      <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                        (optional)
                      </span>
                    </label>
                    <input
                      id="year"
                      inputMode="numeric"
                      placeholder="2025"
                      value={form.dividendYear}
                      onChange={(e) =>
                        setForm({ ...form, dividendYear: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="rate">
                      Rate %{" "}
                      <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                        (optional)
                      </span>
                    </label>
                    <input
                      id="rate"
                      inputMode="decimal"
                      placeholder="4.05"
                      value={form.dividendRate}
                      onChange={(e) =>
                        setForm({ ...form, dividendRate: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
              <div className="field">
                <label htmlFor="note">
                  Note{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  id="note"
                  placeholder="A little context for future you"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <div className="modal-footer">
                <Button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="add-btn">
                  {editing ? "Save changes" : "Add to ledger"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
      <AlertDialog.Root open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="alert-overlay" />
          <AlertDialog.Content className="alert-content">
            <AlertDialog.Title className="alert-title">
              Log out?
            </AlertDialog.Title>
            <AlertDialog.Description className="alert-description">
              You’ll need to sign in again to view Amanda’s savings.
            </AlertDialog.Description>
            <div className="alert-actions">
              <AlertDialog.Cancel asChild>
                <Button className="secondary-btn">Stay signed in</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="danger"
                  className="danger-btn"
                  onClick={() => void signOut()}
                >
                  Log out
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <AlertDialog.Root
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="alert-overlay" />
          <AlertDialog.Content className="alert-content">
            <AlertDialog.Title className="alert-title">
              Delete this entry?
            </AlertDialog.Title>
            <AlertDialog.Description className="alert-description">
              This removes the transaction from Amanda’s ledger and cannot be
              undone.
            </AlertDialog.Description>
            <div className="alert-actions">
              <AlertDialog.Cancel asChild>
                <Button className="secondary-btn">Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="danger"
                  className="danger-btn"
                  onClick={confirmDelete}
                >
                  Delete entry
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}

export default App;
