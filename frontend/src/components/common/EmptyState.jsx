import {Inbox} from 'lucide-react'
export default function EmptyState({title='Nothing here yet',message='This workspace is ready for future data.'}){return <div className="empty-state"><Inbox/><h3>{title}</h3><p>{message}</p></div>}
