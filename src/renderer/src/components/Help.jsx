import { useTranslation } from 'react-i18next'
import { Bug, ShieldCheck, ShieldAlert } from 'lucide-react'

const GITHUB_URL = 'https://github.com/xkddn/RootPass-App/issues'
const SECURITY_URL = 'https://github.com/xkddn/RootPass-App/security/advisories/new'

function ContactCard({ icon: Icon, title, desc, tone, onClick }) {
  const iconClass =
    tone === 'warn'
      ? 'bg-(--hd-warn)/12 text-(--hd-warn)'
      : 'bg-(--hd-accent-soft) text-(--hd-accent)'
  return (
    <button
      type="button"
      onClick={onClick}
      className="hd-card flex w-full items-center gap-4 p-6 text-left transition-colors hover:bg-(--hd-card-hover)"
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-(--hd-ink)">{title}</span>
        <span className="block text-[13px] leading-snug text-(--hd-mute)">{desc}</span>
      </span>
    </button>
  )
}

function Help() {
  const { t } = useTranslation()

  const faq = t('help.faq', { returnObjects: true })
  const faqItems = Array.isArray(faq) ? faq : []

  const openExternal = (url) => {
    if (url && url !== '#') window.open(url, '_blank')
  }

  return (
    <div className="px-5 pb-12 pt-7 lg:px-12 lg:pt-12">
      <p className="mb-8 max-w-2xl px-1 text-[16px] text-(--hd-ink2)">{t('help.subtitle')}</p>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="help-faq-title" className="min-w-0 space-y-4">
          <h2
            id="help-faq-title"
            className="px-1 text-[20px] font-extrabold tracking-tight text-(--hd-ink)"
          >
            {t('help.faqTitle')}
          </h2>
          {faqItems.map((item, idx) => (
            <div key={idx} className="hd-card p-6">
              <h3 className="mb-1.5 text-[15px] font-bold text-(--hd-ink)">{item.q}</h3>
              <p className="text-[14px] leading-relaxed text-(--hd-ink2)">{item.a}</p>
            </div>
          ))}
        </section>

        <section
          aria-labelledby="help-contact-title"
          className="min-w-0 space-y-4 xl:sticky xl:top-0"
        >
          <h2
            id="help-contact-title"
            className="px-1 text-[20px] font-extrabold tracking-tight text-(--hd-ink)"
          >
            {t('help.contactTitle')}
          </h2>
          <ContactCard
            icon={Bug}
            title={t('help.githubTitle')}
            desc={t('help.githubDesc')}
            onClick={() => openExternal(GITHUB_URL)}
          />
          <ContactCard
            icon={ShieldAlert}
            tone="warn"
            title={t('help.securityTitle')}
            desc={t('help.securityDesc')}
            onClick={() => openExternal(SECURITY_URL)}
          />
          <p className="flex items-start gap-2 px-2 pt-2 text-[13px] leading-snug text-(--hd-mute)">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--hd-accent)" aria-hidden="true" />
            {t('help.privacyNote')}
          </p>
        </section>
      </div>
    </div>
  )
}

export default Help
