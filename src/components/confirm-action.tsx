"use client";

import type { ReactNode } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function ConfirmAction({ trigger, title, description, actionLabel, onConfirm }: { trigger: ReactNode; title: string; description: string; actionLabel: string; onConfirm: () => void | Promise<void> }) {
  return <AlertDialog><AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction onClick={() => void onConfirm()}>{actionLabel}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
