import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  username?: string;
  avatar?: string | null;
  email: string;
  resetLink: string;
  userLanguage: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const PasswordResetEmail = ({
  username,
  avatar,
  email,
  resetLink,
  userLanguage,
}: PasswordResetEmailProps) => {
  const previewText = `Password reset from ${process.env.NEXT_PUBLIC_APP_NAME}`;

  // Only use HTTP(S) avatar URLs - never inline base64 (causes Gmail clipping)
  const safeAvatar =
    avatar && avatar.startsWith("http")
      ? avatar
      : `${baseUrl}/images/nouser.png`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif", margin: "0 auto" }}>
        <Container style={{ border: "1px solid #eaeaea", borderRadius: "8px", margin: "40px auto", padding: "20px", maxWidth: "465px" }}>
          <Section style={{ textAlign: "center", marginTop: "16px" }}>
            <Img
              src={safeAvatar}
              width="50"
              height="50"
              alt="User Avatar"
              style={{ margin: "0 auto", borderRadius: "50%", display: "block" }}
            />
          </Section>
          <Heading style={{ color: "#000", fontSize: "24px", fontWeight: "normal", textAlign: "center", padding: "0", margin: "30px 0" }}>
            Password reset for: <strong>{username}</strong>
          </Heading>
          <Text style={{ color: "#000", fontSize: "14px", lineHeight: "24px" }}>
            Hello {username},
          </Text>
          <Text style={{ color: "#000", fontSize: "14px", lineHeight: "24px" }}>
            A password reset was requested for your account.
          </Text>
          <Text style={{ color: "#000", fontSize: "14px", lineHeight: "24px" }}>
            Your username: <strong>{email}</strong>
          </Text>
          <Text style={{ color: "#000", fontSize: "14px", lineHeight: "24px" }}>
            Click the following link to securely reset your password:
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Link
              href={resetLink}
              style={{
                backgroundColor: "#0ea5e9",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                display: "inline-block",
              }}
            >
              Reset Password
            </Link>
          </Section>
          <Text style={{ color: "#666", fontSize: "12px", lineHeight: "20px" }}>
            Or copy this link: <Link href={resetLink} style={{ color: "#0ea5e9" }}>{resetLink}</Link>
          </Text>
          <Text style={{ color: "#666", fontSize: "12px", lineHeight: "20px" }}>
            This link expires in 15 minutes. If you did not request this reset, please ignore this email.
          </Text>
          <Hr style={{ border: "1px solid #eaeaea", margin: "26px 0", width: "100%" }} />
          <Text style={{ color: "#999", fontSize: "12px", textAlign: "center" as const }}>
            {process.env.NEXT_PUBLIC_APP_NAME} &middot;{" "}
            <Link href={baseUrl} style={{ color: "#999" }}>
              {baseUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;
