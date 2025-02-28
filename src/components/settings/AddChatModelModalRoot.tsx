import { Notice } from 'obsidian'
import { useState } from 'react'

import { DEFAULT_PROVIDERS } from '../../constants'
import SmartComposerPlugin from '../../main'
import { ChatModel, chatModelSchema } from '../../types/chat-model.types'
import { ObsidianButton } from '../common/ObsidianButton'
import { ObsidianDropdown } from '../common/ObsidianDropdown'
import { ObsidianSetting } from '../common/ObsidianSetting'
import { ObsidianTextInput } from '../common/ObsidianTextInput'

type AddChatModelModalRootProps = {
  plugin: SmartComposerPlugin
  onClose: () => void
  existingModel?: ChatModel
}

export default function AddChatModelModalRoot({
  plugin,
  onClose,
  existingModel,
}: AddChatModelModalRootProps) {
  const [formData, setFormData] = useState<ChatModel>(
    existingModel ?? {
      providerId: DEFAULT_PROVIDERS[0].id,
      providerType: DEFAULT_PROVIDERS[0].type,
      id: '',
      model: '',
    },
  )

  const handleSubmit = async () => {
    if (
      !existingModel &&
      plugin.settings.chatModels.some((p) => p.id === formData.id)
    ) {
      new Notice('Model with this ID already exists. Try a different ID.')
      return
    }

    if (
      !plugin.settings.providers.some(
        (provider) => provider.id === formData.providerId,
      )
    ) {
      new Notice('Provider with this ID does not exist')
      return
    }

    const validationResult = chatModelSchema.safeParse(formData)
    if (!validationResult.success) {
      new Notice(validationResult.error.issues.map((v) => v.message).join('\n'))
      return
    }

    if (existingModel) {
      // Update existing model
      await plugin.setSettings({
        ...plugin.settings,
        chatModels: plugin.settings.chatModels.map((model) =>
          model.id === existingModel.id ? formData : model,
        ),
      })
    } else {
      // Add new model
      await plugin.setSettings({
        ...plugin.settings,
        chatModels: [...plugin.settings.chatModels, formData],
      })
    }

    onClose()
  }

  return (
    <>
      <ObsidianSetting
        name="ID"
        desc="Choose an ID to identify this model in your settings. This is just for your reference."
        required
      >
        <ObsidianTextInput
          value={formData.id}
          placeholder="my-custom-model"
          onChange={(value: string) =>
            setFormData((prev) => ({ ...prev, id: value }))
          }
          disabled={!!existingModel}
        />
      </ObsidianSetting>

      <ObsidianSetting name="Provider ID" required>
        <ObsidianDropdown
          value={formData.providerId}
          options={Object.fromEntries(
            plugin.settings.providers.map((provider) => [
              provider.id,
              provider.id,
            ]),
          )}
          onChange={(value: string) => {
            const provider = plugin.settings.providers.find(
              (p) => p.id === value,
            )
            if (!provider) {
              new Notice(`Provider with ID ${value} not found`)
              return
            }
            setFormData((prev) => ({
              ...prev,
              providerId: value,
              providerType: provider.type,
            }))
          }}
        />
      </ObsidianSetting>

      <ObsidianSetting name="Model Name" required>
        <ObsidianTextInput
          value={formData.model}
          placeholder="Enter the model name"
          onChange={(value: string) =>
            setFormData((prev) => ({ ...prev, model: value }))
          }
        />
      </ObsidianSetting>

      {formData.providerType === 'openai' && (
        <ObsidianSetting
          name="Max Tokens"
          desc={
            formData.model.startsWith('o')
              ? 'Maximum number of tokens to generate (will be sent as max_completion_tokens for o-prefix models). Leave empty for default.'
              : 'Maximum number of tokens to generate. Leave empty for default.'
          }
        >
          <ObsidianTextInput
            value={formData.maxTokens?.toString() ?? ''}
            placeholder="Enter max tokens"
            onChange={(value: string) => {
              const maxTokens = parseInt(value, 10)
              setFormData((prev) => ({
                ...prev,
                maxTokens: isNaN(maxTokens) ? undefined : maxTokens,
              }))
            }}
          />
        </ObsidianSetting>
      )}

      <ObsidianSetting>
        <ObsidianButton
          text={existingModel ? 'Save' : 'Add'}
          onClick={handleSubmit}
          cta
        />
        <ObsidianButton text="Cancel" onClick={onClose} />
      </ObsidianSetting>
    </>
  )
}
