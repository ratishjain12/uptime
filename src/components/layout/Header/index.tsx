"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { Hexagon } from "lucide-react";
import Link from "next/link";

const Header = () => {
  const { data: session, isPending } = authClient.useSession();
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <span className="flex gap-2 items-center">
          <Hexagon className="h-9 w-9" />
          <Link href="/" className="text-lg font-semibold tracking-tight">
            uptime
          </Link>
        </span>

        <nav className="flex items-center gap-4 text-sm text-secondary">
          <Link href="#features" className="text-secondary-foreground">
            Features
          </Link>
          {isPending ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ) : session ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-foreground px-3 py-1.5 text-background"
            >
              Dashboard
            </Link>
          ) : (
            <Button
              className="rounded-md bg-foreground px-3 py-1.5 text-background"
              onClick={async () =>
                authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/dashboard",
                })
              }
            >
              Get Started
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
