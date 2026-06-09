export interface RerankResult {
  index: number;
  score: number;
}

export async function rerank(
  query: string,
  passages: { text: string; index: number }[],
  model: string = 'BAAI/bge-reranker-base',
  topK: number = 10
): Promise<RerankResult[]> {
  return passages.slice(0, topK).map(p => ({ index: p.index, score: 0 }));
}
