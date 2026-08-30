import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence } from "motion/react";
import "react-day-picker/style.css";
import "./App.css";
import { AuthScreen } from "./components/AuthScreen";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Dashboard } from "./components/Dashboard";
import { TransactionForm, type TransactionDraft } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { calculateSummary, parseAmountToSen, sortTransactions, validateTransaction, type SavingsTransaction } from "./domain";
import { exportCsv } from "./storage";
import { deleteRemoteTransaction, fetchRemoteTransactions, saveRemoteTransaction, supabase } from "./supabase";

const today = new Date().toISOString().slice(0, 10);
const emptyDraft = (): TransactionDraft => ({ type: "gift_received", amount: "", date: today, dividendYear: "", dividendRate: "", note: "" });

function App() {
  const [owner, setOwner] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [draft, setDraft] = useState<TransactionDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const summary = useMemo(() => calculateSummary(transactions), [transactions]);
  const history = useMemo(() => sortTransactions(transactions), [transactions]);

  useEffect(() => {
    if (!formOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setFormOpen(false);
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", escape); };
  }, [formOpen]);

  useEffect(() => {
    if (!supabase) return;
    const load = async (session: Session) => {
      setUserId(session.user.id);
      setOwner(session.user.email ?? "Owner");
      try { setTransactions(await fetchRemoteTransactions()); }
      catch (reason) {
        const failure = reason as { message?: string; code?: string };
        setError(`Could not load synced transactions${failure.code ? ` (${failure.code})` : ""}: ${failure.message ?? "Unknown error"}`);
      }
    };
    void supabase.auth.getSession().then(({ data }) => data.session && void load(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.setTimeout(() => void load(session), 0);
      else setUserId(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const syncTransactions = async (next: SavingsTransaction[], changed?: SavingsTransaction, removed?: string) => {
    try {
      if (userId && changed) await saveRemoteTransaction(userId, changed);
      if (userId && removed) await deleteRemoteTransaction(userId, removed);
      setTransactions(userId ? await fetchRemoteTransactions() : next);
      setError("");
      return true;
    } catch (reason) {
      const failure = reason as { message?: string; code?: string; details?: string };
      setError(`Sync failed${failure.code ? ` (${failure.code})` : ""}: ${failure.message ?? failure.details ?? "Check your Supabase permissions and try again."}`);
      return false;
    }
  };

  const openNew = () => { setDraft(emptyDraft()); setEditingId(null); setError(""); setFormOpen(true); };
  const openEdit = (transaction: SavingsTransaction) => {
    setDraft({
      type: transaction.type,
      amount: (transaction.amountSen / 100).toFixed(2),
      date: transaction.transactionDate,
      dividendYear: String(transaction.dividendYear ?? ""),
      dividendRate: transaction.dividendRateBps ? (transaction.dividendRateBps / 100).toFixed(2) : "",
      note: transaction.note ?? "",
    });
    setEditingId(transaction.id);
    setError("");
    setFormOpen(true);
  };

  const submitTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const current = editingId ? transactions.find((transaction) => transaction.id === editingId) : undefined;
    const validation = validateTransaction(draft, summary, current?.type === "sspn_transfer" ? current.amountSen : 0);
    if (validation) { setError(validation); return; }
    const now = new Date().toISOString();
    const item: SavingsTransaction = {
      id: editingId ?? crypto.randomUUID(),
      type: draft.type,
      amountSen: parseAmountToSen(draft.amount)!,
      transactionDate: draft.date,
      dividendYear: draft.type === "sspn_dividend" && draft.dividendYear ? Number(draft.dividendYear) : undefined,
      dividendRateBps: draft.type === "sspn_dividend" && draft.dividendRate ? Math.round(Number(draft.dividendRate) * 100) : undefined,
      note: draft.note.trim() || undefined,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    const next = editingId ? transactions.map((transaction) => transaction.id === editingId ? item : transaction) : [item, ...transactions];
    if (await syncTransactions(next, item)) setFormOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    void syncTransactions(transactions.filter((transaction) => transaction.id !== deleteId), undefined, deleteId);
    setDeleteId(null);
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) { setAuthMessage("Supabase is not configured for this deployment."); return; }
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) { setAuthMessage(signInError?.message ?? "Could not sign in."); return; }
    setOwner(data.user.email ?? email);
    setUserId(data.user.id);
    try { setTransactions(await fetchRemoteTransactions()); }
    catch (reason) {
      const failure = reason as { message?: string; code?: string };
      setError(`Could not load synced transactions${failure.code ? ` (${failure.code})` : ""}: ${failure.message ?? "Unknown error"}`);
    }
    setAuthMessage("");
  };

  const resetPassword = async () => {
    const email = window.prompt("Enter your account email");
    if (!email || !supabase) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setResetMessage(resetError?.message ?? "Check your email for a password reset link.");
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setOwner(null); setUserId(null); setTransactions([]);
  };

  if (!owner) return <AuthScreen configured={Boolean(supabase)} authMessage={authMessage} resetMessage={resetMessage} onSignIn={signIn} onResetPassword={resetPassword} />;

  return (
    <main className="appCanvas">
      <div className="appFrame">
        <Dashboard owner={owner} summary={summary} transactionCount={history.length} onAdd={openNew} onExport={() => exportCsv(history)} onLogout={() => setLogoutOpen(true)} />
        {error && !formOpen && <div className="feedback feedback--error pageFeedback" role="status">{error}</div>}
        <TransactionList transactions={history} onAdd={openNew} onEdit={openEdit} onDelete={setDeleteId} />
      </div>
      <AnimatePresence>{formOpen && <TransactionForm draft={draft} editing={Boolean(editingId)} summary={summary} error={error} onChange={(nextDraft) => { setDraft(nextDraft); setError(""); }} onSubmit={(event) => void submitTransaction(event)} onClose={() => setFormOpen(false)} />}</AnimatePresence>
      <ConfirmDialog open={logoutOpen} title="Sign out for now?" description="You’ll need to sign in again to view Amanda’s savings." confirmLabel="Sign out" cancelLabel="Stay signed in" onOpenChange={setLogoutOpen} onConfirm={() => void signOut()} />
      <ConfirmDialog open={deleteId !== null} title="Delete this entry?" description="This removes the transaction from Amanda’s ledger and cannot be undone." confirmLabel="Delete entry" cancelLabel="Keep entry" onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={confirmDelete} />
    </main>
  );
}

export default App;
