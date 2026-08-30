import { DownloadSimple, Plus, SignOut } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { formatRM, type SavingsSummary } from "../domain";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { BrandMark } from "./BrandMark";
import { Button } from "./ui/button";

type DashboardProps = {
  owner: string;
  summary: SavingsSummary;
  transactionCount: number;
  onAdd: () => void;
  onExport: () => void;
  onLogout: () => void;
};

export function Dashboard({ owner, summary, transactionCount, onAdd, onExport, onLogout }: DashboardProps) {
  const heldShare = summary.totalBelongingSen
    ? Math.max(0, Math.min(100, (summary.heldByMeSen / summary.totalBelongingSen) * 100))
    : 0;
  const date = new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <header className="appHeader">
        <a className="appIdentity" href="#top" aria-label="Amanda's Piggy Bank home">
          <BrandMark size="small" />
          <span>Amanda's Piggy Bank</span>
        </a>
        <div className="headerTools">
          <Button tone="soft" aria-label="Export CSV" onClick={onExport}><DownloadSimple size={19} weight="bold" /><span className="buttonText">Export CSV</span></Button>
          <Button tone="quiet" className="accountControl" aria-label={`Sign out ${owner}`} onClick={onLogout}>
            <span className="ownerInitial">A</span><span className="ownerEmail">{owner}</span><SignOut size={19} weight="bold" />
          </Button>
        </div>
      </header>

      <section className="pageIntro" id="top">
        <div>
          <span className="softLabel">Savings overview</span>
          <h1>Amanda’s growing fund</h1>
          <p>Everything accounted for as of {date}.</p>
        </div>
        <Button onClick={onAdd}><Plus size={20} weight="bold" />Add transaction</Button>
      </section>

      <section className="balanceStage" aria-label="Savings balances">
        <motion.article className="heroBalance" initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 18, duration: 0.38 }}>
          <div className="balanceGlow" aria-hidden="true" />
          <div className="heroBalanceTop">
            <span>Total savings</span>
            <span className="entryCount">{transactionCount} {transactionCount === 1 ? "entry" : "entries"}</span>
          </div>
          <div className="heroAmount"><AnimatedCurrency valueSen={summary.totalBelongingSen} /></div>
          <p>Belonging to Amanda</p>
          <div className="heroBreakdown">
            <div><span>Gifts received</span><strong>{formatRM(summary.giftsReceivedSen)}</strong></div>
            <div><span>Dividends earned</span><strong>{formatRM(summary.sspnDividendsSen)}</strong></div>
          </div>
        </motion.article>

        <motion.article className="allocationCard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.1 }}>
          <div className="cardHeading">
            <div><span className="softLabel">Where it lives</span><h2>Money allocation</h2></div>
            <span className="yearPill">{new Date().getFullYear()}</span>
          </div>
          <div className="allocationTrack" aria-label={summary.totalBelongingSen ? `${heldShare.toFixed(0)}% held by me and ${(100 - heldShare).toFixed(0)}% in SSPN` : "No savings recorded yet"}>
            <motion.span initial={{ width: 0 }} animate={{ width: `${heldShare}%` }} transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.2 }} />
          </div>
          <div className="allocationRows">
            <div><span><i className="dot dot--pink" />Held by me<small>Ready for the next transfer</small></span><strong>{formatRM(summary.heldByMeSen)}</strong></div>
            <div><span><i className="dot dot--blue" />In SSPN<small>Transfers and dividends</small></span><strong>{formatRM(summary.sspnBalanceSen)}</strong></div>
          </div>
        </motion.article>
      </section>
    </>
  );
}
