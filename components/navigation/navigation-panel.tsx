"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Settings,
  Code2,
  GitBranch,
  FolderTree
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

export default function NavigationPanel() {
  const [activeTab, setActiveTab] = useState<string>("files");

  const navItems: NavItem[] = [
    { icon: FolderTree, label: "Files" },
    { icon: Layers, label: "Architecture" },
    { icon: Code2, label: "Analysis" },
    { icon: GitBranch, label: "Git" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-[60px] border-r bg-background flex flex-col items-center py-4 gap-2">
      <TooltipProvider delayDuration={0}>
        {navItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-10 h-10",
                  activeTab === item.label.toLowerCase() &&
                    "bg-muted hover:bg-muted"
                )}
                onClick={() => setActiveTab(item.label.toLowerCase())}
              >
                <item.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-0">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}