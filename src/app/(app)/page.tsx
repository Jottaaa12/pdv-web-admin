"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Esta página apenas redireciona para o dashboard
export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Redirecionando...
    </div>
  );
}
