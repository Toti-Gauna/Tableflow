import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ScanVia } from '../domain/cmd-codes'

/** jsQR se baja recién cuando alguien lee un QR (cámara o foto): no pesa en la carga inicial. */
async function decodeImageData(img: ImageData): Promise<string | null> {
  const { default: jsQR } = await import('jsqr')
  return jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data ?? null
}

const MAX_SIDE = 1100

/** Lee un QR de una foto o captura. Se hace en el navegador: la imagen no sale del dispositivo. */
export async function readQrFromFile(file: File): Promise<string | null> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * k))
  const h = Math.max(1, Math.round(bmp.height * k))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const g = canvas.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.fillStyle = '#fff'
  g.fillRect(0, 0, w, h)
  g.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  return decodeImageData(g.getImageData(0, 0, w, h))
}

const CAMERA_ERRORS: Record<string, string> = {
  NotAllowedError: 'No diste permiso para usar la cámara. Podés subir una foto del QR o escribir el código.',
  NotFoundError: 'No encontramos una cámara en este dispositivo. Subí una foto del QR o escribí el código.',
  NotReadableError: 'La cámara está en uso por otra aplicación. Cerrala o subí una foto del QR.',
  SecurityError: 'Este navegador no deja usar la cámara en esta dirección. Subí una foto del QR o escribí el código.',
}

/**
 * Tres formas de ingresar un código y ninguna se activa sola: la cámara arranca solo al tocar el botón (y se apaga al
 * leer, al detenerla o al salir de la pantalla), la foto es opcional y escribirlo a mano siempre está.
 */
export function Scanner({ onText, label = 'Código' }: { onText: (text: string, via: ScanVia) => void; label?: string }) {
  const [cam, setCam] = useState<'off' | 'pidiendo' | 'activa'>('off')
  const [msg, setMsg] = useState('')
  const [manual, setManual] = useState('')
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const timer = useRef<number | null>(null)
  const alive = useRef(true)

  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
    if (alive.current) setCam('off')
  }
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      stop()
    }
  }, [])

  const tick = async () => {
    const v = video.current
    if (!v || !stream.current) return
    if (v.readyState >= 2 && v.videoWidth) {
      const k = Math.min(1, 640 / v.videoWidth)
      const w = Math.round(v.videoWidth * k)
      const h = Math.round(v.videoHeight * k)
      const c = (canvas.current ??= document.createElement('canvas'))
      c.width = w
      c.height = h
      const g = c.getContext('2d', { willReadFrequently: true })
      if (g) {
        g.drawImage(v, 0, 0, w, h)
        const text = await decodeImageData(g.getImageData(0, 0, w, h))
        if (text && stream.current) {
          stop()
          setMsg('')
          onText(text, 'camara')
          return
        }
      }
    }
    if (stream.current) timer.current = window.setTimeout(tick, 160)
  }

  const start = async () => {
    setMsg('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setMsg('Este navegador no permite usar la cámara acá. Subí una foto del QR o escribí el código.')
      return
    }
    setCam('pidiendo')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      if (!alive.current) {
        s.getTracks().forEach((t) => t.stop())
        return
      }
      stream.current = s
      setCam('activa')
      const v = video.current
      if (v) {
        v.srcObject = s
        await v.play().catch(() => undefined)
      }
      timer.current = window.setTimeout(tick, 200)
    } catch (e) {
      stop()
      setMsg(CAMERA_ERRORS[(e as Error).name] ?? 'No pudimos abrir la cámara. Subí una foto del QR o escribí el código.')
    }
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setMsg('')
    try {
      const text = await readQrFromFile(f)
      if (text) onText(text, 'imagen')
      else setMsg('No encontramos un QR en esa imagen. Probá con una foto más nítida o escribí el código.')
    } catch {
      setMsg('No pudimos leer esa imagen. Probá con otra o escribí el código.')
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (manual.trim()) onText(manual.trim(), 'manual')
  }

  return (
    <div className="scanner" data-testid="scanner">
      <div className="scan-row">
        {cam === 'off' ? (
          <button className="btn secondary" type="button" onClick={start} data-testid="scan-camera">Escanear con la cámara</button>
        ) : (
          <button className="btn secondary" type="button" onClick={stop} data-testid="scan-stop">Detener la cámara</button>
        )}
        <label className="btn secondary file-btn" htmlFor="scan-file">
          Subir una foto del QR
          <input id="scan-file" className="sr-only" type="file" accept="image/*" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} data-testid="scan-file" />
        </label>
      </div>
      <p className="small muted" role="status" aria-live="polite">
        {cam === 'pidiendo' ? 'Esperando el permiso de la cámara…' : cam === 'activa' ? 'Cámara activa: apuntá al QR. Se apaga sola al leerlo.' : 'La cámara solo se enciende cuando tocás el botón. Nada se envía: la lectura es en este dispositivo.'}
      </p>
      {cam !== 'off' && <video ref={video} playsInline muted aria-label="Vista de la cámara" data-testid="scan-video" />}
      {msg && <p className="err-text small" role="alert" data-testid="scan-msg">{msg}</p>}
      <form className="scan-row" onSubmit={submit}>
        <label className="sr-only" htmlFor="scan-manual">{label}</label>
        <input id="scan-manual" type="text" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Escribí el código o pegá el enlace" autoComplete="off" spellCheck={false} data-testid="scan-manual" />
        <button className="btn" type="submit" disabled={!manual.trim()} data-testid="scan-submit">Validar</button>
      </form>
    </div>
  )
}
