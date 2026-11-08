import type { MapIssue } from '@dday/engine';

interface IssuesPanelProps {
  issues: readonly MapIssue[];
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export function IssuesPanel({ issues, selected, onSelect }: IssuesPanelProps) {
  if (issues.length === 0) return <p className="palette-hint">No problems found.</p>;
  const errors = issues.filter(({ level }) => level === 'error').length;
  return (
    <>
      <p className="palette-hint">
        {errors} {errors === 1 ? 'error' : 'errors'}, {issues.length - errors}{' '}
        {issues.length - errors === 1 ? 'warning' : 'warnings'}. Click one to show it.
      </p>
      <ul className="issues">
        {issues.map(({ level, message, hexes }, index) => (
          <li key={`${index}:${message}`}>
            <button
              type="button"
              aria-pressed={index === selected}
              disabled={hexes.length === 0}
              onClick={() => onSelect(index === selected ? null : index)}
            >
              <span className={`issue-level ${level}`}>{level === 'error' ? '✕' : '!'}</span>
              {message}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
