import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  text?: string;
  className?: string;
}

export const Loader = ({ text = "Loading...", className }: LoaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full h-full min-h-[200px] bg-slate-50/50 backdrop-blur-sm space-y-4",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-blue-200 blur-md animate-pulse" />

        <Loader2 className="relative z-10 size-10 animate-spin text-blue-600" />
      </div>

      <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>
    </div>
  );
};
