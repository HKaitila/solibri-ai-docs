import { EmbeddingProvider } from "../types";
import { OpenAIProvider } from "./openai";

let cachedProvider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const provider = (process.env.EMBEDDING_PROVIDER || "openai").toLowerCase();

  switch (provider) {
    case "openai":
      cachedProvider = new OpenAIProvider();
      break;
    case "cohere":
      throw new Error("Cohere provider not yet implemented");
    default:
      throw new Error(`Unknown embedding provider: ${provider}`);
  }

  console.log(`[Embedding] Using provider: ${provider}`);
  return cachedProvider;
}

export function resetEmbeddingProvider(): void {
  cachedProvider = null;
}
