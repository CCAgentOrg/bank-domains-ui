import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react";

interface DiffStatsProps {
  leftTag: string;
  rightTag: string;
  leftCount: number;
  rightCount: number;
  added: number;
  removed: number;
  changed: number;
}

export function DiffStats({ leftTag, rightTag, leftCount, rightCount, added, removed, changed }: DiffStatsProps) {
  const net = added - removed;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs font-medium text-muted-foreground mb-1">{leftTag}</div>
        <div className="text-2xl font-bold">{leftCount.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">domains</div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-1.5">
          <ArrowUp className="size-4 text-green-600" />
          <span className="text-xs font-medium text-muted-foreground">Added</span>
        </div>
        <div className="text-2xl font-bold text-green-600">{added.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">new domains</div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-1.5">
          <ArrowDown className="size-4 text-red-600" />
          <span className="text-xs font-medium text-muted-foreground">Removed</span>
        </div>
        <div className="text-2xl font-bold text-red-600">{removed.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">domains gone</div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-1.5">
          <RefreshCw className="size-4 text-amber-600" />
          <span className="text-xs font-medium text-muted-foreground">Changed</span>
        </div>
        <div className="text-2xl font-bold text-amber-600">{changed.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">probe results changed</div>
      </div>
    </div>
  );
}
