export default function SelectField({ id, label, options, error, hint, className = '', ...selectProps }) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>{label}{selectProps.required && <span aria-hidden="true"> *</span>}</label>
      <select id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...selectProps}>
        {options.map(option => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}
      </select>
      {hint && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field-error" id={`${id}-error`} role="status">{error}</span>}
    </div>
  )
}
