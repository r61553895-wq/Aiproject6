import https from 'https';
import crypto from 'crypto';

export interface GigaChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GigaChatResponse {
  text: string;
  usage: GigaChatUsage;
  model: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getGigaChatAccessToken(authKey: string): Promise<string> {
  // If we already have a valid cached token that does not expire within 60 seconds
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  return new Promise((resolve, reject) => {
    const rqUid = crypto.randomUUID();
    const postData = 'scope=GIGACHAT_API_PERS';

    const req = https.request(
      {
        hostname: 'ngw.devices.sberbank.ru',
        port: 9443,
        path: '/api/v2/oauth',
        method: 'POST',
        rejectUnauthorized: false, // Required for Russian Ministry of Digital certificates in Node.js
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': rqUid,
          'Authorization': `Basic ${authKey.trim()}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(rawData);
              cachedAccessToken = parsed.access_token;
              tokenExpiresAt = parsed.expires_at || Date.now() + 1800000;
              resolve(cachedAccessToken!);
            } else {
              reject(new Error(`GigaChat OAuth Error (${res.statusCode}): ${rawData}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse GigaChat OAuth response: ${rawData}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(new Error(`GigaChat OAuth network error: ${err.message}`));
    });

    req.write(postData);
    req.end();
  });
}

export async function callGigaChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  authKey: string
): Promise<GigaChatResponse> {
  const token = await getGigaChatAccessToken(authKey);

  return new Promise((resolve, reject) => {
    // Inject friendly Grokson persona if system prompt is missing
    const hasSystem = messages.some((m) => m.role === 'system');
    const fullMessages = hasSystem
      ? messages
      : [
          {
            role: 'system',
            content:
              'Ты — Grokson (Гроксон), умный, вежливый и дружелюбный ИИ-помощник с отличным чувством юмора и глубокими знаниями. Твой девиз: "YOUR AI PARTNER ALWAYS ONLINE". Отвечай структурированно, полезно, используй форматирование Markdown, списки и блоки кода при необходимости.',
          },
          ...messages,
        ];

    const postData = JSON.stringify({
      model: 'GigaChat',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const req = https.request(
      {
        hostname: 'gigachat.devices.sberbank.ru',
        port: 443,
        path: '/api/v1/chat/completions',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(rawData);
              const choice = parsed.choices?.[0];
              const replyText = choice?.message?.content || 'Не удалось получить ответ от Grokson.';
              const usage: GigaChatUsage = parsed.usage || {
                prompt_tokens: Math.ceil(JSON.stringify(messages).length / 4),
                completion_tokens: Math.ceil(replyText.length / 4),
                total_tokens: Math.ceil((JSON.stringify(messages).length + replyText.length) / 4),
              };

              resolve({
                text: replyText,
                usage,
                model: 'Grokson Neural Core',
              });
            } else {
              reject(new Error(`GigaChat API Error (${res.statusCode}): ${rawData}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse GigaChat completion response: ${rawData}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(new Error(`GigaChat Chat network error: ${err.message}`));
    });

    req.write(postData);
    req.end();
  });
}
