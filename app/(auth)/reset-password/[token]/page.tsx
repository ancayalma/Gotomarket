import { ThemedLogo } from "@/components/ThemedLogo";
import { ResetPasswordForm } from "./ResetPasswordForm";

const ResetPasswordPage = async (props: { params: Promise<{ token: string }> }) => {
    const params = await props.params;
    const token = params.token;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full px-4">
            <div className="flex justify-center mb-8">
                <ThemedLogo variant="wide" className="h-[50px] w-auto" />
            </div>
            <ResetPasswordForm token={token} />
        </div>
    );
};

export default ResetPasswordPage;
