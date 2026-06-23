import { ReactNode } from "react";

type Theme =
  | "blue" | "purple" | "green" | "orange" | "pink"
  | "teal" | "red" | "indigo" | "cyan" | "violet";

const THEMES: Record<Theme, { grad: string; ring: string; icon: string }> = {
  blue:   { grad: "from-blue-500 to-cyan-500",       ring: "ring-blue-200",   icon: "bg-blue-50 text-blue-600" },
  purple: { grad: "from-purple-500 to-fuchsia-500",  ring: "ring-purple-200", icon: "bg-purple-50 text-purple-600" },
  green:  { grad: "from-emerald-500 to-green-500",   ring: "ring-emerald-200",icon: "bg-emerald-50 text-emerald-600" },
  orange: { grad: "from-orange-500 to-amber-500",    ring: "ring-orange-200", icon: "bg-orange-50 text-orange-600" },
  pink:   { grad: "from-pink-500 to-rose-500",       ring: "ring-pink-200",   icon: "bg-pink-50 text-pink-600" },
  teal:   { grad: "from-teal-500 to-cyan-500",       ring: "ring-teal-200",   icon: "bg-teal-50 text-teal-600" },
  red:    { grad: "from-red-500 to-rose-500",        ring: "ring-red-200",    icon: "bg-red-50 text-red-600" },
  indigo: { grad: "from-indigo-500 to-blue-500",     ring: "ring-indigo-200", icon: "bg-indigo-50 text-indigo-600" },
  cyan:   { grad: "from-cyan-500 to-sky-500",        ring: "ring-cyan-200",   icon: "bg-cyan-50 text-cyan-600" },
  violet: { grad: "from-violet-500 to-purple-500",   ring: "ring-violet-200", icon: "bg-violet-50 text-violet-600" },
};

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  theme?: Theme;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageLayout({ title, subtitle, icon, theme = "blue", actions, children }: PageLayoutProps) {
  const t = THEMES[theme] ?? THEMES.blue;
  return (
    <div className="flex-1 flex flex-col min-h-full bg-background">
      <header className={`border-b bg-gradient-to-r ${t.grad} text-white`}>
        <div className="px-6 py-5 flex items-center gap-4">
          {icon && (
            <div className={`w-11 h-11 rounded-xl ${t.icon} flex items-center justify-center ring-4 ${t.ring} shadow-sm`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-sm text-white/85 truncate">{subtitle}</p>}
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default PageLayout;
