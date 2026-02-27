import { LoginComponent } from "./components/LoginComponent";
import { ThemedLogo } from "@/components/ThemedLogo";

const SignInPage = async () => {
  return (
    <div className="h-full">
      <div className="py-8 sm:py-10 flex flex-wrap items-center justify-center gap-3 px-4">
        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">Welcome to</h1>
        <ThemedLogo variant="wide" className="h-8 sm:h-10 md:h-12 w-auto" />
      </div>
      <div>
        <LoginComponent />
      </div>
    </div>
  );
};

export default SignInPage;
