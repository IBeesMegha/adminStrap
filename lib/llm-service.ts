import https from 'https';

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateAnswer(
  systemPrompt: string,
  userPrompt: string,
  config: LLMConfig
): Promise<string> {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (hfKey) {
    try {
      const text = await Promise.race([
        callHuggingFaceChat(systemPrompt, userPrompt, config, hfKey),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM request timed out')), 70000)
        ),
      ]);
      return text;
    } catch (error: any) {
      console.error('[LLM] HuggingFace error:', error.message);
      if (!groqKey) throw error;
      console.log('[LLM] Falling back to Groq...');
    }
  }

  if (groqKey) {
    try {
      const text = await Promise.race([
        callGroqChat(systemPrompt, userPrompt, config, groqKey),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Groq request timed out')), 30000)
        ),
      ]);
      return text;
    } catch (error: any) {
      console.error('[LLM] Groq error:', error.message);
      throw error;
    }
  }

  throw new Error('No API key configured (HUGGINGFACE_API_KEY or GROQ_API_KEY)');
}

function callHuggingFaceChat(
  systemPrompt: string,
  userPrompt: string,
  config: LLMConfig,
  apiKey: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const postData = JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens ?? 1024,
      temperature: config.temperature ?? 0.1,
      top_p: 0.9,
    });

    const options = {
      hostname: 'router.huggingface.co',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 60000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            if (res.statusCode === 503) {
              reject(new Error('Model is loading, try again'));
            } else {
              reject(new Error(`API ${res.statusCode}: ${data}`));
            }
            return;
          }

          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.message?.content;
          if (content) {
            resolve(content.trim());
          } else {
            reject(new Error('Unexpected response format'));
          }
        } catch (e: any) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(postData);
    req.end();
  });
}

function callGroqChat(
  systemPrompt: string,
  userPrompt: string,
  config: LLMConfig,
  apiKey: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const groqModel = config.model.includes('/')
      ? 'llama-3.3-70b-versatile'
      : config.model;

    const postData = JSON.stringify({
      model: groqModel,
      messages,
      max_tokens: config.maxTokens ?? 1024,
      temperature: config.temperature ?? 0.1,
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 25000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Groq API ${res.statusCode}: ${data}`));
            return;
          }

          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.message?.content;
          if (content) {
            resolve(content.trim());
          } else {
            reject(new Error('Unexpected response format'));
          }
        } catch (e: any) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(postData);
    req.end();
  });
}
