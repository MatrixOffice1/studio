import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Scissors className="h-7 w-7 text-primary" />
      <div className="flex flex-col">
        <span className="font-headline text-xl font-bold leading-none text-foreground">
          Abbaglia
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Nails & Beauty
        </span>
      </div>
    </div>
  );
}
