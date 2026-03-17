import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileText, Briefcase, BookOpen, Settings, LogOut, Globe } from "lucide-react";
import { headers } from "next/headers";

export const metadata = {
    title: "BasaltCRM Admin",
    description: "Content Management System",
};

export default async function AdminLayout({
    children,
}: {
    children: any;
}) {
    return (
        <div className="min-h-screen flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
