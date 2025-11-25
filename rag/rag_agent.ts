import { mistral } from "@ai-sdk/mistral";
import { embed, generateText } from "ai";
import { collectionName, qdrant } from "./qdrant_client";
import { openai } from "@ai-sdk/openai";

export async function rag_retrieve( query: string) {
    const { embedding } = await embed({
        model: mistral.textEmbedding("mistral-embed"),
        value: query,
    })

    const hits = (await qdrant.search(collectionName, {
        vector: embedding,
        limit: 5
    })).sort((a: any, b: any) => {
        return b.score - a.score;
    })

    const context = hits
        .map((h: any) => {
            const page = (h.payload?.text as any) ?? null;
            return (page && (typeof page === "string" ? page : page.text)) ?? "";
        })
        .filter(Boolean)
        .join("\n");

    return context;
}


export async function main(query: string) {

    const context = await rag_retrieve(query)

    // const { text } = await generateText({
    //     model: openai("gpt-4o-mini"),
    //     prompt: `
    //         You are a helpful assistant. Use ONLY this context:

    //         ${context}

    //         Question: ${ques}`,
    //     temperature: 0.2
    // });
    const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are the Troubleshoot Agent.

            Your purpose:
            Help the user diagnose and fix technical problems across a wide range of domains:
            - Internet/Router/WiFi issues
            - Mobile device problems
            - Computer errors (Windows, macOS, Linux)
            - Hardware malfunctions
            - Software crashes and configuration issues
            - Network connectivity failures
            - Cloud services or account issues
            - Smart home devices
            - Any general tech troubleshooting

            Core Operating Principle:
            1. Always check the retrieved internal context first:
            - user-provided logs
            - device information
            - past conversation context
            - configuration details
            - system history
            - database/vector search results
            - stored knowledge or memory

            2. If the context contains relevant information → use it to give a complete answer.

            3. ONLY if the context is missing, incomplete, or insufficient:
            → call the 'web_search' tool with a specific and minimal query that targets missing information.

            4. Never hallucinate unknown facts. If neither context nor web search provides an answer, reply:
            “I don't know based on the available information.”

            5. Always think like a senior technician:
            - identify likely root causes
            - ask for missing but essential details
            - offer quick diagnostic checks
            - avoid unnecessary steps
            - provide step-by-step instructions tailored to the user's device/OS/environment

            Behavior Rules:
            - Be clear, calm, and helpful — no jargon unless needed.
            - Prioritize safety (e.g., no unsafe hardware instructions).
            - When listing steps, start with the simplest and least intrusive.
            - If the problem could have multiple causes, give structured branches:
            *“If A happens → do X. If B happens → do Y.”*

            Tool Use:
            - Internal context is always first priority.
            - use web_search only when context is not sufficient.

            Decision Framework:
            1. Do I have enough context to solve it → answer directly.
            2. If not, what exact missing piece do I need → search only that.
            3. Combine findings carefully.
            4. Never fabricate or guess beyond confidence.
            5. If still uncertain → say “I'm not sure.”

            Goal:
            Provide accurate, safe, and practical troubleshooting guidance for any general technical issue.
            
            Context: 

            ${context}
            
            question: ${query}`,
        temperature: 0.2,
        tools: {
            web_search: openai.tools.webSearch()
        }
    });

    console.log("ANSWER:", text);
    return text;
}