import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { getAllThemes } from '../../utils/themes';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const settings = useSettingsStore();
  const themes = getAllThemes();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary border-2 border-accent rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-accent">Settings</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => settings.updateSettings({ theme: theme.id })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.theme === theme.id
                      ? 'border-accent'
                      : 'border-bg-secondary hover:border-text-secondary'
                  }`}
                  style={{ backgroundColor: theme.bgSecondary }}
                >
                  <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                    {theme.name}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.accent }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.error }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.correct }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Font Size</h3>
            <div className="flex gap-2">
              {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => settings.updateSettings({ fontSize: size })}
                  className={`px-4 py-2 rounded-lg ${
                    settings.fontSize === size
                      ? 'bg-accent text-bg-primary'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Caret Style */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Caret Style</h3>
            <div className="flex gap-2">
              {(['line', 'block', 'underline', 'off'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => settings.updateSettings({ caretStyle: style })}
                  className={`px-4 py-2 rounded-lg ${
                    settings.caretStyle === style
                      ? 'bg-accent text-bg-primary'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Caret Speed */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Caret Speed</h3>
            <div className="flex gap-2">
              {(['slow', 'medium', 'fast', 'off'] as const).map((speed) => (
                <button
                  key={speed}
                  onClick={() => settings.updateSettings({ caretSpeed: speed })}
                  className={`px-4 py-2 rounded-lg ${
                    settings.caretSpeed === speed
                      ? 'bg-accent text-bg-primary'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Difficulty</h3>
            <div className="flex gap-2">
              {(['normal', 'expert', 'master'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => settings.updateSettings({ difficulty: diff })}
                  className={`px-4 py-2 rounded-lg ${
                    settings.difficulty === diff
                      ? 'bg-accent text-bg-primary'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
            <p className="text-sm text-text-secondary mt-2">
              {settings.difficulty === 'normal' && 'Standard typing experience'}
              {settings.difficulty === 'expert' && 'Fails on incorrect word submission'}
              {settings.difficulty === 'master' && 'Fails on any incorrect keystroke (100% accuracy required)'}
            </p>
          </div>

          {/* Toggles */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Options</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg cursor-pointer">
                <span className="text-text-primary">Smooth Caret</span>
                <input
                  type="checkbox"
                  checked={settings.smoothCaret}
                  onChange={(e) => settings.updateSettings({ smoothCaret: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg cursor-pointer">
                <span className="text-text-primary">Show Live WPM</span>
                <input
                  type="checkbox"
                  checked={settings.showLiveWpm}
                  onChange={(e) => settings.updateSettings({ showLiveWpm: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg cursor-pointer">
                <span className="text-text-primary">Quick Restart (Tab + Enter)</span>
                <input
                  type="checkbox"
                  checked={settings.quickRestart}
                  onChange={(e) => settings.updateSettings({ quickRestart: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg cursor-pointer">
                <span className="text-text-primary">Blind Mode (hide errors)</span>
                <input
                  type="checkbox"
                  checked={settings.blindMode}
                  onChange={(e) => settings.updateSettings({ blindMode: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg cursor-pointer">
                <span className="text-text-primary">Focus Mode</span>
                <input
                  type="checkbox"
                  checked={settings.focusMode}
                  onChange={(e) => settings.updateSettings({ focusMode: e.target.checked })}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>

          {/* Reset Settings */}
          <div className="pt-4 border-t border-text-secondary border-opacity-20">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all settings to default?')) {
                  settings.resetSettings();
                }
              }}
              className="w-full px-4 py-2 bg-error text-white rounded-lg hover:opacity-90"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
