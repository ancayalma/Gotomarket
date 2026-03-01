import { ThemedLogo } from "@/components/ThemedLogo";
import { ResetPasswordForm } from "./ResetPasswordForm";

const ResetPasswordPage = async (props: { params: Promise<{ token: string }> }) => {
    const params = await props.params;
    const token = params.token;

    return (
        <div className="h-full">
            <div className="flex justify-center mt-10 mb-8 pt-8">
                <ThemedLogo variant="wide" className="h-[50px] w-auto" />
            </div>
            <div>
                <ResetPasswordForm token={token} />
            </div>
        </div>
    );
};

export default ResetPasswordPage;
