"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Code2,
  GitBranch,
  Layers,
  Settings,
  FolderTree
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NavBar() {
  const [activeTab, setActiveTab] = useState('files');

  const navItems = [
    { icon: FolderTree, label: 'Files' },
    { icon: Layers, label: 'Architecture' },
    { icon: GitBranch, label: 'Dependencies' },
    { icon: Code2, label: 'Analysis' },
    { icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="w-[60px] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col items-center py-4 space-y-4">
        {navItems.map((item) => (
          <Button
            key={item.label}
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
            <span className="sr-only">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}