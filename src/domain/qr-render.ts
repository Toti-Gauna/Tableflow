import qrcode from 'qrcode-generator'

/** Módulos del QR (true = oscuro). Corrección de errores "M": aguanta rayones sin agrandar de más el código. */
export function qrModules(text: string): boolean[][] {
  const q = qrcode(0, 'M')
  q.addData(text, 'Byte')
  q.make()
  const n = q.getModuleCount()
  const out: boolean[][] = []
  for (let r = 0; r < n; r++) {
    const row: boolean[] = []
    for (let c = 0; c < n; c++) row.push(q.isDark(r, c))
    out.push(row)
  }
  return out
}

/** Trazado SVG de los módulos oscuros en una sola ruta (con zona de silencio de 4 módulos, como pide el estándar). */
export function qrPathData(modules: boolean[][], quiet = 4): { d: string; size: number } {
  const n = modules.length
  let d = ''
  for (let r = 0; r < n; r++) {
    let c = 0
    while (c < n) {
      if (!modules[r][c]) { c++; continue }
      let e = c
      while (e < n && modules[r][e]) e++
      d += `M${c + quiet} ${r + quiet}h${e - c}v1h${c - e}z`
      c = e
    }
  }
  return { d, size: n + quiet * 2 }
}
