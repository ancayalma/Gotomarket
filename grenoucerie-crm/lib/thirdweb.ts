import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "";

if (!clientId && process.env.NODE_ENV !== "production") {
  console.warn(
    "⚠️ Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID environment variable. " +
    "Get one at https://thirdweb.com/dashboard"
  );
}

// Pass a dummy string if missing to prevent build-time crashes during page data collection
export const client = createThirdwebClient({ 
  clientId: clientId || "bypassed_for_build" 
});
