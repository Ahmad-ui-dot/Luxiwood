import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.auth.register.title };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
