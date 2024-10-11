import Groq from 'groq-sdk'
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'groq-sdk/resources/chat/completions'

import {
  LLMOptions,
  LLMRequestNonStreaming,
  LLMRequestStreaming,
  RequestMessage,
} from '../../types/llm/request'
import {
  LLMResponseNonStreaming,
  LLMResponseStreaming,
} from '../../types/llm/response'

import { BaseLLMProvider } from './base'

export type GroqModel =
  | 'llama-3.1-8b-instant'
  | 'llama-3.1-70b-versatile'
  | 'llama3-8b-8192'
  | 'llama3-70b-8192'
  | 'mixtral-8x7b-32768'
export const GROQ_MODELS: GroqModel[] = [
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'llama3-8b-8192',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
]

export class GroqProvider implements BaseLLMProvider {
  private client: Groq | null = null

  async initialize({ apiKey }: { apiKey: string }): Promise<void> {
    this.client = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true,
    })
  }

  async generateResponse(
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    if (!this.client) {
      throw new Error('Groq client not initialized')
    }
    try {
      const response = await this.client.chat.completions.create(
        {
          model: request.model,
          messages: request.messages.map((m) =>
            GroqProvider.parseRequestMessage(m),
          ),
          max_tokens: request.max_tokens,
          temperature: request.temperature,
          top_p: request.top_p,
        },
        {
          signal: options?.signal,
        },
      )
      return GroqProvider.parseNonStreamingResponse(response)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async streamResponse(
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<AsyncIterable<LLMResponseStreaming>> {
    if (!this.client) {
      throw new Error('Groq client not initialized')
    }
    const stream = await this.client.chat.completions.create(
      {
        model: request.model,
        messages: request.messages.map((m) =>
          GroqProvider.parseRequestMessage(m),
        ),
        max_tokens: request.max_tokens,
        temperature: request.temperature,
        top_p: request.top_p,
        stream: true,
      },
      {
        signal: options?.signal,
      },
    )

    async function* streamResponse(): AsyncIterable<LLMResponseStreaming> {
      for await (const chunk of stream) {
        yield GroqProvider.parseStreamingResponseChunk(chunk)
      }
    }

    return streamResponse()
  }

  static parseRequestMessage(
    message: RequestMessage,
  ): ChatCompletionMessageParam {
    return {
      role: message.role,
      content: message.content,
    }
  }

  static parseNonStreamingResponse(
    response: ChatCompletion,
  ): LLMResponseNonStreaming {
    return {
      id: response.id,
      choices: response.choices.map((choice) => ({
        finish_reason: choice.finish_reason,
        message: {
          content: choice.message.content,
          role: choice.message.role,
        },
      })),
      created: response.created,
      model: response.model,
      object: 'chat.completion',
      usage: response.usage,
    }
  }

  static parseStreamingResponseChunk(
    chunk: ChatCompletionChunk,
  ): LLMResponseStreaming {
    return {
      id: chunk.id,
      choices: chunk.choices.map((choice) => ({
        finish_reason: choice.finish_reason ?? null,
        delta: {
          content: choice.delta.content ?? null,
          role: choice.delta.role,
        },
      })),
      created: chunk.created,
      model: chunk.model,
      object: 'chat.completion.chunk',
    }
  }

  getSupportedModels(): string[] {
    return GROQ_MODELS
  }
}
