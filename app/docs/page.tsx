import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DocsPage() {
    // Fetch the first article (ordered by 'order')
    const firstDoc = await prismadb.docArticle.findFirst({
        orderBy: [
            { category: 'asc' },
            { order: 'asc' }
        ]
    });

    if (firstDoc) {
        redirect(`/docs/${firstDoc.slug}`);
    }

    // Fallback if no docs exist
    return (
        <div className="p-10 text-center text-gray-400">
            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">Documentation</h1>
            <p>No documentation articles found.</p>
        </div>
    );
}
