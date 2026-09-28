export function formatWallet(value,start=7,end=5){if(!value||value.length<=start+end+3)return value;return `${value.slice(0,start)}…${value.slice(-end)}`}
