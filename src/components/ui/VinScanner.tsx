import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { useLocale } from '../../i18n/LocaleProvider'
import { isCompleteVin, normalizeVin, pickBestVin } from '../../lib/vin'

type DetectedValue = { rawValue: string }
type ImageDetector = { detect: (source: CanvasImageSource) => Promise<DetectedValue[]> }
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => ImageDetector
type TextDetectorCtor = new () => ImageDetector

type Capabilities = {
  BarcodeDetector?: BarcodeDetectorCtor
  TextDetector?: TextDetectorCtor
}

const BARCODE_FORMATS = ['code_39', 'code_128', 'itf', 'codabar', 'data_matrix', 'qr_code']

function readCapabilities(): Capabilities {
  const scope = window as unknown as Capabilities
  return { BarcodeDetector: scope.BarcodeDetector, TextDetector: scope.TextDetector }
}

type VinScannerProps = {
  open: boolean
  onClose: () => void
  onDetected: (vin: string) => void
}

export function VinScanner({ open, onClose, onDetected }: VinScannerProps) {
  const { t } = useLocale()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const detectedRef = useRef(onDetected)
  useEffect(() => {
    detectedRef.current = onDetected
  }, [onDetected])

  const capabilities = useMemo(() => readCapabilities(), [])
  const canScanBarcode = Boolean(capabilities.BarcodeDetector)
  const [manual, setManual] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    let detector: ImageDetector | null = null
    setManual('')
    setNotFound(false)
    setError('')

    const cleanup = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }

    const loop = () => {
      if (cancelled || !detector) return
      const video = videoRef.current
      if (!video || video.readyState < 2) {
        timerRef.current = window.setTimeout(loop, 600)
        return
      }
      detector
        .detect(video)
        .then((codes) => {
          const vin = pickBestVin(codes.map((code) => code.rawValue))
          if (vin) {
            detectedRef.current(vin)
            return
          }
          timerRef.current = window.setTimeout(loop, 400)
        })
        .catch(() => {
          timerRef.current = window.setTimeout(loop, 600)
        })
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t('vinScan.noCamera'))
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
        }
        if (capabilities.BarcodeDetector) {
          detector = new capabilities.BarcodeDetector({ formats: BARCODE_FORMATS })
          loop()
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('vinScan.cameraError'))
      }
    }

    void start()
    return () => {
      cancelled = true
      cleanup()
    }
  }, [open, capabilities, t])

  const capture = async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    setNotFound(false)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 480
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    if (capabilities.BarcodeDetector) {
      const barcodeDetector = new capabilities.BarcodeDetector({ formats: BARCODE_FORMATS })
      const codes = await barcodeDetector.detect(canvas).catch(() => [] as DetectedValue[])
      const vin = pickBestVin(codes.map((code) => code.rawValue))
      if (vin) {
        detectedRef.current(vin)
        return
      }
    }

    if (capabilities.TextDetector) {
      const textDetector = new capabilities.TextDetector()
      const blocks = await textDetector.detect(canvas).catch(() => [] as DetectedValue[])
      const vin = pickBestVin(blocks.map((block) => block.rawValue))
      if (vin) {
        detectedRef.current(vin)
        return
      }
    }

    setNotFound(true)
  }

  const useManual = () => {
    const vin = normalizeVin(manual)
    if (isCompleteVin(vin)) {
      detectedRef.current(vin)
      return
    }
    setNotFound(true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <h2 className="text-base font-semibold">{t('vinScan.title')}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10"
        >
          {t('vinScan.close')}
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 size-full object-cover"
        />
        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-white/80" />
      </div>

      <div className="space-y-3 bg-surface px-4 py-4">
        <p className="text-sm text-text-muted">{t('vinScan.hint')}</p>
        {error && <p className="text-sm text-error">{error}</p>}
        {canScanBarcode ? (
          <Button type="button" variant="secondary" className="w-full" onClick={() => void capture()}>
            {t('vinScan.capture')}
          </Button>
        ) : (
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            {t('vinScan.unsupported')}
          </p>
        )}
        {notFound && <p className="text-sm text-error">{t('vinScan.notFound')}</p>}
        <div className="space-y-2 border-t border-border pt-3">
          <Input
            label={t('vinScan.manual')}
            value={manual}
            inputMode="text"
            autoCapitalize="characters"
            maxLength={17}
            onChange={(e) => setManual(normalizeVin(e.target.value))}
          />
          <Button
            type="button"
            className="w-full"
            disabled={!isCompleteVin(manual)}
            onClick={useManual}
          >
            {t('vinScan.use')}
          </Button>
        </div>
      </div>
    </div>
  )
}
