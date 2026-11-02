// Thin outline icons on a rounded tile, in the style of the Ideas2IT navbar icons:
// tile fill #FFFEFB, hairline border #DEDDDC, 1.5px-ish strokes in #888580.
const PATHS = {
  document: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>),
  eyeOff: (<><path d="M3 3l18 18" /><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c5 0 8.5 4.2 9.5 6a14 14 0 0 1-3.1 3.7M6.4 7.9A14 14 0 0 0 2.5 12c1 1.8 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>),
  users: (<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18.5 14.8c1.6.8 2.5 2.4 2.5 5.2" /></>),
  scale: (<><path d="M12 4v16M7 20h10" /><path d="M5 7h14" /><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z" /></>),
  send: (<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>),
  stop: (<rect x="6.5" y="6.5" width="11" height="11" rx="2" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>),
  check: (<path d="M5 12.5l4.5 4.5L19 7.5" />),
  download: (<><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" /><path d="M5 19h14" /></>),
  alert: (<><path d="M12 4l9.5 16h-19z" /><path d="M12 10v4.5M12 17.4v.1" /></>),
  refresh: (<><path d="M20 5v5h-5" /><path d="M19.4 10A7.5 7.5 0 1 0 20 13" /></>),
  spark: (<path d="M12 3c.6 4.6 4.4 8.4 9 9-4.6.6-8.4 4.4-9 9-.6-4.6-4.4-8.4-9-9 4.6-.6 8.4-4.4 9-9z" />)
};

export default function Icon({ name, size = 18, tile = false, className = '', title }) {
  const svg = (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
  return tile ? <span className={`icon-tile ${className}`}>{svg}</span> : <span className={`icon ${className}`}>{svg}</span>;
}
