import React from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";

type FormSheetProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  position?: "left" | "right" | "top" | "bottom";
  trigger?: string;
  customTrigger?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: React.RefObject<HTMLButtonElement | null> | null;
};

const FormSheet = ({
  open,
  setOpen,
  position,
  trigger,
  customTrigger,
  title,
  description,
  children,
  onClose,
}: FormSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild ref={onClose}>
        {customTrigger ? (
          <div className="cursor-pointer">{customTrigger}</div>
        ) : (
          <Button className="mb-5 " size={"sm"}>
            {trigger}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side={position || "right"}>
        <SheetHeader>
          <SheetTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
};

export default FormSheet;
