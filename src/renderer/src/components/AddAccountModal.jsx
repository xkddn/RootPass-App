import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Dices, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react'
import CustomSelect from './CustomSelect'
import PasswordGeneratorPanel from './PasswordGeneratorPanel'
import PasswordStrengthBar from './PasswordStrengthBar'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'

/** @param {{ onClose: () => void, onSuccess: () => void }} props */
function AddAccountModal({ onClose, onSuccess }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    login: '',
    password: '',
    category: 'Autres',
    custom_fields: [],
    totp_secret: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showTotpSecret, setShowTotpSecret] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUseGeneratedPassword = (password) => {
    setFormData((prev) => ({ ...prev, password }))
    setShowGenerator(false)
  }

  const addCustomField = () =>
    setFormData((prev) => ({
      ...prev,
      custom_fields: [...prev.custom_fields, { label: '', value: '' }]
    }))

  const updateCustomField = (index, key, value) => {
    const updatedFields = [...formData.custom_fields]
    updatedFields[index][key] = value
    setFormData((prev) => ({ ...prev, custom_fields: updatedFields }))
  }

  const removeCustomField = (index) =>
    setFormData((prev) => ({
      ...prev,
      custom_fields: formData.custom_fields.filter((_, i) => i !== index)
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await window.api.addAccount(formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-white/[0.07] bg-black/30 px-4 py-2.5 text-[13px] text-zinc-200 outline-none transition-all placeholder:text-zinc-700 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/[0.12]'
  const labelClass =
    'mb-1.5 ml-0.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0C0C10] shadow-2xl shadow-black/60 max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
          <h2 id="add-modal-title" className="text-[15px] font-bold text-white">
            {t('accountForm.addTitle')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className={`rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-300 ${FOCUS_RING}`}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <form id="add-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('accountForm.category')}</label>
                <CustomSelect
                  value={formData.category}
                  onChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                  options={[
                    { value: 'Personnel', label: t('categories.Personnel') },
                    { value: 'Travail', label: t('categories.Travail') },
                    { value: 'Finance', label: t('categories.Finance') },
                    { value: 'Réseaux Sociaux', label: t('categories.Réseaux Sociaux') },
                    { value: 'E-commerce', label: t('categories.E-commerce') },
                    { value: 'Divertissement', label: t('categories.Divertissement') },
                    { value: 'Santé', label: t('categories.Santé') },
                    { value: 'Education', label: t('categories.Education') },
                    { value: 'Développement', label: t('categories.Développement') },
                    { value: 'Autres', label: t('categories.Autres') }
                  ]}
                />
              </div>
              <div>
                <label htmlFor="add-title" className={labelClass}>
                  {t('accountForm.titleLabel')}
                </label>
                <input
                  id="add-title"
                  required
                  type="text"
                  name="title"
                  placeholder={t('accountForm.titlePlaceholder')}
                  value={formData.title}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="add-url" className={labelClass}>
                {t('accountForm.urlLabel')}
              </label>
              <input
                id="add-url"
                type="url"
                name="url"
                placeholder={t('accountForm.urlPlaceholder')}
                value={formData.url}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="add-login" className={labelClass}>
                {t('accountForm.loginLabel')}
              </label>
              <input
                id="add-login"
                required
                type="text"
                name="login"
                placeholder={t('accountForm.loginPlaceholder')}
                value={formData.login}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="add-password" className={labelClass}>
                {t('accountForm.passwordLabel')}
              </label>
              <div className="flex gap-2">
                <input
                  id="add-password"
                  required
                  type="text"
                  name="password"
                  placeholder={t('accountForm.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass} font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowGenerator((v) => !v)}
                  aria-label={t('accountForm.generatePassword')}
                  aria-expanded={showGenerator}
                  className={`shrink-0 rounded-xl border p-2.5 transition-colors ${FOCUS_RING} ${
                    showGenerator
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                      : 'border-white/[0.07] bg-white/3 text-zinc-500 hover:border-emerald-500/30 hover:bg-emerald-500/8 hover:text-emerald-400'
                  }`}
                >
                  <Dices className="size-4" aria-hidden="true" />
                </button>
              </div>
              <PasswordStrengthBar password={formData.password} />
              {showGenerator && <PasswordGeneratorPanel onUse={handleUseGeneratedPassword} />}
            </div>

            <div className="border-t border-white/[0.05] pt-4">
              <label htmlFor="add-totp" className={labelClass}>
                {t('accountForm.totpLabel')}
                <span className="ml-2 normal-case tracking-normal font-normal text-zinc-700">
                  {t('accountForm.optional')}
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  id="add-totp"
                  type={showTotpSecret ? 'text' : 'password'}
                  name="totp_secret"
                  placeholder={t('accountForm.totpPlaceholder')}
                  value={formData.totp_secret}
                  onChange={handleChange}
                  className={`${inputClass} font-mono`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowTotpSecret((v) => !v)}
                  aria-label={showTotpSecret ? t('accountForm.hideKey') : t('accountForm.showKey')}
                  className={`shrink-0 rounded-xl border border-white/[0.07] bg-white/3 p-2.5 text-zinc-500 transition-colors hover:border-white/[0.12] hover:text-zinc-300 ${FOCUS_RING}`}
                >
                  {showTotpSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-1.5 ml-0.5 text-[11px] text-zinc-700 leading-relaxed">
                {t('accountForm.totpHelp')}
              </p>
            </div>

            <div className="mt-1 border-t border-white/[0.05] pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className={labelClass}>{t('accountForm.optionalFields')}</span>
                <button
                  type="button"
                  onClick={addCustomField}
                  className={`flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:border-white/10 hover:text-zinc-300 ${FOCUS_RING}`}
                >
                  <Plus className="size-3" aria-hidden="true" />
                  {t('accountForm.addField')}
                </button>
              </div>
              <div className="space-y-2">
                {formData.custom_fields.map((field, index) => (
                  <div key={index} className="flex gap-2 animate-in slide-in-from-left-2">
                    <input
                      type="text"
                      placeholder={t('accountForm.fieldNamePlaceholder')}
                      aria-label={`${t('accountForm.fieldNamePlaceholder')} ${index + 1}`}
                      value={field.label}
                      onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                      className={`${inputClass} w-1/3`}
                      required
                    />
                    <input
                      type="text"
                      placeholder={t('accountForm.fieldValuePlaceholder')}
                      aria-label={`${t('accountForm.fieldValuePlaceholder')} ${index + 1}`}
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      className={inputClass}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      aria-label={t('accountForm.removeField', { index: index + 1 })}
                      className={`rounded-xl p-2 text-zinc-700 transition-colors hover:bg-red-500/10 hover:text-red-400 ${FOCUS_RING}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.05] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-200 ${FOCUS_RING}`}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="add-form"
            disabled={isSubmitting}
            className={`flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-[13px] font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:opacity-50 ${FOCUS_RING}`}
          >
            <Save className="size-3.5" aria-hidden="true" />
            {isSubmitting ? t('common.saving') : t('accountForm.savePassword')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddAccountModal
