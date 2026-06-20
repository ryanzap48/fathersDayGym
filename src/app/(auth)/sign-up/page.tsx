import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Start training</h1>
      <p className="mb-8 text-sm text-muted">Create an account to log your first set.</p>
      <AuthForm mode="sign-up" />
    </>
  );
}
