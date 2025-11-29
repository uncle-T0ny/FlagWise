import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class CerebrasService {
  private model: ChatOpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('CEREBRAS_API_KEY');

    if (!apiKey) {
      throw new Error('CEREBRAS_API_KEY is not set in environment variables');
    }

    this.model = new ChatOpenAI({
      apiKey: apiKey,
      modelName: 'llama3.1-8b',
      temperature: 0,
      configuration: {
        baseURL: 'https://api.cerebras.ai/v1',
      },
    });
  }

  async validateMessage(message: string, rules: string[]): Promise<{ isValid: boolean; violatedRule?: string }> {
    const rulesText = rules.join('\n');

    const prompt = `You are a community content moderator. Your task is to check if a message violates any community rules.

Community Rules:
${rulesText}

Message to check:
"${message}"

Instructions:
- Analyze the message carefully against each rule
- If the message violates ANY rule, respond with: VIOLATED: [exact rule text that was violated]
- If the message is acceptable, respond with: VALID

Your response:`;

    try {
      const response = await this.model.invoke(prompt);
      const result = response.content.toString().trim();

      if (result.startsWith('VIOLATED:')) {
        const violatedRule = result.replace('VIOLATED:', '').trim();
        return {
          isValid: false,
          violatedRule: violatedRule,
        };
      }

      return {
        isValid: true,
      };
    } catch (error) {
      console.error('Error validating message:', error);
      throw new Error('Failed to validate message');
    }
  }
}
