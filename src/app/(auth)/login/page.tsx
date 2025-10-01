"use client";

import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Hexagon } from "lucide-react";
import { GoogleIcon } from "@/assets/Icons";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({ provider: "google" });
  };

  if (isPending || session) {
    return null;
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <Hexagon width={100} height={100} />
          <h1 className="text-2xl font-semibold tracking-tight">Uptime</h1>
          <p className="text-sm text-muted-foreground">
            Monitor downtime with instant alerts
          </p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          className="gap-2 bg-accent-foreground"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>
    </div>
  );
};

export default Page;
