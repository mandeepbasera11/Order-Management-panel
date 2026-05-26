import { Construction } from "lucide-react";

export function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-muted-foreground mt-2">
          {description ?? "This module is part of DmTire Hub and is being prepared."}
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-card p-16 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Construction className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Coming soon</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          The {title} workspace is wired into the navigation. Tell us what fields and
          actions you want here and we'll build it out.
        </p>
      </div>
    </div>
  );
}