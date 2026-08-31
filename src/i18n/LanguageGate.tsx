import { useLocale } from './LocaleProvider'

export function LanguageGate({ children }: { children: React.ReactNode }) {
  const { ready, hasChosenLocale, setLocale, t } = useLocale()

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-text-muted">
        {t('common.loading')}
      </div>
    )
  }

  if (!hasChosenLocale) {
    return (
      <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-background px-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklab, var(--color-primary) 28%, transparent), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent)',
          }}
        />
        <div className="relative mx-auto w-full max-w-sm text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">GarageFinder</p>
          <h1 className="mt-4 text-2xl font-semibold text-text-primary">
            Choose your language
          </h1>
          <p className="mt-1 text-xl font-semibold text-text-primary" dir="rtl">
            اختر لغتك
          </p>
          <p className="mt-3 text-sm text-text-muted">
            You can change this anytime in Profile · يمكنك تغييرها لاحقاً من الحساب
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void setLocale('en')}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-6 shadow-sm transition hover:border-primary hover:bg-primary-light"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary-light text-2xl font-bold text-primary">
                A
              </span>
              <span className="text-sm font-medium text-text-primary">English</span>
            </button>
            <button
              type="button"
              onClick={() => void setLocale('ar')}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-6 shadow-sm transition hover:border-primary hover:bg-primary-light"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary-light text-2xl font-bold text-primary">
                ع
              </span>
              <span className="text-sm font-medium text-text-primary">العربية</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
