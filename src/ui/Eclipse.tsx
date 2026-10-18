import { useEffect, useRef } from 'react'
import { TARIFF } from '../domain/pricing'
import { setPrefs } from '../store'
import { Glyph } from './glyphs'
import './eclipse.css'

/**
 * P5-L9 · Cierre Eclipse: pantalla completa y cerrable. Se abre al terminar la guía o con "Adaptarlo a mi negocio";
 * nunca durante un pedido y, si la persona lo cierra, no vuelve a abrirse solo. Precios del tarifario validado; lo que
 * falta validar dice "a confirmar" y no hay link inventado.
 */
export function EclipseClose({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const close = () => {
    setPrefs({ eclipseDismissed: true })
    onClose()
  }
  const t = TARIFF
  return (
    <dialog ref={ref} className="eclipse" aria-labelledby="eclipse-h" data-testid="eclipse" onCancel={(e) => { e.preventDefault(); close() }}>
      {open && (
        <div className="ec-body">
          <button type="button" className="ec-close btn secondary small" onClick={close} data-testid="eclipse-close" aria-label="Cerrar">
            <Glyph name="x" size={16} /> Cerrar
          </button>
          <p className="eyebrow">Eclipse · siguiente paso</p>
          <h2 id="eclipse-h">Adaptarlo a tu negocio</h2>
          <p className="ec-lead">Lo que viste es una demo con negocios ficticios. Esto es lo que cuesta llevarlo a uno real, según el {t.source.toLowerCase()} (vigencia {t.validity}).</p>
          <div className="ec-grid">
            <section aria-labelledby="ec-pkg">
              <h3 id="ec-pkg">Paquete</h3>
              <p className="ec-price">{t.package.price}</p>
              <p>{t.package.name}. Pago: {t.package.payment}.</p>
              <p className="small muted">{t.package.pack}.</p>
            </section>
            <section aria-labelledby="ec-inc">
              <h3 id="ec-inc">Incluye</h3>
              <ul>{t.included.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
            <section aria-labelledby="ec-exc">
              <h3 id="ec-exc">No incluye</h3>
              <ul>{t.excluded.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
            <section aria-labelledby="ec-mon">
              <h3 id="ec-mon">Mantenimiento mensual</h3>
              <ul>{t.monthly.map((m) => <li key={m.name}><strong>{m.name}</strong> {m.price}: {m.includes}</li>)}</ul>
              <p className="small">{t.monthlyNote}</p>
            </section>
            <section aria-labelledby="ec-ext">
              <h3 id="ec-ext">Integraciones y consumos aparte</h3>
              <ul>{t.extras.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
            <section aria-labelledby="ec-time">
              <h3 id="ec-time">Tiempos</h3>
              <p data-testid="eclipse-times">Plazo de implementación: <strong>{t.times}</strong>. El tarifario no fija plazos y no se inventan.</p>
              <h3>Contacto</h3>
              {t.eclipseUrl ? (
                <a className="btn" href={t.eclipseUrl} rel="noopener">Hablar con Eclipse</a>
              ) : (
                <p data-testid="eclipse-link">Enlace de Eclipse: <strong>a confirmar</strong>. No hay un link verificado en esta demo, así que no se muestra uno inventado.</p>
              )}
            </section>
          </div>
          <div className="ec-actions">
            <button type="button" className="btn secondary" onClick={close} data-testid="eclipse-later">Ahora no</button>
          </div>
        </div>
      )}
    </dialog>
  )
}
