export default function FormField({ id, label, error, hint, className = '', ...inputProps }) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>{label}{inputProps.required && <span aria-hidden="true"> *</span>}</label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
      {hint && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field-error" id={`${id}-error`} role="status">{error}</span>}
    </div>
  )
}
