import { Card } from "@/components/ui/card";
import Image from "next/image";

interface ChatMessageProps {
  message: {
    role: "user" | "assistant";
    content: string;
    image_url?: string;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Card
        className={`max-w-xl p-4 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {message.image_url && (
          <div className="mb-3 relative w-full h-48">
            <Image
              src={message.image_url || "/placeholder.svg"}
              alt="Uploaded image"
              fill
              className="object-cover rounded"
            />
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </Card>
    </div>
  );
}
