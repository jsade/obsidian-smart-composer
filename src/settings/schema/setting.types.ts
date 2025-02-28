import { z } from 'zod'

import {
    DEFAULT_CHAT_MODELS,
    DEFAULT_EMBEDDING_MODELS,
    DEFAULT_PROVIDERS,
} from '../../constants'
import { chatModelSchema } from '../../types/chat-model.types'
import { embeddingModelSchema } from '../../types/embedding-model.types'
import { llmProviderSchema } from '../../types/provider.types'

const ragOptionsSchema = z.object({
  chunkSize: z.number().catch(1000),
  thresholdTokens: z.number().catch(8192),
  minSimilarity: z.number().catch(0.0),
  limit: z.number().catch(10),
  excludePatterns: z.array(z.string()).catch([]),
  includePatterns: z.array(z.string()).catch([]),
})

const memoryTrackerOptionsSchema = z.object({
  enabled: z.boolean().catch(true),
  debugMode: z.boolean().catch(false),
  intervalMs: z.number().catch(5 * 60 * 1000), // Default: 5 minutes
  memoryThresholdPercentage: z.number().catch(80),
  maxHistoryLength: z.number().catch(100),
})

export const SETTINGS_SCHEMA_VERSION = 4

/**
 * Settings
 */

export const smartComposerSettingsSchema = z.object({
  // Version
  version: z.literal(SETTINGS_SCHEMA_VERSION).catch(SETTINGS_SCHEMA_VERSION),

  providers: z.array(llmProviderSchema).catch([...DEFAULT_PROVIDERS]),

  chatModels: z.array(chatModelSchema).catch([...DEFAULT_CHAT_MODELS]),

  embeddingModels: z
    .array(embeddingModelSchema)
    .catch([...DEFAULT_EMBEDDING_MODELS]),

  chatModelId: z.string().catch(DEFAULT_CHAT_MODELS[0].id), // model for default chat feature
  applyModelId: z
    .string()
    .catch(
      DEFAULT_CHAT_MODELS.find((v) => v.id === 'gpt-4o-mini')?.id ??
        DEFAULT_CHAT_MODELS[0].id,
    ), // model for apply feature
  embeddingModelId: z.string().catch(DEFAULT_EMBEDDING_MODELS[0].id), // model for embedding

  // System Prompt
  systemPrompt: z.string().catch(''),

  // RAG Options
  ragOptions: ragOptionsSchema.catch({
    chunkSize: 1000,
    thresholdTokens: 8192,
    minSimilarity: 0.0,
    limit: 10,
    excludePatterns: [],
    includePatterns: [],
  }),
  
  // Memory Tracker Options
  memoryTrackerOptions: memoryTrackerOptionsSchema.catch({
    enabled: true,
    debugMode: false,
    intervalMs: 5 * 60 * 1000,
    memoryThresholdPercentage: 80,
    maxHistoryLength: 100,
  }),
})
export type SmartComposerSettings = z.infer<typeof smartComposerSettingsSchema>

export type SettingMigration = {
  fromVersion: number
  toVersion: number
  migrate: (data: Record<string, unknown>) => Record<string, unknown>
}
