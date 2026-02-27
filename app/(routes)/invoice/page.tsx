import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getInvoices } from "@/actions/invoice/get-invoices";
import { getAccountSettings } from "@/actions/invoice/get-account-settings";

import { columns } from "./data-table/columns";
import { InvoiceDataTable } from "./data-table/data-table";

import Container from "../components/ui/Container";

import ModalDropzone from "./components/modal-dropzone";
import { MyAccountSettingsForm } from "./components/MyAccountSettingsForm";

import { Button } from "@/components/ui/button";
import RightViewModal from "@/components/modals/right-view-modal";
import { MyAccount } from "@prisma/client";
import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";
import NewTaskDialog from "./dialogs/NewTask";
import { LearnLink } from "@/components/ui/LearnLink";

import { SyncInvoiceCard } from "./components/SyncInvoiceCard";
import { ManualInvoiceDialog } from "./dialogs/ManualInvoiceDialog";

import { UploadCloud, FileText, Settings, Loader2 } from "lucide-react";

const CardContent = ({ card, loading = false }: { card: any, loading?: boolean }) => (
  <div className="group relative w-full p-3 overflow-hidden transition-all duration-300 bg-background border border-border hover:border-primary/50 rounded-2xl h-[110px] cursor-pointer">
    {/* Giant Watermark Icon - Positioned Right */}
    <card.icon
      className={`absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-all duration-700 pointer-events-none opacity-10 group-hover:opacity-50 group-hover:scale-125 group-hover:-rotate-0 group-hover:text-primary ${card.iconColor}`}
    />

    <div className="relative z-10 w-full h-full flex flex-col items-start pl-1 justify-center">
      <h3 className="font-black text-[11px] uppercase tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent py-0.5 px-2 leading-tight mb-0.5">
        {card.title}
      </h3>
      <span className="block text-xl font-bold tracking-tight text-foreground mt-0.5 px-2">
        {card.description}
      </span>
    </div>

    {/* Subtle Glow on Hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
  </div>
);

const InvoicePage = async () => {
  const session = await getServerSession(authOptions);
  const invoices: any = await getInvoices();
  const myAccountSettings: MyAccount | null = await getAccountSettings();
  const users = await getActiveUsers();
  const boards = await getBoards(session?.user.id!);

  const cards = [
    {
      title: "Upload PDF",
      description: "Upload new invoice",
      icon: UploadCloud,
      color: "from-cyan-500/20 to-sky-500/20",
      iconColor: "text-cyan-400",
      type: "upload"
    },
    {
      title: "My Invoices",
      description: "View my invoice history",
      icon: FileText,
      color: "from-blue-500/20 to-indigo-500/20",
      iconColor: "text-blue-400",
      type: "link",
      href: `/invoice/${session?.user.id}`
    },
    {
      title: "Sync Invoices",
      description: "Check for new invoices",
      icon: Loader2, // Replaced by custom trigger logic
      color: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400",
      type: "cron"
    },
    {
      title: "Settings",
      description: "Company invoice settings",
      icon: Settings,
      color: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-400",
      type: "settings"
    }
  ];



  return (
    <Container
      title="Invoices"
      description={"Everything you need to know about invoices and TAX"}
      sticky
    >
      <LearnLink
        tab="invoice"
        overviewTitle="Financial Operations"
        overviewWhat="The core clearinghouse for all accounts receivable and tax-related documentation. It tracks the movement of money from quotes to finalized settlements."
        overviewWhy="Accuracy in finance is non-negotiable. This module ensures every invoice is accounted for, providing a clear audit trail for both internal bookkeeping and external tax reporting."
        overviewHow="Upload PDF invoices directly into the ledger, sync with your external ERP systems, or use the Manual Invoice dialog to create one-off billing statements."
      />
      <NewTaskDialog users={users} boards={boards} />

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3 flex-shrink-0">

        {/* Create Manual Invoice */}
        <ManualInvoiceDialog />

        {/* Upload PDF Card */}
        <ModalDropzone
          buttonLabel="Upload pdf"
          customTrigger={<CardContent card={cards[0]} />}
        />

        {/* My Invoices Link Card */}
        <Link href={cards[1].href!} className="block h-full">
          <CardContent card={cards[1]} />
        </Link>

        {/* Sync Cron Card */}
        {(() => {
          const { icon, ...syncCardProps } = cards[2];
          return <SyncInvoiceCard card={syncCardProps} />;
        })()}

        {/* Settings Card */}
        <RightViewModal
          customTrigger
          label={<CardContent card={cards[3]} />}
          title="Your company settings"
          description="This data will be used as default values for your invoices. You can change them at any time. Very important is to set account email which will receive files for import to ERPs"
          width={"w-[900px]"}
        >
          <MyAccountSettingsForm initialData={myAccountSettings} />
        </RightViewModal>
      </div>

      <div>
        <InvoiceDataTable data={invoices} columns={columns} />
      </div>
    </Container>
  );
};

export default InvoicePage;
