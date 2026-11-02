import Icon from './Icon.jsx';
import { STARTERS } from '../lib/prompts.js';

export default function Welcome({ onPick, disabled }) {
  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <p className="eyebrow">Resource Management</p>
      <h1 id="welcome-title">Build a tailored resume from verified employee records</h1>
      <p className="lede">
        Give me an employee and a job description. I compare their project history with the JD,
        write a resume in the Ideas2IT template, and tell you where the fit is strong, where it is not,
        and which profile data looks out of date.
      </p>
      <ul className="starters">
        {STARTERS.map(s => (
          <li key={s.id}>
            <button type="button" className="starter" onClick={() => onPick(s.prompt)} disabled={disabled}>
              <Icon name={s.icon} tile size={18} />
              <span className="starter-text">
                <span className="starter-title">{s.title}</span>
                <span className="starter-desc">{s.description}</span>
              </span>
              <Icon name="send" size={15} className="starter-arrow" />
            </button>
          </li>
        ))}
      </ul>
      <p className="hint">Or type an employee name or ID, then paste the job description.</p>
    </section>
  );
}
