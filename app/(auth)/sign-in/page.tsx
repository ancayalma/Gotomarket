import { LoginComponent } from "./components/LoginComponent";
import { ThemedLogo } from "@/components/ThemedLogo";

const SignInPage = async () => {
  return (
    <div className="w-full flex flex-col items-center justify-start">
      <div className="pb-4 flex flex-col items-center justify-center gap-2 px-4">
        <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed px-10 text-center py-1">
          Welcome to
        </h1>
        <ThemedLogo
          variant="wide"
          className="h-14 sm:h-20 md:h-24 w-auto drop-shadow-2xl"
        />
      </div>
      <div className="w-full max-w-md sm:max-w-lg">
        <LoginComponent />
      </div>
    </div>
  );
};

export default SignInPage;
