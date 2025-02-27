import { App, Modal } from 'obsidian'
import { createRoot } from 'react-dom/client'

import AddChatModelModalRoot from '../components/settings/AddChatModelModalRoot'
import SmartComposerPlugin from '../main'
import { ChatModel } from '../types/chat-model.types'

export class EditChatModelModal extends Modal {
  private plugin: SmartComposerPlugin
  private model: ChatModel
  private root: ReturnType<typeof createRoot> | null = null

  constructor(app: App, plugin: SmartComposerPlugin, model: ChatModel) {
    super(app)
    this.plugin = plugin
    this.model = model
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    this.titleEl.setText('Edit Chat Model')

    this.root = createRoot(contentEl)
    this.root.render(
      <AddChatModelModalRoot
        plugin={this.plugin}
        onClose={() => this.close()}
        existingModel={this.model}
      />,
    )
  }

  onClose() {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }
    const { contentEl } = this
    contentEl.empty()
  }
}
