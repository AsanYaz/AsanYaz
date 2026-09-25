import axios from 'axios';

interface AIResponse {
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

interface AIProviderInterface {
  provider: string;
  model: string;
  generate(prompt: string): Promise<AIResponse>;
}

class OpenAIProvider implements AIProviderInterface {
  provider = 'openai';
  model: string;
  private apiKey: string;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gpt-4o';
    this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '8000');
  }

  async generate(prompt: string): Promise<AIResponse> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.model,
        messages: [
          { role: 'system', content: 'Sən peşəkar akademik sənəd hazırlayan assistentisən. Yalnız Azərbaycan dilində akademik məzmun hazırla.' },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      },
    );

    return {
      text: response.data.choices[0].message.content,
      usage: {
        inputTokens: response.data.usage?.prompt_tokens,
        outputTokens: response.data.usage?.completion_tokens,
      },
    };
  }
}

class GeminiProvider implements AIProviderInterface {
  provider = 'gemini';
  model: string;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gemini-pro';
  }

  async generate(prompt: string): Promise<AIResponse> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
          maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || '8000'),
        },
      },
      { timeout: 120000 },
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      text,
      usage: {
        inputTokens: response.data.usageMetadata?.promptTokenCount,
        outputTokens: response.data.usageMetadata?.candidatesTokenCount,
      },
    };
  }
}

export class AIProviderFactory {
  static create(): AIProviderInterface {
    const provider = process.env.AI_PROVIDER || 'openai';

    switch (provider) {
      case 'gemini':
        return new GeminiProvider();
      case 'openai':
      default:
        return new OpenAIProvider();
    }
  }
}
