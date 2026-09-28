export default function Badge({children,tone='neutral'}){return <span className={`badge badge-${tone.toLowerCase()}`}>{children}</span>}
