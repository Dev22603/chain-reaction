import Link from "next/link";
import { Home } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center px-4 py-16 sm:px-8">
      <Card className="mx-auto grid w-[min(560px,100%)] gap-8 overflow-hidden p-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
        <div className="grid gap-3 text-center">
          <h1 className="font-display text-7xl text-primary sm:text-8xl">404</h1>
          <p className="font-display text-xl text-fg sm:text-2xl">Page not found</p>
          <p className="mx-auto max-w-sm text-sm font-semibold leading-relaxed text-fg-muted">
            This page doesn&apos;t exist. Head back home and start a new game.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="btn-secondary game-btn-shadow inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
          >
            <Home size={14} aria-hidden="true" />
            Back to home
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-line bg-surface px-5 py-3 text-sm font-semibold text-fg-soft transition hover:border-secondary hover:text-secondary-deep"
          >
            Leaderboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
