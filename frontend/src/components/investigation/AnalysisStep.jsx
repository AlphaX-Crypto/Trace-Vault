import { Check, Circle, LoaderCircle } from 'lucide-react'

export default function AnalysisStep({ index, label, status }) {
  const Icon = status === 'completed' ? Check : status === 'current' ? LoaderCircle : Circle

  return (
    <li className={`analysis-step is-${status}`} aria-current={status === 'current' ? 'step' : undefined}>
      <span className="analysis-step-icon"><Icon aria-hidden="true" /></span>
      <span className="analysis-step-number mono">{String(index + 1).padStart(2, '0')}</span>
      <strong>{label}</strong>
      <span className="analysis-step-status">{status}</span>
    </li>
  )
}
