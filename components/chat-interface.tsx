"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ChatMessage from "@/components/chat-message";
import FileUploader from "@/components/file-uploader";
import SessionSidebar from "@/components/session-sidebar";
import { Send, Menu, LogOut, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function ChatInterface({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploadedImage, setUploadedImage] = useState<{
    url: string;
    file: File;
  } | null>(null);

  const { data: sessions, mutate: reloadSession } = useSWR(
    ["sessions", userId],
    async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });
      return data || [];
    }
  );

  // Load messages when session changes
  useEffect(() => {
    if (!currentSession) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", currentSession.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };

    loadMessages();
  }, [currentSession, supabase]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewSession = async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert([
        {
          user_id: userId,
          title: "New Troubleshooting Session",
        },
      ])
      .select()
      .single();

    if (!error && data) {
      return data;
    }
    console.error("Error creating session:", error);
    return null;
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setMessages([]);
    setUploadedImage(null);
  };

  const handleImageUpload = (file: File, url: string) => {
    setUploadedImage({ url, file });
  };
  const handleImageRemove = () => {
    setUploadedImage(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !uploadedImage) return;
    let sessionId = currentSession?.id;
    if (!sessionId) {
      const data = await createNewSession();
      if (data) {
        sessionId = data.id;
        setCurrentSession(data);
      } else {
        return;
      }
    }

    setIsLoading(true);

    try {
      // Send user message to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          userId,
          prompt: input,
          imageUrl: uploadedImage?.url,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      const { userMessage, aiResponse } = await response.json();

      // Update UI with messages
      setMessages((prev) => [...prev, userMessage, aiResponse]);
      setInput("");
      setUploadedImage(null);

      // Update session title if first message
      if (messages.length === 0) {
        await supabase
          .from("chat_sessions")
          .update({ title: input.slice(0, 50) })
          .eq("id", sessionId);
        reloadSession();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {showSidebar && (
        <SessionSidebar
          sessions={sessions || []}
          currentSession={currentSession}
          onSelectSession={setCurrentSession}
          onNewSession={handleNewSession}
          reloadSession={reloadSession}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Troubleshoot Assistant</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {
            // !currentSession
            // ? (
            //   <div className="flex items-center justify-center h-full">
            //     <Card className="p-8 text-center max-w-md">
            //       <h2 className="text-2xl font-bold mb-2">
            //         Start Troubleshooting
            //       </h2>
            //       <p className="text-muted-foreground mb-6">
            //         Create a new session to begin analyzing your device issues
            //       </p>
            //       <Button onClick={handleNewSession} size="lg" className="w-full">
            //         New Session
            //       </Button>
            //     </Card>
            //   </div>
            // )
            // :
            !currentSession || messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Troubleshoot Assistant
                  </h2>
                  <p className="text-gray-600">
                    Describe your issue and upload an image if needed. I'll help
                    you diagnose and fix the problem.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
            )
          }
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-card p-4">
          {
            <form onSubmit={handleSendMessage} className="space-y-3">
              <FileUploader
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImage}
                handleImageRemove={handleImageRemove}
              />

              <div className="flex gap-3">
                <Input
                  placeholder="Describe your issue or ask for help..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !uploadedImage)}
                  className="px-6"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⟳</span> Analyzing...
                    </span>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  );
}
