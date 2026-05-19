import Link from "next/link";
import { Home, Zap } from "lucide-react";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center px-4 py-16 sm:px-8">
      <Card className="mx-auto grid w-[min(560px,100%)] gap-8 overflow-hidden p-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
        <CardCorners />
        <div className="grid gap-3 text-center">
          <CardEyebrow>// fission error</CardEyebrow>
          <Zap className="mx-auto text-reactor" size={40} aria-hidden="true" />
          <h1 className="font-display text-7xl uppercase tracking-[0.08em] text-uranium sm:text-8xl">
            404
          </h1>
          <p className="font-display text-xl uppercase tracking-[0.06em] text-fg sm:text-2xl">
            This reactor&apos;s offline
          </p>
          <p className="mx-auto max-w-sm font-mono text-xs leading-relaxed text-fg-muted">
            The page you tried to reach has decayed past containment. Head back to the lobby and start a fresh reaction.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-cherenkov/60 bg-cherenkov/10 px-5 py-3 font-mono text-xs uppercase tracking-[0.28em] text-cherenkov transition hover:bg-cherenkov/20"
          >
            <Home size={14} aria-hidden="true" />
            Back to home
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center gap-2 border border-line bg-bg-soft px-5 py-3 font-mono text-xs uppercase tracking-[0.28em] text-fg-muted transition hover:border-reactor/60 hover:text-reactor"
          >
            Leaderboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
