import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "./thirdweb";
import { sha256 } from "thirdweb/utils";

// Derive a deterministic private key from the secret key for signing JWTs.
// In production, use a dedicated admin wallet private key instead.
const secretHex = (
  process.env.THIRDWEB_SECRET_KEY
    ? sha256(process.env.THIRDWEB_SECRET_KEY as `0x${string}`)
    : "0x0000000000000000000000000000000000000000000000000000000000000001"
) as `0x${string}`;

const adminAccount = privateKeyToAccount({
  client,
  privateKey: secretHex,
});

const domain =
  process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "localhost:3000";

export const thirdwebAuth = createAuth({
  domain,
  adminAccount,
  client,
  login: {
    statement: "Sign in to BasaltCRM",
    uri: typeof window !== "undefined" ? window.location.origin : `https://${domain}`,
    resources: [`https://${domain}`],
    version: "1",
  },
});
