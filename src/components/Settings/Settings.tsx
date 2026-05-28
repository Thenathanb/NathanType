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
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-primary border border-text-secondary border-opacity-20 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-accent">Settings</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl leading-none">×</button>
        </div>

        <div className="space-y-8">
          {/* Theme */}
          <Section title="Theme">
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => settings.updateSettings({ theme: theme.id })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.theme === theme.id
                      ? 'border-accent'
                      : 'border-transparent hover:border-text-secondary hover:border-opacity-30'
                  }`}
                  style={{ backgroundColor: theme.bgSecondary }}
                >
                  <div className="text-xs font-medium mb-1.5" style={{ color: theme.textPrimary }}>
                    {theme.name}
                  </div>
                  <div className="flex gap-1">
                    <Swatch color={theme.accent} />
                    <Swatch color={theme.error} />
                    <Swatch color={theme.textSecondary} />
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* Appearance */}
          <Section title="Appearance">
            <OptionRow label="Font Size">
              <ButtonGroup
                options={['small', 'medium', 'large', 'extra-large'] as const}
                value={settings.fontSize}
                onChange={(v) => settings.updateSettings({ fontSize: v })}
              />
            </OptionRow>

            <OptionRow label="Caret Style">
              <ButtonGroup
                options={['line', 'block', 'underline', 'off'] as const}
                value={settings.caretStyle}
                onChange={(v) => settings.updateSettings({ caretStyle: v })}
              />
            </OptionRow>

            <OptionRow label="Caret Blink">
              <ButtonGroup
                options={['slow', 'medium', 'fast', 'off'] as const}
                value={settings.caretSpeed}
                onChange={(v) => settings.updateSettings({ caretSpeed: v })}
              />
            </OptionRow>

            <Toggle
              label="Smooth Caret"
              value={settings.smoothCaret}
              onChange={(v) => settings.updateSettings({ smoothCaret: v })}
            />
            <Toggle
              label="Show Live WPM"
              value={settings.showLiveWpm}
              onChange={(v) => settings.updateSettings({ showLiveWpm: v })}
            />
            <Toggle
              label="Show Timer"
              value={settings.showTimer}
              onChange={(v) => settings.updateSettings({ showTimer: v })}
            />
          </Section>

          {/* Sound */}
          <Section title="Sound">
            <Toggle
              label="Key Sounds"
              value={settings.soundEnabled}
              onChange={(v) => settings.updateSettings({ soundEnabled: v })}
              description="Mechanical click on each keystroke"
            />
            <Toggle
              label="Error Sound"
              value={settings.errorSoundEnabled}
              onChange={(v) => settings.updateSettings({ errorSoundEnabled: v })}
              description="Low tone on incorrect character"
            />
          </Section>

          {/* Behavior */}
          <Section title="Behavior">
            <OptionRow label="Difficulty">
              <ButtonGroup
                options={['normal', 'expert', 'master'] as const}
                value={settings.difficulty}
                onChange={(v) => settings.updateSettings({ difficulty: v })}
              />
            </OptionRow>
            <div className="text-text-secondary text-xs mt-1 mb-3">
              {settings.difficulty === 'normal' && 'Standard experience — backspace allowed'}
              {settings.difficulty === 'expert' && 'Restart on any incorrect word submission'}
              {settings.difficulty === 'master' && 'Restart on any incorrect keystroke'}
            </div>

            <OptionRow label="Stop on Error">
              <ButtonGroup
                options={['off', 'letter', 'word'] as const}
                value={settings.stopOnError}
                onChange={(v) => settings.updateSettings({ stopOnError: v })}
              />
            </OptionRow>

            <OptionRow label="Confidence Mode">
              <ButtonGroup
                options={['off', 'partial', 'full'] as const}
                value={settings.confidenceMode}
                onChange={(v) => settings.updateSettings({ confidenceMode: v })}
              />
            </OptionRow>

            <Toggle
              label="Blind Mode"
              value={settings.blindMode}
              onChange={(v) => settings.updateSettings({ blindMode: v })}
              description="Hide error highlighting while typing"
            />
            <Toggle
              label="Focus Mode"
              value={settings.focusMode}
              onChange={(v) => settings.updateSettings({ focusMode: v })}
              description="Dim header and footer during test"
            />
            <Toggle
              label="Quick End"
              value={settings.quickEnd}
              onChange={(v) => settings.updateSettings({ quickEnd: v })}
              description="End test immediately on last word"
            />
          </Section>

          {/* Reset */}
          <div className="pt-4 border-t border-text-secondary border-opacity-10">
            <button
              onClick={() => {
                if (confirm('Reset all settings to defaults?')) settings.resetSettings();
              }}
              className="w-full py-2 text-sm text-error hover:opacity-80 transition-opacity rounded-lg"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-text-secondary mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-primary text-sm shrink-0">{label}</span>
      {children}
    </div>
  );
}

function ButtonGroup<T extends string>({
  options, value, onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap justify-end">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1 rounded-md text-xs transition-all ${
            value === opt
              ? 'bg-accent text-bg-primary font-semibold'
              : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label, value, onChange, description,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <div>
        <span className="text-text-primary text-sm group-hover:text-accent transition-colors">{label}</span>
        {description && <p className="text-text-secondary text-xs mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
          value ? 'bg-accent' : 'bg-bg-secondary'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-bg-primary transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

function Swatch({ color }: { color: string }) {
  return <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: color }} />;
}
