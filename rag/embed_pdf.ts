import fs from "fs"
import { embed } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { PDFParse } from "pdf-parse";
import { qdrant, collectionName } from "./qdrant_client";


export async function embed_pdf(path: string) {

    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(
        (col) => col.name === collectionName
    );

    if (!exists) {
        console.log("Creating Qdrant collection:", collectionName);

        await qdrant.createCollection(collectionName, {
            vectors: {
                size: 1024,
                distance: "Cosine"
            },
        });
    } else {
        console.log("Using existing collection:", collectionName);
    }

    const buffer = fs.readFileSync(path)
    const parser = new PDFParse({ data: buffer })
    const pages = (await parser.getText()).pages

    let pointId = 0;

    for (let i = 0; i < pages.length; i++) {
        if (!pages[i] || !pages[i].text) continue

        const e = await embed({
            model: mistral.textEmbedding("mistral-embed"),
            value: pages[i].text,
        });
        console.log(`page - ${i}   -> ${e.embedding}`)

        await qdrant.upsert(collectionName, {
            points: [
                {
                    id: pointId++,
                    vector: e.embedding,
                    payload: { text: pages[i], page: pages[i].num, },
                },
            ],
        });
    }

    console.log("PDF embedded + stored in Qdrant");
}