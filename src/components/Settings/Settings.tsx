import { useSettingsStore } from '../../stores/settingsStore';
import { ThemeSelector } from './ThemeSelector';
import { FontSelector } from './FontSelector';
import { FunboxGrid } from '../Funbox/FunboxGrid';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const settings = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--bg2)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-mono font-bold" style={{ color: 'var(--main)', fontSize: 18 }}>settings</h2>
          <button
            onClick={onClose}
            className="leading-none transition-colors"
            style={{ color: 'var(--sub)', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--sub)')}
          >
            ×
          </button>
        </div>

        <div className="space-y-8">
          {/* Theme */}
          <Section title="Theme">
            <ThemeSelector />
          </Section>

          {/* Font */}
          <Section title="Font">
            <FontSelector />
          </Section>

          {/* Funbox */}
          <Section title="funbox">
            <FunboxGrid />
          </Section>

          {/* Appearance */}
          <Section title="Appearance">
            <OptionRow label="Word Display">
              <ButtonGroup
                options={['scroll', 'multi'] as const}
                value={settings.wordDisplay}
                onChange={(v) => settings.updateSettings({ wordDisplay: v })}
              />
            </OptionRow>
            <div className="font-mono mt-1 mb-3" style={{ color: 'var(--sub)', fontSize: 12 }}>
              {settings.wordDisplay === 'scroll' && 'Single row — words scroll horizontally as you type'}
              {settings.wordDisplay === 'multi' && 'Multiple rows — words wrap and rows scroll vertically'}
            </div>

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
            <div className="font-mono mt-1 mb-3" style={{ color: 'var(--sub)', fontSize: 12 }}>
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
              label="Current Word Line"
              value={settings.showCurrentWordLine}
              onChange={(v) => settings.updateSettings({ showCurrentWordLine: v })}
              description="Underline the word you're currently typing"
            />
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

          <Section title="Minimum Thresholds">
            <Toggle
              label="Min Speed"
              value={settings.minSpeedEnabled}
              onChange={(v) => settings.updateSettings({ minSpeedEnabled: v })}
              description="Auto-restart when WPM drops below threshold"
            />
            {settings.minSpeedEnabled && (
              <OptionRow label={`Min WPM: ${settings.minSpeed}`}>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={settings.minSpeed}
                  onChange={(e) => settings.updateSettings({ minSpeed: Number(e.target.value) })}
                  style={{ accentColor: 'var(--main)', width: 160 }}
                />
              </OptionRow>
            )}
            <Toggle
              label="Min Accuracy"
              value={settings.minAccuracyEnabled}
              onChange={(v) => settings.updateSettings({ minAccuracyEnabled: v })}
              description="Auto-restart when accuracy drops below threshold"
            />
            {settings.minAccuracyEnabled && (
              <OptionRow label={`Min Acc: ${settings.minAccuracy}%`}>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={settings.minAccuracy}
                  onChange={(e) => settings.updateSettings({ minAccuracy: Number(e.target.value) })}
                  style={{ accentColor: 'var(--main)', width: 160 }}
                />
              </OptionRow>
            )}
            <Toggle
              label="Ghost Mode"
              value={settings.ghostMode}
              onChange={(v) => settings.updateSettings({ ghostMode: v })}
              description="Race a ghost caret that moves at your PB speed"
            />
          </Section>

          {/* Reset */}
          <div className="pt-4" style={{ borderTop: '1px solid var(--bg2)' }}>
            <button
              onClick={() => {
                if (confirm('Reset all settings to defaults?')) settings.resetSettings();
              }}
              className="w-full py-2 font-mono transition-opacity hover:opacity-80 rounded-lg"
              style={{ color: 'var(--error)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              reset to defaults
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
      <h3 className="font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--sub)', fontSize: 11 }}>{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-sm shrink-0" style={{ color: 'var(--text)' }}>{label}</span>
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
          className="px-3 py-1 rounded-md font-mono transition-all"
          style={{
            fontSize: 12,
            backgroundColor: value === opt ? 'var(--main)' : 'var(--bg2)',
            color: value === opt ? 'var(--bg)' : 'var(--sub)',
            fontWeight: value === opt ? 600 : 400,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            if (value !== opt) (e.currentTarget as HTMLElement).style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            if (value !== opt) (e.currentTarget as HTMLElement).style.color = 'var(--sub)';
          }}
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
        <span className="font-mono text-sm transition-colors" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        {description && (
          <p className="font-mono mt-0.5" style={{ color: 'var(--sub)', fontSize: 11 }}>{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-colors shrink-0"
        style={{ backgroundColor: value ? 'var(--main)' : 'var(--bg2)', border: 'none', cursor: 'pointer' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            backgroundColor: 'var(--bg)',
            transform: value ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </label>
  );
}
