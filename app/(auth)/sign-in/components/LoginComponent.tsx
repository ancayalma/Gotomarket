"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  Eye,
  EyeOff,
  Smartphone,
  Fingerprint,
  Loader2,
  ShieldCheck,
  Lock,
  KeyRound
} from "lucide-react";
import axios from "axios";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import LoadingComponent from "@/components/LoadingComponent";

export function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);
  //State for dialog to be by opened and closed by DialogTrigger
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [mfaStep, setMfaStep] = useState<"login" | "verify">("login");
  const [mfaMethod, setMfaMethod] = useState<string | null>(null);
  const [availableMfaMethods, setAvailableMfaMethods] = useState<string[]>([]);
  const [mfaCode, setMfaCode] = useState("");
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const dashboardPath = `/dashboard`;
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("loggedOut")) {
      toast({
        description: "You have been logged out.",
      });
    }
  }, [searchParams, toast]);

  const formSchema = z.object({
    email: z.string().min(3).max(50),
    password: z.string().min(8).max(50),
  });

  type LoginFormValues = z.infer<typeof formSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signIn("google", {
        callbackUrl: dashboardPath,
        //callbackUrl: "/",
      });
    } catch (error) {
      console.log(error, "error");
      toast({
        variant: "destructive",
        description:
          "Something went wrong while logging with your Google account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGitHub = async () => {
    setIsLoading(true);
    try {
      await signIn("github", {
        callbackUrl: dashboardPath,
        //callbackUrl: "/",
      });
    } catch (error) {
      console.log(error, "error");
      toast({
        variant: "destructive",
        description:
          "Something went wrong while logging with your Google account.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const loginWithMicrosoft = async () => {
    setIsLoading(true);
    try {
      await signIn("azure-ad", {
        callbackUrl: dashboardPath,
      });
    } catch (error) {
      console.log(error, "error");
      toast({
        variant: "destructive",
        description:
          "Something went wrong while logging with your Microsoft account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  //Login with username(email)/password
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      setEmail(normalizedEmail); // Store for MFA fallback if needed

      const status = await signIn("credentials", {
        redirect: false,
        email: normalizedEmail,
        password: data.password,
        callbackUrl: process.env.NEXT_PUBLIC_APP_URL,
      });

      if (status?.error) {
        const msg = status.error as string;

        // Catch MFA Required signal — format: MFA_REQUIRED:PRIMARY_METHOD:AVAILABLE_METHODS
        if (msg.startsWith("MFA_REQUIRED:")) {
          const parts = msg.split(":");
          const primaryMethod = parts[1];
          const available = parts[2] ? parts[2].split(",") : [primaryMethod];
          setAvailableMfaMethods(available);
          setMfaMethod(primaryMethod);
          setMfaStep("verify");

          // Only auto-trigger WebAuthn if it's the SOLE method (no TOTP fallback)
          if (primaryMethod === "WEBAUTHN" && available.length === 1) {
            triggerWebAuthn(normalizedEmail);
          }
          return;
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: msg,
        });

        if (typeof msg === "string" && msg.toLowerCase().includes("no password is set")) {
          setOpen(true);
        }
      }
      if (status?.ok) {
        toast({ description: "Login successful." });
        router.replace(dashboardPath);
      }
    } catch (error: any) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during login.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function triggerWebAuthn(email: string) {
    setIsLoading(true);
    try {
      // 1. Get auth options from backend
      const res = await axios.post("/api/auth/mfa/webauthn/auth-options", { email });
      const options = res.data;

      // 2. Trigger browser biometric prompt
      // v13: startAuthentication expects { optionsJSON }
      const asseResp = await startAuthentication({ optionsJSON: options });

      // 3. Verify with backend
      const verifyRes = await axios.post("/api/auth/mfa/webauthn/auth-verify", {
        body: asseResp,
        currentOptions: options,
        email
      });

      if (verifyRes.data.success) {
        // 4. Finalize login with NextAuth using the mfaToken
        const status = await signIn("credentials", {
          redirect: false,
          email,
          password: form.getValues().password,
          mfaToken: verifyRes.data.mfaToken,
          callbackUrl: dashboardPath,
        });

        if (status?.ok) {
          toast({ description: "Biometric login successful." });
          router.replace(dashboardPath);
        } else {
          throw new Error("Final authentication failed");
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Biometric verification failed. Please use your authenticator app code instead."
      });
      setMfaMethod("TOTP"); // Fallback to TOTP if WebAuthn fails
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMfaVerify() {
    setIsLoading(true);
    try {
      const status = await signIn("credentials", {
        redirect: false,
        email,
        password: form.getValues().password,
        mfaCode: mfaCode,
        callbackUrl: dashboardPath,
      });

      if (status?.error) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "The verification code is incorrect."
        });
      } else {
        toast({ description: "Login successful." });
        router.replace(dashboardPath);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify MFA code."
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onPasswordReset(email: string) {
    try {
      setIsLoading(true);
      await axios.post("/api/user/passwordReset", {
        email,
      });
      toast({
        title: "Success",
        description: "Password reset email has been sent.",
      });
    } catch (error) {
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong while resetting the password.",
        });
      }
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  }

  return (
    <Card className="shadow-lg my-5 w-full max-w-md sm:max-w-lg mx-auto bg-transparent border-border/40 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Login</CardTitle>
        <CardDescription className="text-gray-300">Click here to login with: </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {mfaStep === "login" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button variant="outline" onClick={loginWithGitHub} className="px-0">
                <Icons.gitHub className="mr-2 h-4 w-4" />
                Github
              </Button>
              <Button
                variant="outline"
                onClick={loginWithGoogle}
                disabled={isLoading}
                className="px-0"
              >
                {isLoading ? (
                  <Icons.google className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}{" "}
                Google
              </Button>
              <Button
                variant="outline"
                onClick={loginWithMicrosoft}
                disabled={isLoading}
                className="px-0"
              >
                <Icons.microsoft className="mr-2 h-4 w-4" />
                Microsoft
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">E-mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            spellCheck={false}
                            disabled={isLoading}
                            placeholder="name@company.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center w-full ">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input
                              className="w-full"
                              autoComplete="current-password"
                              disabled={isLoading}
                              placeholder="Enter your password…"
                              type={showPassword ? "text" : "password"}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <button
                      type="button"
                      className="flex px-4 pt-7 w-16 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showPassword ? <EyeOff size={25} className="text-gray-400" /> : <Eye size={25} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 py-8">
                  <Button
                    disabled={isLoading}
                    type="submit"
                    className="flex gap-2 h-12"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{isLoading ? "Signing in…" : "Sign In"}</span>
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-full mb-2">
                {mfaMethod === "WEBAUTHN" ? <Fingerprint className="h-8 w-8 text-primary" /> : <Smartphone className="h-8 w-8 text-primary" />}
              </div>
              <h3 className="text-xl font-bold">Two-Step Verification</h3>
              <p className="text-sm text-gray-400">
                {mfaMethod === "WEBAUTHN"
                  ? "Verify your identity using biometrics or a security key."
                  : "Enter the 6-digit code from your authenticator app."}
              </p>
            </div>

            <div className="space-y-4">
              {mfaMethod === "TOTP" ? (
                <>
                  <Input
                    placeholder="000 000"
                    className="text-center text-2xl font-mono tracking-[0.5em] h-14 bg-white/5 border-white/10"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="Verification code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                  <Button
                    className="w-full h-12"
                    onClick={handleMfaVerify}
                    disabled={isLoading || mfaCode.length !== 6}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Verify & Login
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full h-12 gap-2"
                  onClick={() => triggerWebAuthn(email)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
                  Start Biometric Verification
                </Button>
              )}

              {/* Method switcher */}
              {availableMfaMethods.length > 1 && (
                <Button
                  variant="outline"
                  className="w-full text-xs gap-2 border-white/10 hover:bg-white/5"
                  onClick={() => {
                    const altMethod = mfaMethod === "TOTP" ? "WEBAUTHN" : "TOTP";
                    setMfaMethod(altMethod);
                    setMfaCode("");
                    if (altMethod === "WEBAUTHN") {
                      triggerWebAuthn(email);
                    }
                  }}
                  disabled={isLoading}
                >
                  {mfaMethod === "TOTP" ? (
                    <><Fingerprint className="h-4 w-4" /> Use Passkey Instead</>
                  ) : (
                    <><Smartphone className="h-4 w-4" /> Use Authenticator Instead</>
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full text-xs text-gray-500 hover:text-white"
                onClick={() => {
                  setMfaStep("login");
                  setMfaCode("");
                  setAvailableMfaMethods([]);
                }}
              >
                Back to credentials
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-2 pb-4">
        <Link href="/register" className="w-full">
          <Button variant="outline" className="w-full h-10 text-sm font-medium border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-colors">
            Need an account? <span className="text-primary ml-1 font-semibold">Register</span>
          </Button>
        </Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground hover:text-primary transition-colors">
              <KeyRound className="w-3.5 h-3.5 mr-1.5" />
              Forgot your password?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Password Reset</DialogTitle>
              <DialogDescription className="p-5">
                Enter your email address and we will send new password to your
                e-mail.
              </DialogDescription>
            </DialogHeader>
            {isLoading ? (
              <LoadingComponent />
            ) : (
              <div className="flex px-2 space-x-5 py-5">
                <Input
                  id="reset-email"
                  name="reset-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@domain.com"
                  aria-label="Email for password reset"
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  disabled={email === ""}
                  onClick={() => {
                    onPasswordReset(email);
                  }}
                >
                  Reset
                </Button>
              </div>
            )}
            <DialogTrigger asChild>
              <Button variant={"destructive"} className="w-full mt-5">
                Cancel
              </Button>
            </DialogTrigger>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
