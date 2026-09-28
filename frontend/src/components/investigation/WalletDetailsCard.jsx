import { CheckCircle2, WalletCards } from 'lucide-react'
import Card from '../common/Card'

export default function WalletDetailsCard({investigation}){
  const details=[
    ['Blockchain',investigation.blockchain],
    ['Wallet address',investigation.wallet,'mono'],
    ['Case reference',investigation.id,'mono'],
    ['Analysis status',investigation.status],
  ]
  return <Card className="wallet-details-card" title="Suspect wallet details" subtitle="Submitted target and ledger context" action={<WalletCards aria-hidden="true"/>}><dl className="detail-list">{details.map(([label,value,className])=><div key={label}><dt>{label}</dt><dd className={className}>{label==='Analysis status'&&<CheckCircle2 aria-hidden="true"/>}{value}</dd></div>)}</dl></Card>
}
