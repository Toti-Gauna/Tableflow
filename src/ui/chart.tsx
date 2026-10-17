// Gráfico de barras horizontales (una serie): eje con escala, grilla recesiva, valor al final de cada barra,
// detalle al pasar o enfocar, y la misma información como tabla. Sin librerías.

export interface BarRow {
  key: string
  label: string
  value: number
}

function ticksFor(max: number): number[] {
  const step = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : Math.ceil(max / 5 / 5) * 5
  const top = Math.max(step, Math.ceil(max / step) * step)
  return Array.from({ length: top / step + 1 }, (_, i) => i * step)
}

export function HBarChart({ title, rows, unit, testId }: { title: string; rows: BarRow[]; unit: [string, string]; testId?: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value))
  const ticks = ticksFor(Math.max(1, max))
  const top = ticks[ticks.length - 1]
  const total = rows.reduce((a, r) => a + r.value, 0)
  const u = (n: number) => (n === 1 ? unit[0] : unit[1])
  const pct = (n: number) => `${(n / top) * 100}%`
  return (
    <figure className="hbar" data-testid={testId}>
      <figcaption className="hbar-title">{title}</figcaption>
      <ul className="hbar-rows" style={{ ['--steps' as string]: ticks.length - 1 }}>
        {rows.map((r) => (
          <li key={r.key} className="hbar-row" tabIndex={0} aria-label={`${r.label}: ${r.value} ${u(r.value)}`}>
            <span className="hbar-label" aria-hidden="true">{r.label}</span>
            <span className="hbar-track" aria-hidden="true">
              <span className="hbar-bar" style={{ width: pct(r.value) }} />
              <span className="hbar-tip">{r.label}: {r.value} {u(r.value)}{total ? ` · ${Math.round((r.value / total) * 100)} %` : ''}</span>
            </span>
            <span className="hbar-val" aria-hidden="true">{r.value}</span>
          </li>
        ))}
        <li className="hbar-axis" aria-hidden="true">
          <span />
          <span className="hbar-ticks">
            {ticks.map((t) => <span key={t} style={{ left: pct(t) }}>{t}</span>)}
          </span>
          <span />
        </li>
      </ul>
      <details className="hbar-table">
        <summary>Ver como tabla</summary>
        <table>
          <caption className="sr-only">{title}</caption>
          <thead><tr><th>Estado</th><th className="num">Cantidad</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.key}><td>{r.label}</td><td className="num">{r.value}</td></tr>)}
            <tr><th>Total</th><td className="num">{total}</td></tr>
          </tbody>
        </table>
      </details>
    </figure>
  )
}
