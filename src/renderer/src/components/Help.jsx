import { useTranslation } from 'react-i18next'
import { LifeBuoy, Bug, ShieldCheck, ShieldAlert } from 'lucide-react'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

const GITHUB_URL = 'https://github.com/xkddn/RootPass-App/issues'
const SECURITY_URL = 'https://github.com/xkddn/RootPass-App/security/advisories/new'

function Help() {
  const { t } = useTranslation()

  const faq = t('help.faq', { returnObjects: true })
  const faqItems = Array.isArray(faq) ? faq : []

  const openExternal = (url) => {
    if (url && url !== '#') window.open(url, '_blank')
  }

  return (
    <div className="h-full w-full overflow-y-auto px-6 py-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-2xl pb-12">
        <header className="mb-8">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-400/70">
            <LifeBuoy className="size-3" aria-hidden="true" />
            {t('help.eyebrow')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('help.title')}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t('help.subtitle')}</p>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            {t('help.faqTitle')}
          </h2>
          <div className="space-y-2.5">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/[0.06] bg-black/20 px-5 py-4"
              >
                <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">{item.q}</h3>
                <p className="text-[13px] leading-relaxed text-zinc-400">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            {t('help.contactTitle')}
          </h2>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => openExternal(GITHUB_URL)}
              className={`flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/20 px-5 py-4 text-left transition-all hover:border-white/[0.12] hover:bg-black/30 ${FOCUS_RING}`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-200">
                <Bug className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-200">{t('help.githubTitle')}</p>
                <p className="text-[13px] text-zinc-500">{t('help.githubDesc')}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => openExternal(SECURITY_URL)}
              className={`flex w-full items-center gap-3 rounded-2xl border border-amber-500/[0.15] bg-amber-500/[0.04] px-5 py-4 text-left transition-all hover:border-amber-500/30 hover:bg-amber-500/[0.08] ${FOCUS_RING}`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <ShieldAlert className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-200">{t('help.securityTitle')}</p>
                <p className="text-[13px] text-zinc-500">{t('help.securityDesc')}</p>
              </div>
            </button>
          </div>
        </section>

        <div className="flex flex-col items-center gap-2 border-t border-white/[0.05] pt-6 text-center">
          <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
            <ShieldCheck className="size-3.5 text-emerald-500/60" aria-hidden="true" />
            {t('help.privacyNote')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Help
