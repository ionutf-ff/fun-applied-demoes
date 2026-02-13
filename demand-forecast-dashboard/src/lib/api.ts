import type { DemandApiResponse } from '@/types';

export async function fetchDemandData(
  state: string,
  startDate: string,
  endDate: string
): Promise<DemandApiResponse> {
  const params = new URLSearchParams({ state, start: startDate, end: endDate });
  const response = await fetch(`/api/demand?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch demand data: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchExplanation(
  params: {
    date: string;
    actual: number;
    predicted: number;
    state: string;
    temperature: number | null;
  },
  onChunk: (text: string) => void
): Promise<void> {
  const response = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch explanation: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.text) onChunk(data.text);
      }
    }
  }
}
