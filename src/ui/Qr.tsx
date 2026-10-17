import { useMemo, useRef, useState } from 'react'
import { qrModules, qrPathData } from '../domain/qr-render'
import { KIND_LABEL, qrPath, type CodeKind } from '../domain/qr'
import { announce } from './kit'
import type { BusinessId } from '../domain/types'
import './qr.css'

/** Enlace completo del QR: la ruta de la app más el origen de esta demo. Sin datos de personas. */
export function qrUrl(path: string): string {
  const base = typeof window === 'undefined' ? '' : window.location.href.split('#')[0]
  return `${base}#${path}`
}

/** El QR siempre es oscuro sobre blanco (y con zona de silencio): así lo lee cualquier cámara, también en modo oscuro. */
export function QrImage({ text, size = 176, label }: { text: string; size?: number; label: string }) {
  const { d, n } = useMemo(() => {
    const m = qrModules(text)
    const p = qrPathData(m)
    return { d: p.d, n: p.size }
  }, [text])
  return (
    <svg className="qr-img" role="img" aria-label={label} viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" data-testid="qr-img" data-payload={text}>
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#111" />
    </svg>
  )
}

interface CardProps {
  businessId: BusinessId
  kind: CodeKind
  reference: string
  title: string
  caption?: string
  locationId?: string | null
  size?: number
  id?: string
}

/** Código + QR + enlace, con vista previa de impresión. El comercio y el cliente usan la misma tarjeta. */
export function QrCard({ businessId, kind, reference, title, caption, locationId, size = 176, id }: CardProps) {
  const url = qrUrl(qrPath(businessId, kind, reference, locationId))
  const key = id ?? `qr-${kind}-${reference}`
  const [copied, setCopied] = useState(false)
  const fig = useRef<HTMLElement>(null)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      announce('Enlace copiado')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      announce('No se pudo copiar: seleccioná el enlace y copialo a mano.', 'err')
    }
  }
  const print = () => {
    const card = fig.current
    if (!card) return
    document.body.dataset.printQr = 'on'
    card.dataset.printing = 'true'
    const clear = () => {
      delete document.body.dataset.printQr
      delete card.dataset.printing
      window.removeEventListener('afterprint', clear)
    }
    window.addEventListener('afterprint', clear)
    window.print()
    // algunos navegadores no disparan afterprint: se limpia igual
    setTimeout(clear, 1500)
  }
  return (
    <figure className="qr-card" ref={fig} data-qr-id={key} data-testid={`qr-card-${kind}-${reference}`}>
      <QrImage text={url} size={size} label={`QR de ${title}`} />
      <figcaption>
        <strong className="qr-title">{title}</strong>
        <code className="qr-code" data-testid="qr-ref">{reference}</code>
        {caption && <span className="small muted">{caption}</span>}
        <span className="qr-kind small muted">{KIND_LABEL[kind]}</span>
        <span className="qr-url small" data-testid="qr-url">{url}</span>
        <span className="qr-actions no-print">
          <button className="btn small secondary" type="button" onClick={copy} data-testid="qr-copy">{copied ? 'Copiado' : 'Copiar enlace'}</button>
          <button className="btn small secondary" type="button" onClick={print} data-testid="qr-print">Imprimir</button>
        </span>
      </figcaption>
    </figure>
  )
}

/** Para pedidos, reservas y beneficios: el QR queda a un toque, sin ocupar la pantalla. */
export function QrDisclosure({ summary = 'Mostrar mi código QR', ...p }: CardProps & { summary?: string }) {
  return (
    <details className="qr-disclosure">
      <summary data-testid={`qr-open-${p.reference}`}>{summary}</summary>
      <QrCard {...p} />
      <p className="small muted">Se muestra en el local para que lo lean. No lleva tu nombre ni importes, y no acredita un pago.</p>
    </details>
  )
}
