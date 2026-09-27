import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "./_components/login-view";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
