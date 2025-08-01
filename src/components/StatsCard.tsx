import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function StatsCard({ title, value, change, changeType, icon: Icon, className }: StatsCardProps) {
  return (
    <Card className={cn("border-0 shadow-sm hover:shadow-md transition-shadow duration-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            <p className={cn(
              "text-sm mt-1 flex items-center",
              changeType === "positive" ? "text-success" : 
              changeType === "negative" ? "text-destructive" : 
              "text-muted-foreground"
            )}>
              {change}
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            changeType === "positive" ? "bg-success/10" : 
            changeType === "negative" ? "bg-destructive/10" : 
            "bg-muted/50"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              changeType === "positive" ? "text-success" : 
              changeType === "negative" ? "text-destructive" : 
              "text-muted-foreground"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}