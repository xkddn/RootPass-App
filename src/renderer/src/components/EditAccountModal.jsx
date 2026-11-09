import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Dices, Plus, Trash2, Save, Eye, EyeOff, StickyNote } from 'lucide-react'
import CustomSelect from './CustomSelect'
import PasswordGeneratorPanel from './PasswordGeneratorPanel'
import PasswordStrengthBar from './PasswordStrengthBar'
import TagInput from './TagInput'

const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-(--hd-accent)'

/**
 * @param {{ account: object, folders: Array, onClose: () => void, onSuccess: () => void, onDelete: () => void }} props
 */
function EditAccountModal({ account, folders = [], onClose, onSuccess, onDelete }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    title: account.title,
    url: account.url || '',
    login: account.login,
    password: account.password,
    category: account.category || 'Autres',
    custom_fields: account.custom_fields || [],
    totp_secret: account.totp_secret || '',
    tags: account.tags || [],
    folder_id: account.folder_id || null,
    entry_type: account.entry_type === 'note' ? 'note' : 'login',
    notes: account.notes || ''
  })
  const isNote = formData.entry_type === 'note'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showTotpSecret, setShowTotpSecret] = useState(false)
  const pressedOnOverlay = useRef(false)

  const handleOverlayMouseDown = (e) => {
    pressedOnOverlay.current = e.target === e.currentTarget
  }

  const handleOverlayClick = (e) => {
    if (e.target !== e.currentTarget) return
    if (!pressedOnOverlay.current) return
    pressedOnOverlay.current = false
    onClose()
  }

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
      await window.api.updateAccount(account.id, formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-(--hd-line) bg-(--hd-shell) px-4 py-2.5 text-[13px] text-(--hd-ink) outline-none transition-all placeholder:text-(--hd-mute) focus:border-(--hd-accent) focus:ring-2 focus:ring-(--hd-accent)/30'
  const labelClass =
    'mb-1.5 ml-0.5 block text-[13px] font-bold text-(--hd-ink2)'

  return (
    <div
      className="rp-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-(--hd-scrim) p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        className="rp-panel-in flex w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-(--hd-card) shadow-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-(--hd-line) px-5 py-4">
          <h2
            id="edit-modal-title"
            className="flex items-center gap-2 text-[15px] font-bold text-(--hd-ink)"
          >
            {isNote && <StickyNote className="size-4 text-(--hd-accent)" aria-hidden="true" />}
            {isNote ? t('accountForm.editTitleNote') : t('accountForm.editTitle')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className={`rounded-full p-1.5 text-(--hd-mute) transition-colors hover:bg-(--hd-shell) hover:text-(--hd-ink2) ${FOCUS_RING}`}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className={labelClass}>
                {t('accountForm.titleLabel')}
              </label>
              <input
                id="edit-title"
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {isNote && (
              <div>
                <label htmlFor="edit-notes" className={labelClass}>
                  {t('accountForm.notesLabel')}
                </label>
                <textarea
                  id="edit-notes"
                  required
                  name="notes"
                  rows={8}
                  placeholder={t('accountForm.notesPlaceholder')}
                  value={formData.notes}
                  onChange={handleChange}
                  className={`${inputClass} resize-y font-mono leading-relaxed`}
                />
              </div>
            )}

            {!isNote && (
              <>
                <div>
                  <label htmlFor="edit-login" className={labelClass}>
                    {t('accountForm.loginLabel')}
                  </label>
                  <input
                    id="edit-login"
                    required
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="edit-password" className={labelClass}>
                    {t('accountForm.passwordLabel')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="edit-password"
                      required
                      type="text"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`${inputClass} font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGenerator((v) => !v)}
                      aria-label={t('accountForm.generatePassword')}
                      aria-expanded={showGenerator}
                      className={`shrink-0 rounded-full border p-2.5 transition-colors ${FOCUS_RING} ${
                        showGenerator
                          ? 'border-(--hd-accent) bg-(--hd-accent-soft) text-(--hd-accent)'
                          : 'border-(--hd-line) bg-(--hd-shell) text-(--hd-mute) hover:border-(--hd-accent)/30 hover:bg-(--hd-accent)/8 hover:text-(--hd-accent)'
                      }`}
                    >
                      <Dices className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <PasswordStrengthBar password={formData.password} />
                  {showGenerator && <PasswordGeneratorPanel onUse={handleUseGeneratedPassword} />}
                </div>

                <div>
                  <label htmlFor="edit-url" className={labelClass}>
                    {t('accountForm.urlLabel')}
                  </label>
                  <input
                    id="edit-url"
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            <div className="border-t border-(--hd-line) pt-4">
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
                      { value: 'Divertissement', label: t('categories.Divertissement') },
                      { value: 'Education', label: t('categories.Education') },
                      { value: 'Développement', label: t('categories.Développement') },
                      { value: 'Autres', label: t('categories.Autres') }
                    ]}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('accountForm.folderLabel')}</label>
                  <CustomSelect
                    value={formData.folder_id || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, folder_id: val || null }))}
                    options={[
                      { value: '', label: t('accountForm.noFolder') },
                      ...folders.map((f) => ({ value: f.id, label: f.name }))
                    ]}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {t('accountForm.tagsLabel')}
                <span className="ml-2 normal-case tracking-normal font-normal text-(--hd-mute)">
                  {t('accountForm.optional')}
                </span>
              </label>
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                placeholder={t('accountForm.tagsPlaceholder')}
              />
            </div>

            {!isNote && (
              <>
                <div className="border-t border-(--hd-line) pt-4">
                  <label htmlFor="edit-totp" className={labelClass}>
                    {t('accountForm.totpLabel')}
                    <span className="ml-2 normal-case tracking-normal font-normal text-(--hd-mute)">
                      {t('accountForm.optional')}
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="edit-totp"
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
                      aria-label={
                        showTotpSecret ? t('accountForm.hideKey') : t('accountForm.showKey')
                      }
                      className={`shrink-0 rounded-full border border-(--hd-line) bg-(--hd-shell) p-2.5 text-(--hd-mute) transition-colors hover:border-(--hd-faint) hover:text-(--hd-ink2) ${FOCUS_RING}`}
                    >
                      {showTotpSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="mt-1.5 ml-0.5 text-[12px] text-(--hd-mute) leading-relaxed">
                    {t('accountForm.totpHelp')}
                  </p>
                </div>

                <div className="mt-1 border-t border-(--hd-line) pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={labelClass}>{t('accountForm.optionalFields')}</span>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className={`flex items-center gap-1 rounded-full border border-(--hd-line) bg-(--hd-card) px-2.5 py-1.5 text-[12px] font-medium text-(--hd-mute) transition-colors hover:border-(--hd-faint) hover:text-(--hd-ink2) ${FOCUS_RING}`}
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
                          className={`rounded-full p-2 text-(--hd-mute) transition-colors hover:bg-(--hd-bad)/10 hover:text-(--hd-bad) ${FOCUS_RING}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        <div className="flex items-center justify-between border-t border-(--hd-line) px-5 py-4">
          <button
            type="button"
            onClick={() => onDelete(account.id)}
            aria-label={`${t('accountForm.deleteAccount')} — ${account.title}`}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-(--hd-mute) transition-colors hover:bg-(--hd-bad)/10 hover:text-(--hd-bad) ${FOCUS_RING}`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {t('accountForm.deleteAccount')}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full px-4 py-2 text-[13px] font-medium text-(--hd-mute) transition-colors hover:text-(--hd-ink) ${FOCUS_RING}`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="edit-form"
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-full bg-(--hd-accent) px-5 py-2 text-[13px] font-bold text-(--hd-on-accent) shadow-lg transition-all hover:brightness-110 disabled:opacity-50 ${FOCUS_RING}`}
            >
              <Save className="size-3.5" aria-hidden="true" />
              {isSubmitting
                ? t('accountForm.updating')
                : isNote
                  ? t('accountForm.saveNote')
                  : t('accountForm.updatePassword')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditAccountModal
