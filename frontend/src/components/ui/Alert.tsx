
import { AlertTriangle, WifiOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

interface AlertProps {
  type?: "error" | "status" | "info";
  message: string;
  className?: string;
  icon?: boolean;
}

export function Alert({ type = "error", message, className, icon = true }: AlertProps) {
  const styles = {
    error: "border-p1/50 bg-p1/5 text-p1",
    status: "border-p1/50 bg-p1/5 text-p1", // Disconnected state
    info: "border-cherenkov/40 bg-cherenkov/5 text-cherenkov"
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 border px-4 py-3 text-sm [animation:panel-rise_0.4s_ease-out_both]",
        styles[type],
        className
      )}
    >
      {icon && type === "error" && <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />}
      {icon && type === "status" && <WifiOff size={16} aria-hidden="true" className="mt-0.5 shrink-0" />}
      {icon && type === "info" && <Sparkles size={14} aria-hidden="true" className="mt-0.5 shrink-0" />}
      <span className="font-mono leading-relaxed">{message}</span>
    </div>
  );
}
