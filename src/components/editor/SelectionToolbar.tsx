import { Copy } from 'lucide-react'
import { Editor, MarkdownView, Menu, Notice, Plugin } from 'obsidian'
import { createElement, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import SmartComposerPlugin from '../../main'

// Style the button to appear next to the selection
const SELECTION_TOOLBAR_CLASSES = {
  CONTAINER: 'smtcmp-selection-toolbar',
  BUTTON: 'smtcmp-selection-toolbar-button',
}

// Component for the inline button
function SelectionToolbar({
  editor,
  view,
  plugin,
  onClose,
}: {
  editor: Editor
  view: MarkdownView
  plugin: SmartComposerPlugin
  onClose: () => void
}) {
  const handlePasteToChat = async () => {
    await plugin.addSelectionToChat(editor, view)
    onClose() // Close the toolbar after action
    new Notice('Selection added to chat')
  }

  // Position the toolbar near the selection
  useEffect(() => {
    const toolbar = document.querySelector(
      `.${SELECTION_TOOLBAR_CLASSES.CONTAINER}`,
    )
    if (!toolbar) return

    const selection = editor.getSelection()
    if (!selection) {
      onClose()
      return
    }

    // Get the selection coordinates using DOM selection
    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) {
      onClose()
      return
    }

    const range = domSelection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Position above the selection
    const toolbarEl = toolbar as HTMLElement
    toolbarEl.style.top = `${rect.top - 40}px`
    toolbarEl.style.left = `${rect.left}px`

    // When selection changes, close the toolbar
    const handleSelectionChange = () => {
      if (!editor.somethingSelected()) {
        onClose()
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [editor, onClose])

  return (
    <div className={SELECTION_TOOLBAR_CLASSES.CONTAINER}>
      <button
        className={SELECTION_TOOLBAR_CLASSES.BUTTON}
        onClick={handlePasteToChat}
        title="Paste to Smart Composer chat"
      >
        <Copy size={16} />
        <span>Add to Chat</span>
      </button>
    </div>
  )
}

export class SelectionToolbarManager {
  private root: ReturnType<typeof createRoot> | null = null
  private container: HTMLElement | null = null
  private plugin: SmartComposerPlugin

  constructor(plugin: SmartComposerPlugin) {
    this.plugin = plugin
  }

  public showToolbar(editor: Editor, view: MarkdownView) {
    // Only show toolbar when there's an active selection
    if (!editor.somethingSelected()) return

    this.removeToolbar()

    // Create container for the toolbar
    this.container = document.createElement('div')
    document.body.appendChild(this.container)

    // Render the toolbar
    this.root = createRoot(this.container)
    this.root.render(
      createElement(SelectionToolbar, {
        editor,
        view,
        plugin: this.plugin,
        onClose: () => this.removeToolbar(),
      }),
    )
  }

  public removeToolbar() {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }

    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }

  // Add context menu items
  public registerContextMenu(plugin: Plugin) {
    plugin.registerEvent(
      plugin.app.workspace.on(
        'editor-menu',
        (menu: Menu, editor: Editor, view: MarkdownView) => {
          if (editor.somethingSelected()) {
            menu.addItem((item) => {
              item
                .setTitle('Smart Composer: Paste to active chat')
                .setIcon('copy')
                .onClick(async () => {
                  await this.plugin.addSelectionToChat(editor, view)
                  new Notice('Selection added to chat')
                })
            })
          }
        },
      ),
    )
  }
}
