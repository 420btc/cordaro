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
