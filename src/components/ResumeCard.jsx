import { useState } from 'react';
import Icon from './Icon.jsx';

export default function ResumeCard({ link }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the visible link below still works */
    }
  }
  return (
    <aside className="resume-card" aria-label="Generated resume">
      <Icon name="document" tile size={20} />
      <div className="resume-card-body">
        <div className="resume-card-title">{link.fileName}</div>
        <div className="resume-card-sub">Resume ready. The download link is temporary.</div>
      </div>
      <div className="resume-card-actions">
        <a className="btn btn-primary btn-small" href={link.url} download={link.fileName} target="_blank" rel="noopener noreferrer">
          <Icon name="download" size={14} />
          <span>Download .docx</span>
        </a>
        <button type="button" className="btn btn-ghost btn-small" onClick={copy} aria-label="Copy download link">
          <Icon name={copied ? 'check' : 'copy'} size={14} />
          <span>{copied ? 'Copied' : 'Copy link'}</span>
        </button>
      </div>
    </aside>
  );
}
