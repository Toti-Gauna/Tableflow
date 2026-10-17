import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Dialog } from './kit'
import { Glyph } from './glyphs'

// Barra inferior para el pulgar en pantallas angostas (cliente ≤ 760 px, administración ≤ 999 px).
// En escritorio no se muestra (display: none), así que no duplica enlaces en la navegación accesible.

export interface Tab {
  to: string
  label: string
  icon: string
  end?: boolean
  badge?: number
  /** Nombre accesible cuando el número del distintivo es parte del significado ("Mi pedido (2)"). */
  aria?: string
}
export interface SheetLink {
  to: string
  label: string
  icon: string
  hint?: string
  badge?: number
}

export function TabBar({ label, tabs, sheet, sheetTitle, className }: { label: string; tabs: Tab[]; sheet: { heading?: string; links: SheetLink[] }[]; sheetTitle: string; className: string }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  // al navegar desde la hoja, se cierra sola
  useEffect(() => setOpen(false), [pathname])
  const inSheet = sheet.some((g) => g.links.some((l) => pathname === l.to || pathname.startsWith(`${l.to}/`)))
  const sheetBadge = sheet.reduce((a, g) => a + g.links.reduce((b, l) => b + (l.badge ?? 0), 0), 0)
  return (
    <>
      <nav className={`tabbar ${className}`} aria-label={label} style={{ ['--tabs' as string]: tabs.length + 1 }}>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className="tab" aria-label={t.aria}>
            <span className="ico" aria-hidden="true">
              <Glyph name={t.icon} size={22} />
            </span>
            <span className="lbl">{t.label}</span>
            {t.badge ? <span className="badge fx-cart" key={t.badge} aria-hidden={t.aria ? true : undefined}>{t.badge}</span> : null}
          </NavLink>
        ))}
        <button type="button" className="tab" aria-haspopup="dialog" aria-expanded={open} aria-current={inSheet ? 'page' : undefined} onClick={() => setOpen(true)}>
          <span className="ico" aria-hidden="true">
            <Glyph name="grid" size={22} />
          </span>
          <span className="lbl">Secciones</span>
          {sheetBadge ? <span className="badge" aria-hidden="true">{sheetBadge}</span> : null}
        </button>
      </nav>
      <Dialog open={open} onClose={() => setOpen(false)} title={sheetTitle} className="sheet">
        <button type="button" className="icon-btn sheet-x" aria-label="Cerrar" onClick={() => setOpen(false)}>
          <Glyph name="x" size={20} />
        </button>
        {sheet.map((g, i) => (
          <section key={i} className="sheet-group" aria-label={g.heading}>
            {g.heading && <p className="eyebrow">{g.heading}</p>}
            <ul>
              {g.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="sheet-link" aria-current={pathname === l.to ? 'page' : undefined} onClick={() => setOpen(false)}>
                    <span className="ico" aria-hidden="true"><Glyph name={l.icon} size={20} /></span>
                    <span className="txt">
                      <strong>{l.label}</strong>
                      {l.hint && <span className="muted small">{l.hint}</span>}
                    </span>
                    {l.badge ? <span className="badge">{l.badge}<span className="sr-only"> pendientes</span></span> : <Glyph name="arrow" size={16} />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Dialog>
    </>
  )
}
