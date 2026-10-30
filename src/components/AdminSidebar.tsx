"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, ShieldAlert, Terminal, 
  Flag, ListFilter, Clock, FileSpreadsheet, Bell 
} from "lucide-react";
import AudioAlertToggle from "./AudioAlert";

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { label: "Live Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Disciplinary Monitoring", href: "/admin/disciplinary", icon: ShieldAlert, highlight: true },
    { label: "Team Management", href: "/admin/teams", icon: Users },
    { label: "Lab Monitoring", href: "/admin/labs", icon: Terminal },
    { label: "Flag Submissions", href: "/admin/submissions", icon: Flag },
    { label: "Timer & Event Control", href: "/admin/settings", icon: Clock },
    { label: "Reports & Exports", href: "/admin/reports", icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-cyber-border bg-cyber-card p-4 flex flex-col justify-between shrink-0 font-mono text-xs">
      <div className="space-y-4">
        <div className="pb-3 border-b border-cyber-border flex items-center justify-between">
          <div>
            <span className="font-bold text-cyber-neon uppercase tracking-wider block">
              CONTROL MATRIX
            </span>
            <span className="text-[10px] text-cyber-muted">Admin Directorate</span>
          </div>
          <AudioAlertToggle />
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-cyber-bg text-cyber-neon border border-cyber-neon/40 shadow-sm font-bold"
                    : link.highlight
                    ? "text-cyber-amber hover:bg-cyber-amber/10 hover:text-cyber-amber border border-cyber-amber/30"
                    : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-bg/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${link.highlight && !isActive ? 'text-cyber-amber' : ''}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-cyber-border text-[10px] text-cyber-muted">
        <span>SECURITY LEVEL: </span>
        <span className="text-cyber-blue font-bold">SUPER_ADMIN</span>
      </div>
    </aside>
  );
}
