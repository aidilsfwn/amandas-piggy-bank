import { Bank, Gift, PencilSimple, PiggyBank, Plus, Sparkle, Trash } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { formatRM, transactionLabels, type SavingsTransaction } from "../domain";
import { Button } from "./ui/button";

type TransactionListProps = {
  transactions: SavingsTransaction[];
  onAdd: () => void;
  onEdit: (transaction: SavingsTransaction) => void;
  onDelete: (id: string) => void;
};

const iconFor = (type: SavingsTransaction["type"]) => {
  if (type === "gift_received") return <Gift size={22} weight="duotone" />;
  if (type === "sspn_transfer") return <Bank size={22} weight="duotone" />;
  return <Sparkle size={22} weight="duotone" />;
};

export function TransactionList({ transactions, onAdd, onEdit, onDelete }: TransactionListProps) {
  return (
    <section className="ledgerSection" aria-labelledby="activity-title">
      <div className="ledgerHeading">
        <div><span className="softLabel">The ledger</span><h2 id="activity-title">Recent activity</h2><p>{transactions.length ? "Newest entries appear first." : "Your savings story starts here."}</p></div>
        {transactions.length > 0 && <Button tone="soft" onClick={onAdd}><Plus size={18} weight="bold" />Add</Button>}
      </div>

      {transactions.length === 0 ? (
        <motion.div className="emptyLedger" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="emptyPig"><PiggyBank size={54} weight="duotone" /></span>
          <h3>No transactions yet</h3>
          <p>Add Amanda’s first gift or SSPN entry to begin her ledger.</p>
          <Button onClick={onAdd}>Add the first one</Button>
        </motion.div>
      ) : (
        <div className="entryList">
          <AnimatePresence initial={false}>
            {transactions.map((transaction, index) => (
              <motion.article
                className={`ledgerEntry ledgerEntry--${transaction.type}`}
                key={transaction.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 21, delay: Math.min(index * 0.035, 0.18) }}
              >
                <span className="entryIcon">{iconFor(transaction.type)}</span>
                <div className="entryDetails">
                  <div className="entryTitleLine"><h3>{transactionLabels[transaction.type]}</h3><span className="typeTag">{transaction.type === "gift_received" ? "Gift" : transaction.type === "sspn_transfer" ? "Transfer" : "Dividend"}</span></div>
                  <p>
                    {new Date(`${transaction.transactionDate}T00:00:00`).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                    {transaction.dividendYear ? ` · ${transaction.dividendYear} dividend${transaction.dividendRateBps ? ` at ${(transaction.dividendRateBps / 100).toFixed(2)}%` : ""}` : ""}
                    {transaction.note ? ` · ${transaction.note}` : ""}
                  </p>
                </div>
                <motion.strong className={`entryAmount ${transaction.type === "sspn_transfer" ? "entryAmount--transfer" : "entryAmount--credit"}`} key={transaction.updatedAt} initial={{ scale: 1 }} animate={{ scale: [1, 1.08, 1] }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
                  {formatRM(transaction.amountSen)}
                </motion.strong>
                <div className="entryActions">
                  <Button tone="quiet" aria-label={`Edit ${transactionLabels[transaction.type]}`} onClick={() => onEdit(transaction)}><PencilSimple size={19} weight="bold" /></Button>
                  <Button tone="danger" aria-label={`Delete ${transactionLabels[transaction.type]}`} onClick={() => onDelete(transaction.id)}><Trash size={19} weight="bold" /></Button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
