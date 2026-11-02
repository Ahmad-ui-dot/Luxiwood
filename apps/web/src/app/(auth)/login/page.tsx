import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.auth.login.title };
}

export default function LoginPage() {
  return <LoginForm />;
}
