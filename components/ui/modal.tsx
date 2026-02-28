"use client";

import { DialogTitle } from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "./dialog";

interface ModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function Modal({
  title,
  description,
  isOpen,
  onClose,
  children,
}: ModalProps) {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
