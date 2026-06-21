import { ReactNode } from "react";


interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  theme?: Theme;
  children: ReactNode;
}

export function PageLayout({ title, subtitle, icon, theme = "blue", children }: PageLayoutProps) {
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
