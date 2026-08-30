import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "./ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, onOpenChange, onConfirm }: ConfirmDialogProps) {
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="dialogBackdrop" />
      <AlertDialog.Content className="confirmCard">
        <span className="warningIcon"><WarningCircle size={28} weight="duotone" /></span>
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>{description}</AlertDialog.Description>
        <div className="confirmActions"><AlertDialog.Cancel asChild><Button tone="soft">{cancelLabel}</Button></AlertDialog.Cancel><AlertDialog.Action asChild><Button tone="danger" onClick={onConfirm}>{confirmLabel}</Button></AlertDialog.Action></div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}
