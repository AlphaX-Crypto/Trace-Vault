export default function TextareaField({ id, label, error, hint, className = '', ...textareaProps }) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...textareaProps} />
      {hint && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field-error" id={`${id}-error`} role="status">{error}</span>}
    </div>
  )
}
