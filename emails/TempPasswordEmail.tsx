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
    Tailwind,
    Text,
} from "@react-email/components";
import * as React from "react";

interface TempPasswordEmailProps {
    username?: string;
    avatar?: string | null;
    email: string;
    password?: string;
    userLanguage?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crm.basalthq.com";

export const TempPasswordEmail = ({
    username,
    avatar,
    email,
    password,
}: TempPasswordEmailProps) => {
    const previewText = `Temporary password for ${process.env.NEXT_PUBLIC_APP_NAME}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={avatar || `${baseUrl}/images/nouser.png`}
                                width="50"
                                height="50"
                                alt="User Avatar"
                                className="my-0 mx-auto rounded-full"
                            />
                        </Section>
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Temporary password for: <strong>{username}</strong>
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {username},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            An administrator has reset your password. Here is your temporary password:
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Your username: <strong>{email}</strong>
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Temporary password: <strong>{password}</strong>
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Please login to{" "}
                            <Link
                                href={baseUrl}
                                className="text-blue-500 underline"
                            >
                                {baseUrl}
                            </Link>
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Thank you, {process.env.NEXT_PUBLIC_APP_NAME}
                        </Text>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default TempPasswordEmail;
