import Icon from './Icon.jsx';

export default function Header({ onNewChat, canReset }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="/" aria-label="Ideas2IT Resume Builder home">
          <img src="/ideas2it-logo.svg" alt="Ideas2IT" className="brand-logo" />
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-product">Resume Builder</span>
          <span className="badge" title="Proof of concept: uses mock employee data">POC</span>
        </a>
        <button type="button" className="btn btn-solid btn-small" onClick={onNewChat} disabled={!canReset}>
          <Icon name="plus" size={14} />
          <span>New chat</span>
        </button>
      </div>
    </header>
  );
}
