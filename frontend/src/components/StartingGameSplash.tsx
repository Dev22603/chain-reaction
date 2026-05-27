import { Card, CardCorners } from "@/components/ui/card";

export function StartingGameSplash() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-surface">
      <Card className="grid w-[min(420px,90vw)] gap-4 p-10 text-center [animation:panel-rise_0.5s_ease-out_both]">
        <CardCorners />
        <h1 className="font-display text-4xl tracking-tight text-fg">
          Starting game
          <span className="ml-1 inline-block animate-[blink-cursor_1s_steps(1)_infinite] text-cherenkov">
            _
          </span>
        </h1>
      </Card>
    </div>
  );
}
