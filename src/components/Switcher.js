export default function Switcher({ name, text, stateTracker, changeHandler }) {
    return <button className={`button ${stateTracker === name ? 'button-group-active' : ''}`} 
    name={name} onClick={changeHandler}>{text}</button>
}