const actionTypes=['Disclosure Request','Preservation Request','Freezing Request']

export default function ActionTypeSelector({value,onChange}){return <fieldset className="action-types"><legend>Action type</legend>{actionTypes.map(type=><label key={type} className={value===type?'is-selected':''}><input type="radio" name="action-type" value={type} checked={value===type} onChange={()=>onChange(type)}/><span><strong>{type}</strong><small>Mock preparation only · authorization not implied</small></span></label>)}</fieldset>}
