import { Construction } from "lucide-react";

// This component is shown ONLY for pages that are genuinely not built yet.
// Dashboard, Executive Dashboard, and all main pages have real components.
export function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-indigo-400" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        {description ?? "This module is coming soon and will be built out shortly."}
      </p>
    </div>
  );
}
