import { Link, useLocation } from 'react-router-dom'
import { Empty } from '../ui/kit'
import { PageHead } from '../ui/Shell'
import { HouseChar } from '../ui/art/characters'
import { BIZ_ROUTE_RE } from '../domain/business'

/** `what` lleva su artículo ("esa página", "ese perfil"): el género lo decide quien llama (FX-01). */
export function NotFound({ what = 'esa página', back = '/', backLabel = 'Volver al inicio' }: { what?: string; back?: string; backLabel?: string }) {
  const { pathname } = useLocation()
  const biz = BIZ_ROUTE_RE.exec(pathname)?.[1] ?? 'mesa-clara'
  return (
    <main className="wrap notfound">
      <PageHead title={`No encontramos ${what}`} />
      <Empty title="Este enlace no lleva a ningún registro" art={<HouseChar biz={biz} mood="pensando" size={132} />} action={<Link className="btn" to={back}>{backLabel}</Link>}>
        El identificador puede ser de otro perfil, de un seed anterior o estar mal escrito. No se creó ni modificó nada.
      </Empty>
    </main>
  )
}
