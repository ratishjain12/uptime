"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";

const Hero = () => {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const handleGoogleSignIn = async () => {
    try {
      if (!session) {
        await authClient.signIn.social({
          provider: "google",
          callbackURL: "/dashboard",
        });
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to sign in with Google", error);
    }
  };

  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background" />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-5 text-center sm:gap-8">
        <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur sm:text-sm">
          Instant incident alerts
        </span>

        <h1 className="text-pretty text-[2rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[3rem] sm:leading-[1.05]">
          Know when your site slows, before customers do.
        </h1>

        <p className="max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Real-time checks, SLA tracking, and instant email or Slack alerts the
          moment anything drifts.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-2 text-base font-medium text-background shadow-sm transition hover:bg-foreground/90"
          >
            Get Started
          </button>

          <Link
            href="#features"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2 text-base font-medium text-foreground transition hover:border-foreground"
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
