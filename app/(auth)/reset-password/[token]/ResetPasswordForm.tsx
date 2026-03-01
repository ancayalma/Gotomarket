"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export const ResetPasswordForm = ({ token }: { token: string }) => {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error("Please enter a new password");
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
                toast.success("Password reset successfully. Redirecting to login...");
                setTimeout(() => {
                    router.push("/sign-in");
                }, 2000);
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

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <form onSubmit={handleReset} className="w-full max-w-sm flex flex-col gap-4 border p-6 rounded shadow bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-2">Set New Password</h2>

                <label className="text-sm font-medium">New Password</label>
                <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded border-zinc-300 dark:border-zinc-700 bg-transparent"
                />

                <button
                    disabled={loading}
                    type="submit"
                    className="mt-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>
            </form>
        </div>
    );
};
