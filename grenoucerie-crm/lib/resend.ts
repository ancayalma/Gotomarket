import { Resend } from "resend";
import { prismadb } from "./prisma";
import { decryptSecret } from "./encryption";

export default async function resendHelper() {
  const resendKey = await prismadb.systemServices.findFirst({
    where: {
      name: "resend_smtp",
    },
  });

  const key =
    process.env.RESEND_API_KEY || (resendKey?.serviceKey ? decryptSecret(resendKey.serviceKey) : null);
  if (!key) {
    return null as any;
  }
  const resend = new Resend(key);

  return resend;
}
