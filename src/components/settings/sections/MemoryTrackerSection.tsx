import { App } from 'obsidian'

import { useSettings } from '../../../contexts/settings-context'
import SmartComposerPlugin from '../../../main'
import { ObsidianSetting } from '../../common/ObsidianSetting'
import { ObsidianSlider } from '../../common/ObsidianSlider'
import { ObsidianToggle } from '../../common/ObsidianToggle'

type MemoryTrackerSectionProps = {
  app: App
  plugin: SmartComposerPlugin
}

export function MemoryTrackerSection({ plugin }: MemoryTrackerSectionProps) {
  const { settings, setSettings } = useSettings()
  
  const updateMemoryTrackerOptions = (
    partialOptions: Partial<typeof settings.memoryTrackerOptions>
  ) => {
    setSettings({
      ...settings,
      memoryTrackerOptions: {
        ...settings.memoryTrackerOptions,
        ...partialOptions,
      },
    })
    
    // Apply changes immediately if the tracker is initialized
    if (plugin.getMemoryTracker() && settings.memoryTrackerOptions.enabled) {
      plugin.initMemoryTracker()
    }
  }
  
  return (
    <div className="smtcmp-settings-section">
      <div className="smtcmp-settings-header">Memory Tracking</div>
      
      <ObsidianSetting
        name="Enable Memory Tracking"
        desc="Track memory usage to help identify potential memory leaks. This will log memory stats to the console at regular intervals."
      >
        <ObsidianToggle
          value={settings.memoryTrackerOptions.enabled}
          onChange={(value) => {
            updateMemoryTrackerOptions({ enabled: value })
            
            // Start or stop tracking based on the toggle
            if (value) {
              plugin.initMemoryTracker()
            } else if (plugin.getMemoryTracker()) {
              plugin.getMemoryTracker()?.stop()
            }
          }}
        />
      </ObsidianSetting>
      
      <ObsidianSetting
        name="Debug Mode"
        desc="Log memory statistics to console on every check. Useful for debugging, but can clutter the console."
      >
        <ObsidianToggle
          value={settings.memoryTrackerOptions.debugMode}
          onChange={(value) => updateMemoryTrackerOptions({ debugMode: value })}
          disabled={!settings.memoryTrackerOptions.enabled}
        />
      </ObsidianSetting>
      
      <ObsidianSetting
        name="Check Interval"
        desc={`How often to check memory usage (in minutes). Currently: ${
          settings.memoryTrackerOptions.intervalMs / (60 * 1000)
        } minutes`}
      >
        <ObsidianSlider
          value={settings.memoryTrackerOptions.intervalMs / (60 * 1000)} // Convert ms to minutes for UI
          min={1}
          max={30}
          step={1}
          onChange={(value: number) => 
            updateMemoryTrackerOptions({ intervalMs: value * 60 * 1000 })
          }
          disabled={!settings.memoryTrackerOptions.enabled}
        />
      </ObsidianSetting>
      
      <ObsidianSetting
        name="Memory Threshold"
        desc={`Threshold percentage to trigger high memory usage warnings. Currently: ${
          settings.memoryTrackerOptions.memoryThresholdPercentage
        }%`}
      >
        <ObsidianSlider
          value={settings.memoryTrackerOptions.memoryThresholdPercentage}
          min={50}
          max={95}
          step={5}
          onChange={(value: number) => 
            updateMemoryTrackerOptions({ memoryThresholdPercentage: value })
          }
          disabled={!settings.memoryTrackerOptions.enabled}
        />
      </ObsidianSetting>
      
      <ObsidianSetting
        name="History Length"
        desc={`Maximum number of memory measurements to keep for calculating growth rates. Currently: ${
          settings.memoryTrackerOptions.maxHistoryLength
        }`}
      >
        <ObsidianSlider
          value={settings.memoryTrackerOptions.maxHistoryLength}
          min={20}
          max={300}
          step={20}
          onChange={(value: number) => 
            updateMemoryTrackerOptions({ maxHistoryLength: value })
          }
          disabled={!settings.memoryTrackerOptions.enabled}
        />
      </ObsidianSetting>
      
      <div className="setting-item-description">
        <p>
          Memory tracking can help identify potential memory leaks in the plugin. 
          If you notice high memory usage or performance degradation over time, 
          enabling this feature can help diagnose the issue.
        </p>
        <p>
          You can also run the "Check memory usage" command at any time to see 
          the current memory statistics in the developer console (Ctrl+Shift+I or Cmd+Option+I).
        </p>
      </div>
    </div>
  )
} 