export default function Switcher({ name, text, stateTracker, changeHandler }) {
    return <button className={`button ${stateTracker === name ? 'button--active' : ''}`} 
    name={name} onClick={changeHandler}>{text}</button>
}