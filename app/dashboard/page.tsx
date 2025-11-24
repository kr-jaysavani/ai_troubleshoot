import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import ChatInterface from "@/components/chat-interface";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatInterface userId={data.user.id} />
    </div>
  );
}
