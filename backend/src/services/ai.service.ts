import { env } from '../config/env';

export async function callPromptly(message: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);

  try {
    const response = await fetch(`${env.AI_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error('non-200');

    const data = (await response.json()) as { response?: string };
    if (!data.response) throw new Error('empty response');
    return data.response;
  } catch (err) {
    console.error('[callPromptly] fetch failed:', err);
    throw new Error('AI service temporarily unavailable.');
  } finally {
    clearTimeout(timeout);
  }
}

export function sanitizeInput(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .slice(0, 4000);
}
