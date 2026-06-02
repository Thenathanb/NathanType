import { useAuth, getPbEntry, type PersonalBestEntry } from '../../context/AuthContext'
import { useState } from 'react'

const TIME_MODES = ['15', '30', '60', '120'] as const
const WORD_MODES = ['10', '25', '50', '100'] as const

function fmtDate(ts: number): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PbCell({ label, pb }: { label: string; pb: PersonalBestEntry | null }) {
  const [hovered, setHovered] = useState(false)
  const has = pb && pb.wpm > 0

  return (
    <div
      className="flex flex-col items-center font-mono"
      style={{ padding: '16px 8px', minWidth: 0, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ color: 'var(--sub)', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{
        fontSize: 42, fontWeight: 700, lineHeight: 1,
        color: has ? 'var(--main)' : 'color-mix(in srgb, var(--sub) 30%, transparent)',
      }}>
        {has ? pb.wpm : '—'}
      </div>
      {has && (
        <div style={{ color: 'var(--sub)', fontSize: 12, marginTop: 4 }}>
          {Math.round(pb.acc)}%
        </div>
      )}

      {/* Hover detail */}
      {hovered && has && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '10px 14px',
          zIndex: 20, whiteSpace: 'nowrap', textAlign: 'left',
          fontSize: 12, lineHeight: 1.8,
        }}>
          <div style={{ color: 'var(--sub)' }}>{label}</div>
          <div><span style={{ color: 'var(--sub)' }}>wpm </span><span style={{ color: 'var(--main)', fontWeight: 600 }}>{pb.wpm}</span></div>
          <div><span style={{ color: 'var(--sub)' }}>raw </span><span style={{ color: 'var(--text)' }}>{pb.raw}</span></div>
          <div><span style={{ color: 'var(--sub)' }}>acc </span><span style={{ color: 'var(--text)' }}>{pb.acc}%</span></div>
          <div><span style={{ color: 'var(--sub)' }}>con </span><span style={{ color: 'var(--text)' }}>{Math.round(pb.consistency)}%</span></div>
          {pb.timestamp > 0 && (
            <div style={{ color: 'var(--sub)', marginTop: 4 }}>{fmtDate(pb.timestamp)}</div>
          )}
        </div>
      )}
    </div>
  )
}

function PbRow({ title, modes, modeType }: {
  title: string
  modes: readonly string[]
  modeType: 'time' | 'words'
}) {
  const { userProfile } = useAuth()
  if (!userProfile) return null
  const pbs = modes.map(m => getPbEntry(userProfile, modeType, m))
  const hasAny = pbs.some(pb => pb && pb.wpm > 0)

  return (
    <div className="rounded-xl font-mono" style={{ backgroundColor: 'var(--bg2)' }}>
      <div style={{
        padding: '12px 20px 10px',
        borderBottom: '0.5px solid color-mix(in srgb, var(--sub) 12%, transparent)',
        color: 'var(--sub)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${modes.length}, 1fr)` }}>
        {modes.map((m, i) => (
          <PbCell
            key={m}
            label={`${title === 'time' ? `${m} seconds` : `${m} words`}`}
            pb={pbs[i]}
          />
        ))}
      </div>
      {!hasAny && (
        <div style={{ padding: '0 20px 16px', color: 'var(--sub)', fontSize: 12, textAlign: 'center' }}>
          no personal bests yet
        </div>
      )}
    </div>
  )
}

export function PersonalBests() {
  return (
    <div className="flex flex-col gap-4">
      <PbRow title="time"  modes={TIME_MODES} modeType="time" />
      <PbRow title="words" modes={WORD_MODES} modeType="words" />
    </div>
  )
}
