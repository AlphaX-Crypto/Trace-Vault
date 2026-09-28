import {Bell,CircleHelp} from 'lucide-react'
import {useLocation} from 'react-router-dom'
import SearchInput from '../common/SearchInput'
import './layout.css'
const titles={'/dashboard':'Investigation Dashboard','/cases':'Case Registry','/cases/new':'Open New Case','/cases/analysis':'Analysis Progress','/analysis-progress':'Analysis Progress','/reports':'Reports'}
export default function Topbar(){const{pathname}=useLocation();const title=titles[pathname]||(pathname.includes('/graph')?'Transaction Graph':pathname.includes('/overview')?'Investigation Overview':pathname.includes('/attribution')?'Attribution & Risk':pathname.includes('/evidence')?'Evidence':pathname.includes('/report')?'Case Report':'TRACEVAULT');return <header className="topbar"><div><span className="topbar-kicker">TRACEVAULT /</span><strong>{title}</strong></div><div className="topbar-actions"><SearchInput/><button className="icon-button" aria-label="Help"><CircleHelp/></button><button className="icon-button notification" aria-label="Notifications"><Bell/><span/></button><div className="topbar-avatar">TJ</div></div></header>}
