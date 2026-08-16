// FFT radix-2 (Cooley-Tukey) y espectro de amplitud para series de un magnetómetro.

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

function radix2(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr
      const ti = im[i]; im[i] = im[j]; im[j] = ti
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (2 * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = -Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k]
        const ui = im[i + k]
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr
        re[i + k] = ur + vr
        im[i + k] = ui + vi
        re[i + k + len / 2] = ur - vr
        im[i + k + len / 2] = ui - vi
        const nr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = nr
      }
    }
  }
}

// Devuelve el espectro de amplitud (amplitud vs periodo en minutos).
// Usa una media móvil para quitar la variación diurna lenta y quedarse con la "anomalía".
export function fftSpectrum(values: number[], sampleMinutes: number, rollingWindow = 60): { period: number; amplitude: number }[] {
  const n = values.length
  if (n < 16) return []

  const detrended: number[] = new Array(n)
  for (let i = 0; i < n; i++) {
    let sum = 0
    let count = 0
    for (let j = i - rollingWindow; j <= i + rollingWindow; j++) {
      if (j >= 0 && j < n) { sum += values[j]; count++ }
    }
    detrended[i] = values[i] - sum / count
  }

  // Ventana de Hann para reducir fugas espectrales.
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)))
    detrended[i] *= w
  }

  const size = nextPow2(n)
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  for (let i = 0; i < n; i++) re[i] = detrended[i]
  radix2(re, im)

  const out: { period: number; amplitude: number }[] = []
  const maxK = Math.floor(size / 2)
  for (let k = 1; k <= maxK; k++) {
    const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / n
    const period = (n * sampleMinutes) / k
    if (period >= 2 && period <= 240) out.push({ period, amplitude: mag })
  }
  return out.sort((a, b) => a.period - b.period)
}

export type Spectrogram = { times: number[]; periods: number[]; values: number[][] }

const PERIOD_BINS = 48

// Espectrograma: FFT en ventanas deslizantes → matriz tiempo × periodo.
// `times` son minutos desde el inicio de la serie; `values[r][c]` es la amplitud.
export function spectrogram(values: number[], sampleMinutes: number, windowMinutes = 180, stepMinutes = 15, minPeriod = 2, maxPeriod = 120): Spectrogram {
  const windowSize = Math.floor(windowMinutes / sampleMinutes)
  const step = Math.floor(stepMinutes / sampleMinutes)
  const empty: Spectrogram = { times: [], periods: [], values: [] }
  if (values.length < 16 || windowSize < 16) return empty

  const logMin = Math.log(minPeriod)
  const logMax = Math.log(maxPeriod)
  const periods: number[] = Array.from({ length: PERIOD_BINS }, (_, b) => Number(Math.exp(logMin + ((logMax - logMin) * b) / (PERIOD_BINS - 1)).toFixed(1)))

  const times: number[] = []
  const valuesMat: number[][] = []

  for (let start = 0; start + windowSize <= values.length; start += step) {
    const slice = values.slice(start, start + windowSize)
    const spectrum = fftSpectrum(slice, sampleMinutes, 1)
    const row = new Array(PERIOD_BINS).fill(0)
    for (const s of spectrum) {
      if (s.period < minPeriod || s.period > maxPeriod) continue
      const t = (Math.log(s.period) - logMin) / (logMax - logMin)
      const idx = Math.min(PERIOD_BINS - 1, Math.max(0, Math.round(t * (PERIOD_BINS - 1))))
      if (s.amplitude > row[idx]) row[idx] = s.amplitude
    }
    times.push((start + Math.floor(windowSize / 2)) * sampleMinutes)
    valuesMat.push(row)
  }

  return { times, periods, values: valuesMat }
}
