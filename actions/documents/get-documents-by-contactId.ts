import { prismadb } from "@/lib/prisma";

export const getDocumentsByContactId = async (contactId: string) => {
  const data = await prismadb.documents.findMany({
    where: {
      contactsIDs: {
        has: contactId,
      },
    },
    select: {
      id: true,
      title: true,
      document_url: true,
      document_name: true,
      document_mime: true,
      document_size: true,
      date_created: true,
      created_by: { select: { name: true } },
      assigned_to_user: { select: { name: true } },
    },
    orderBy: {
      date_created: "desc",
    },
  });
  return data;
};
