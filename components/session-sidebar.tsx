"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SessionSidebarProps {
  sessions: Session[];
  currentSession: Session | null;
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
  reloadSession: () => void;
}

export default function SessionSidebar({
  sessions,
  currentSession,
  onSelectSession,
  onNewSession,
  reloadSession,
}: SessionSidebarProps) {
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(sessionId);
    try {
      await supabase.from("chat_sessions").delete().eq("id", sessionId);
      reloadSession();
    } finally {
      setIsDeleting(null);
    }
    if (currentSession?.id === sessionId) {
      onNewSession();
    }
  };

  return (
    <div className="w-64 border-r bg-sidebar flex flex-col h-full">
      {/* New Session Button */}
      <div className="p-4 border-b">
        <Button
          onClick={onNewSession}
          className="w-full justify-center gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sessions?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No sessions yet
          </p>
        ) : (
          sessions?.map((session) => (
            <div
              key={session.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${
                currentSession?.id === session.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
            >
              <div
                onClick={() => onSelectSession(session)}
                className="flex-1 text-left text-sm font-medium truncate"
              >
                {session.title}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session.id);
                }}
                disabled={isDeleting === session.id}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-destructive-foreground transition-all"
              >
                <Trash2 className="h-4 w-4 hover:text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
