import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { BrandMark } from "./BrandMark";
import { Button } from "./ui/button";

type AuthScreenProps = {
  configured: boolean;
  authMessage: string;
  resetMessage: string;
  onSignIn: (email: string, password: string) => Promise<void>;
  onResetPassword: () => Promise<void>;
};

export function AuthScreen({ configured, authMessage, resetMessage, onSignIn, onResetPassword }: AuthScreenProps) {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    await onSignIn(String(data.get("email") ?? "").trim(), String(data.get("password") ?? ""));
    setSubmitting(false);
  };

  return (
    <main className="welcomeView">
      <motion.section className="welcomeStory" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="welcomeBrand">
          <BrandMark />
          <span>Amanda's Piggy Bank</span>
        </div>
        <div className="welcomeMessage">
          <span className="softLabel">A little ledger for a growing future</span>
          <h1>Every gift has<br />a place to grow.</h1>
          <p>Keep Amanda’s gifts, SSPN savings, and dividends together in one warm, simple record.</p>
        </div>
        <div className="floatingCoins" aria-hidden="true"><i /><i /><i /></div>
      </motion.section>

      <section className="welcomeAccess">
        <motion.div className="signInCard" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.08 }}>
          <span className="softLabel">Welcome back</span>
          <h2>Open Amanda’s ledger</h2>
          <p>{configured ? "Sign in to see the latest savings record." : "Connect Supabase to use this private ledger."}</p>
          <form onSubmit={submit} className="formStack">
            <label className="fieldGroup">
              <span>Email address</span>
              <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </label>
            <label className="fieldGroup">
              <span className="fieldLabelRow">
                <span>Password</span>
                <Button tone="quiet" className="inlineAction" onClick={() => void onResetPassword()}>Forgot password?</Button>
              </span>
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <Button type="submit" className="fullButton" disabled={submitting}>{submitting ? "Opening ledger…" : "Sign in"}</Button>
          </form>
          {authMessage && <div className="feedback feedback--error" role="status">{authMessage}</div>}
          {resetMessage && <div className="feedback" role="status">{resetMessage}</div>}
        </motion.div>
      </section>
    </main>
  );
}
