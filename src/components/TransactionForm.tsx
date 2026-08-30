import * as Popover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";
import { CalendarBlank, CaretDown, Check, X } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { DayPicker } from "react-day-picker";
import type { FormEvent } from "react";
import { formatRM, type SavingsSummary, type TransactionType } from "../domain";
import { Button } from "./ui/button";

export type TransactionDraft = {
  type: TransactionType;
  amount: string;
  date: string;
  dividendYear: string;
  dividendRate: string;
  note: string;
};

type TransactionFormProps = {
  draft: TransactionDraft;
  editing: boolean;
  summary: SavingsSummary;
  error: string;
  onChange: (draft: TransactionDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

const choices: Array<{ value: TransactionType; label: string }> = [
  { value: "gift_received", label: "Gift received" },
  { value: "sspn_transfer", label: "Transferred into SSPN" },
  { value: "sspn_dividend", label: "SSPN dividend" },
];

export function TransactionForm({ draft, editing, summary, error, onChange, onSubmit, onClose }: TransactionFormProps) {
  return (
    <motion.div className="sheetBackdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section className="entrySheet" role="dialog" aria-modal="true" aria-labelledby="entry-form-title" initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}>
        <div className="sheetHeading">
          <div><span className="softLabel">Ledger entry</span><h2 id="entry-form-title">{editing ? "Edit transaction" : "Add transaction"}</h2><p>{editing ? "Update the details and keep the record accurate." : "Choose what happened and add it to Amanda’s savings."}</p></div>
          <Button tone="quiet" className="iconButton" aria-label="Close transaction form" onClick={onClose}><X size={21} weight="bold" /></Button>
        </div>

        <form className="entryForm" onSubmit={onSubmit}>
          <label className="fieldGroup">
            <span>What happened?</span>
            <Select.Root value={draft.type} onValueChange={(value) => onChange({ ...draft, type: value as TransactionType, dividendYear: "", dividendRate: "" })}>
              <Select.Trigger className="selectControl" aria-label="Transaction type"><Select.Value /><Select.Icon><CaretDown size={18} weight="bold" /></Select.Icon></Select.Trigger>
              <Select.Portal>
                <Select.Content className="selectMenu" position="popper" sideOffset={8}>
                  <Select.Viewport>
                    {choices.map((choice) => <Select.Item className="selectOption" value={choice.value} key={choice.value}><Select.ItemText>{choice.label}</Select.ItemText><Select.ItemIndicator><Check size={16} weight="bold" /></Select.ItemIndicator></Select.Item>)}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </label>

          <div className="formPair">
            <label className="fieldGroup"><span>Amount (RM)</span><input inputMode="decimal" placeholder="0.00" value={draft.amount} onChange={(event) => onChange({ ...draft, amount: event.target.value })} /></label>
            <label className="fieldGroup"><span>Date</span>
              <Popover.Root>
                <Popover.Trigger asChild><Button tone="soft" className="dateControl"><CalendarBlank size={19} weight="duotone" />{new Date(`${draft.date}T00:00:00`).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</Button></Popover.Trigger>
                <Popover.Portal><Popover.Content className="calendarPopover" align="end" sideOffset={8}><DayPicker mode="single" selected={new Date(`${draft.date}T00:00:00`)} onSelect={(date) => date && onChange({ ...draft, date: date.toISOString().slice(0, 10) })} required /></Popover.Content></Popover.Portal>
              </Popover.Root>
            </label>
          </div>

          {draft.type === "sspn_transfer" && <div className="availableNote"><span>Available to transfer</span><strong>{formatRM(summary.heldByMeSen)}</strong></div>}

          {draft.type === "sspn_dividend" && <motion.div className="formPair" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
            <label className="fieldGroup"><span>Dividend year <small>optional</small></span><input inputMode="numeric" placeholder="2026" value={draft.dividendYear} onChange={(event) => onChange({ ...draft, dividendYear: event.target.value })} /></label>
            <label className="fieldGroup"><span>Rate % <small>optional</small></span><input inputMode="decimal" placeholder="4.05" value={draft.dividendRate} onChange={(event) => onChange({ ...draft, dividendRate: event.target.value })} /></label>
          </motion.div>}

          <label className="fieldGroup"><span>Note <small>optional</small></span><textarea placeholder="A little context for future you" value={draft.note} onChange={(event) => onChange({ ...draft, note: event.target.value })} /></label>
          {error && <div className="feedback feedback--error" role="alert">{error}</div>}
          <div className="sheetActions"><Button tone="soft" onClick={onClose}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Add to ledger"}</Button></div>
        </form>
      </motion.section>
    </motion.div>
  );
}
