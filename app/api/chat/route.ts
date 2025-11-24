import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, prompt, imageUrl } = await request.json();

    if (!sessionId || !userId || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Save user message to database
    const { data: userMessage, error: userMsgError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: "user",
        content: prompt,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Build the AI prompt with image context if provided
    let systemPrompt = `You are TechHelper, an AI expert for troubleshooting device and equipment issues. 
You help users diagnose and fix problems with routers, computers, phones, and other electronic devices.
When users share images, carefully analyze them to identify potential issues like:
- Unplugged cables or power adapters
- Switches in wrong positions
- LED indicator issues
- Connection problems
- Physical damage or misalignment
- Incorrect settings or configurations

Provide clear, step-by-step advice to resolve issues. Be friendly and patient.`;

    let userPrompt = prompt;
    if (imageUrl) {
      userPrompt = `I'm having a device issue and here's an image for reference. The image shows: [Image URL: ${imageUrl}]\n\nMy issue: ${prompt}\n\nPlease analyze the image and provide troubleshooting advice.`;
    }

    // Generate AI response using Vercel AI SDK
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: userPrompt,
    });

    // Save AI response to database
    const { data: aiMessage, error: aiMsgError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: "assistant",
        content: text,
      })
      .select()
      .single();

    if (aiMsgError) throw aiMsgError;

    // Update session's updated_at timestamp
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    return NextResponse.json({
      userMessage,
      aiResponse: aiMessage,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
