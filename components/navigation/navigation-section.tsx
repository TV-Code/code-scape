"use client";

interface NavigationSectionProps {
  title: string;
  children: React.ReactNode;
}

export function NavigationSection({ title, children }: NavigationSectionProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground px-2">{title}</h2>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}