import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 900,
  chunkOverlap: 140,
});

export async function chunkDocument(content: string) {
  const chunks = await splitter.splitText(content);
  return chunks.map((chunk, index) => ({
    content: chunk,
    index,
    tokenEstimate: Math.ceil(chunk.length / 4),
  }));
}
