import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import Markdown from './Markdown.jsx';
import ResumeCard from './ResumeCard.jsx';
import { findResumeLink, formatClock } from '../lib/resumeLink.js';
import { normalizeReply } from '../lib/normalizeReply.js';

function Thinking() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="thinking" role="status">
      <span className="dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="thinking-text">
        {slow ? 'Looking up records and writing the resume. This can take a minute.' : 'Working on it'}
      </span>
    </div>
  );
}

export default function Message({ message, onRetry, canRetry }) {
  const [copied, setCopied] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="msg msg-user">
        <div className="bubble-user">{message.content}</div>
        <time className="msg-time">{formatClock(message.ts)}</time>
      </div>
    );
  }

  const streaming = message.status === 'streaming';
  // message.content stays exactly as received; everything the user sees, copies or clicks uses the cleaned text.
  const content = normalizeReply(message.content, { streaming });
  const link = streaming ? null : findResumeLink(content);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="msg msg-agent">
      <Icon name="spark" tile size={16} className="avatar" />
      <div className="agent-col">
        <div className="agent-name">Resume Builder agent</div>
        {content ? <Markdown>{content}</Markdown> : streaming ? <Thinking /> : null}
        {streaming && content ? <span className="cursor" aria-hidden="true" /> : null}

        {link ? <ResumeCard link={link} /> : null}

        {message.status === 'stopped' ? <p className="note">Stopped. You can send a follow-up or start again.</p> : null}

        {message.status === 'error' ? (
          <div className="error-box" role="alert">
            <Icon name="alert" size={16} />
            <div className="error-text">{message.error}</div>
            {canRetry ? (
              <button type="button" className="btn btn-ghost btn-small" onClick={onRetry}>
                <Icon name="refresh" size={14} />
                <span>Try again</span>
              </button>
            ) : null}
          </div>
        ) : null}

        {message.status === 'done' && content ? (
          <div className="msg-foot">
            <time className="msg-time">{formatClock(message.ts)}</time>
            <button type="button" className="link-btn" onClick={copy}>
              <Icon name={copied ? 'check' : 'copy'} size={13} />
              <span>{copied ? 'Copied' : 'Copy reply'}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
