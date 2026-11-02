import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

export default function Composer({ busy, onSend, onStop, seed }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  // A starter prompt is placed in the box so it can be edited before sending.
  useEffect(() => {
    if (seed?.text) {
      setText(seed.text);
      requestAnimationFrame(() => ref.current?.focus());
    }
  }, [seed]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);

  function submit() {
    const value = text.trim();
    if (!value || busy) return;
    onSend(value);
    setText('');
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={e => { e.preventDefault(); submit(); }}>
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Employee name or ID, then paste the job description"
          maxLength={20000}
        />
        {busy ? (
          <button type="button" className="btn btn-light btn-icon" onClick={onStop} aria-label="Stop generating">
            <Icon name="stop" size={16} />
          </button>
        ) : (
          <button type="submit" className="btn btn-primary btn-icon" disabled={!text.trim()} aria-label="Send message">
            <Icon name="send" size={16} />
          </button>
        )}
      </form>
      <p className="footnote">
        Enter to send, Shift+Enter for a new line. POC with mock employee data. A person must review every resume before it is shared with a client.
      </p>
    </div>
  );
}
