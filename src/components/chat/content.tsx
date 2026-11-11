import { Fragment, type ReactNode } from "react";

const combined = /(https?:\/\/[^\s<>()]+)|(@[a-z0-9_]{3,24})/g;

export function renderMessageContent(
  content: string,
  knownUsernames: Set<string>,
  meUsername?: string,
  onMentionClick?: (username: string) => void,
): ReactNode {
  if (!content) return null;
  const segments: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(combined.source, "g");
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push(content.slice(lastIndex, match.index));
    }
    const full = match[0];
    if (full.startsWith("http")) {
      segments.push(
        <a
          href={full}
          target="_blank"
          rel="noreferrer noopener"
          className="msg-link"
        >
          {full}
        </a>,
      );
    } else {
      const username = full.slice(1);
      if (knownUsernames.has(username)) {
        const isMe = username === meUsername;
        segments.push(
          <span
            onClick={() => onMentionClick?.(username)}
            className="msg-mention"
            style={
              isMe
                ? { background: "rgba(232,193,82,0.25)", color: "#ffe08a" }
                : undefined
            }
          >
            {full}
          </span>,
        );
      } else {
        segments.push(full);
      }
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < content.length) {
    segments.push(content.slice(lastIndex));
  }

  return segments.map((segment, i) => (
    <Fragment key={i}>{withNewlines(segment)}</Fragment>
  ));
}

function withNewlines(segment: ReactNode): ReactNode {
  if (typeof segment !== "string") return segment;
  const lines = segment.split("\n");
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}
