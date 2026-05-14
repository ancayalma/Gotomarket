"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error("Please enter a new password");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/resetPasswordWithToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (response.ok) {
        setDone(true);
        toast.success("Password reset successfully!");
        setTimeout(() => {
          router.push("/sign-in");
        }, 3000);
      } else {
        const err = await response.text();
        toast.error(err || "Failed to reset password");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full">
        <Card className="shadow-lg w-full max-w-md mx-auto bg-transparent border-border/40 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
            <div className="p-4 bg-emerald-500/10 rounded-full">
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-center">Password Reset Successfully</h2>
            <p className="text-sm text-muted-foreground text-center">
              Your password has been updated. Redirecting to login...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <Card className="shadow-lg w-full max-w-md mx-auto bg-transparent border-border/40 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
            Set New Password
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter your new password below to complete the reset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white">New Password</label>
              <div className="flex items-center w-full">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password…"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
                <button
                  type="button"
                  className="flex px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-white">Confirm Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your new password…"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {password && (
              <div className="text-xs space-y-1 px-1">
                <div className={`flex items-center gap-1.5 ${password.length >= 8 ? "text-emerald-400" : "text-gray-500"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${password.length >= 8 ? "bg-emerald-400" : "bg-gray-600"}`} />
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-1.5 ${confirmPassword && password === confirmPassword ? "text-emerald-400" : "text-gray-500"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${confirmPassword && password === confirmPassword ? "bg-emerald-400" : "bg-gray-600"}`} />
                  Passwords match
                </div>
              </div>
            )}

            <div className="grid gap-2 pt-4">
              <Button
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                type="submit"
                className="flex gap-2 h-12"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{loading ? "Resetting…" : "Reset Password"}</span>
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                type="button"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => router.push("/sign-in")}
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
