'use client'
import { CalendarDays, Download, Info, Pause, Play, RadioTower, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

type Props = {
  date: Date
  live: boolean
  animate: boolean
  crossingsOnly: boolean
  showAntipode: boolean
  onDate: (date: Date) => void
  onLive: (value: boolean) => void
  onAnimate: (value: boolean) => void
  onCrossingsOnly: (value: boolean) => void
  onAntipode: (value: boolean) => void
  onExport: () => void
  onInfo: () => void
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2">
      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-600'}`}>
        <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
      <span className={`whitespace-nowrap text-xs font-medium transition-colors ${checked ? 'text-white' : 'text-slate-300'}`}>{label}</span>
    </button>
  )
}

export function DateControls(props: Props) {
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl text-cyan-300" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.28), rgba(99,102,241,0.28))' }}>
          <RadioTower className="size-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Geophysical Monitor</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Energía entrante · UTC / 24 h</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
        <CalendarDays className="size-4 text-cyan-300" />
        <input aria-label="Fecha seleccionada" type="date" value={format(props.date, 'yyyy-MM-dd')} onChange={(event) => props.onDate(new Date(`${event.target.value}T00:00:00Z`))} className="bg-transparent font-mono text-xs text-white [color-scheme:dark]" />
        <button type="button" onClick={() => props.onDate(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())))} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10">Hoy</button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Switch label="Live" checked={props.live} onChange={props.onLive} />
        <Switch label="Solo cruces" checked={props.crossingsOnly} onChange={props.onCrossingsOnly} />
        <Switch label="Antípoda" checked={props.showAntipode} onChange={props.onAntipode} />
        <Switch label={props.animate ? 'Pausar luna' : 'Animar luna'} checked={props.animate} onChange={props.onAnimate} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={props.onInfo} className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200 hover:bg-white/10">
          <Info className="size-4" /> Cómo funciona
        </button>
        <button type="button" onClick={props.onExport} className="flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90" style={{ background: 'linear-gradient(90deg, #06b6d4, #6366f1)' }}>
          <Download className="size-4" /> Exportar imagen
        </button>
        <span className="font-mono text-[10px] text-slate-500">{props.live ? <RefreshCw className="inline size-4 animate-spin" /> : props.animate ? <Play className="inline size-4 text-emerald-400" /> : <Pause className="inline size-4" />}</span>
      </div>
    </header>
  )
}
