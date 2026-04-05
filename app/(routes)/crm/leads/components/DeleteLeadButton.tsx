"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import AlertModal from "@/components/modals/alert-modal";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/crm/leads/${leadId}`);
      toast.success("Lead entirely wiped");
      router.push("/crm/leads");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete lead");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9"
      >
        <Trash2 className="h-4 w-4" />
        Wipe Lead
      </Button>
    </>
  );
}
