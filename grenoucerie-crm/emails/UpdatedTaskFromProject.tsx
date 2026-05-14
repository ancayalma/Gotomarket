import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VercelInviteUserEmailProps {
  taskFromUser: string;
  username: string;
  userLanguage: string;
  taskData: any;
  boardData: any;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const UpdatedTaskFromProject = ({
  taskFromUser,
  username,
  userLanguage,
  taskData,
  boardData,
}: VercelInviteUserEmailProps) => {
  const previewText = `New task from ${process.env.NEXT_PUBLIC_APP_NAME} app`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              There is a updated task from Project - {boardData.title} module
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {username},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{taskFromUser}</strong> has updated a task and assigned to you.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Details you can find here:
              <strong>{`${process.env.NEXT_PUBLIC_APP_URL}/campaigns/tasks/viewtask/${taskData.id}`}</strong>
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-slate-800 rounded-md text-white  py-3 px-4 text-[12px] font-semibold no-underline text-center"
                href={`${process.env.NEXT_PUBLIC_APP_URL}/campaigns/tasks/viewtask/${taskData.id}`}
              >
                View task detail
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This message was intended for -
              <span className="text-black">{username}</span>.
              <span className="text-black"></span>.
              If you were not expecting this message, you can ignore this email. If you are concerned about your account&apos;s safety, please reply to this email to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default UpdatedTaskFromProject;
