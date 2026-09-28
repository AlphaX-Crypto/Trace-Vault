export function riskClass(level=''){return level.toLowerCase()}
export function riskDescription(score){if(score>=80)return'Critical investigative indicators';if(score>=60)return'High investigative indicators';if(score>=40)return'Moderate investigative indicators';return'Limited investigative indicators'}
