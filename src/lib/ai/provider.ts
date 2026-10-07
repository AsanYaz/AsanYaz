/**
 * AI Provider Abstraction
 * First implementation: Google Gemini
 */

export interface AIGenerationParams {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface AIGenerationResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  provider: string;
}

export interface AIProvider {
  name: string;
  model: string;
  generate(params: AIGenerationParams): Promise<AIGenerationResult>;
  generateStructured<T>(params: AIGenerationParams & { schema?: string }): Promise<{ data: T } & Omit<AIGenerationResult, 'content'>>;
}

// ---- Google Gemini Implementation ----

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  model: string;
  private apiKey: string;

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || 'gemini-2.5-pro';

    if (!apiKey) {
      throw new Error(
        'Missing required credential: AI_API_KEY\n' +
        'Provider: Google Gemini\n' +
        'Purpose: AI content generation\n' +
        'Where to obtain: https://aistudio.google.com/apikey'
      );
    }

    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(params: AIGenerationParams): Promise<AIGenerationResult> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    
    const generationConfig: Record<string, unknown> = {};
    if (params.temperature !== undefined) generationConfig.temperature = params.temperature;
    if (params.maxTokens !== undefined) generationConfig.maxOutputTokens = params.maxTokens;
    if (params.topP !== undefined) generationConfig.topP = params.topP;

    const model = genAI.getGenerativeModel({
      model: this.model,
      ...(params.systemPrompt ? { systemInstruction: params.systemPrompt } : {}),
      generationConfig,
    });

    const result = await model.generateContent(params.prompt);
    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      content: text,
      promptTokens: usage?.promptTokenCount || 0,
      completionTokens: usage?.candidatesTokenCount || 0,
      totalTokens: usage?.totalTokenCount || 0,
      model: this.model,
      provider: this.name,
    };
  }

  async generateStructured<T>(
    params: AIGenerationParams & { schema?: string }
  ): Promise<{ data: T } & Omit<AIGenerationResult, 'content'>> {
    const prompt = params.schema
      ? `${params.prompt}\n\nRespond ONLY with valid JSON matching this schema:\n${params.schema}`
      : `${params.prompt}\n\nRespond ONLY with valid JSON.`;

    const result = await this.generate({
      ...params,
      prompt,
    });

    // Extract JSON from response
    let jsonStr = result.content.trim();
    // Handle markdown code blocks
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const data = JSON.parse(jsonStr) as T;

    return {
      data,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      model: result.model,
      provider: result.provider,
    };
  }
}

// ---- Provider Factory ----

let _aiProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_aiProvider) return _aiProvider;

  const provider = process.env.AI_PROVIDER || 'gemini';

  switch (provider) {
    case 'gemini':
      _aiProvider = new GeminiProvider();
      break;
    default:
      throw new Error(`Unsupported AI provider: ${provider}. Supported: gemini`);
  }

  return _aiProvider;
}
