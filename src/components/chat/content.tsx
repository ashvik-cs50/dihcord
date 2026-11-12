import { Fragment, type ReactNode } from "react";
import { CustomEmojiSpan } from "./CustomEmojiSpan";

export type CustomEmoji = {
  name: string;
  url: string | null;
  animated: boolean;
};

const combined = /(https?:\/\/[^\s<>()]+)|(@[a-z0-9_]{3,24})/g;
const customEmojiRegex = /:([a-z0-9_]{2,32}):/g;

export function renderMessageContent(
  content: string,
  knownUsernames: Set<string>,
  meUsername?: string,
  onMentionClick?: (username: string) => void,
  emojis: Record<string, CustomEmoji> = {},
): ReactNode {
  if (!content) return null;
  const segments: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(combined.source, "g");
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...tokenize(content.slice(lastIndex, match.index), emojis));
    }
    const full = match[0];
    if (full.startsWith("http")) {
      segments.push(
        <a
          key={`seg-${segments.length}`}
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
            key={`seg-${segments.length}`}
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
        segments.push(...tokenize(full, emojis));
      }
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < content.length) {
    segments.push(...tokenize(content.slice(lastIndex), emojis));
  }

  return segments.map((segment, i) => (
    <Fragment key={`out-${i}`}>{withNewlines(segment)}</Fragment>
  ));
}

function tokenize(text: string, emojis: Record<string, CustomEmoji>): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = customEmojiRegex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const emoji = emojis[match[1]];
    if (emoji) {
      parts.push(
        <CustomEmojiSpan
          key={`emoji-${parts.length}`}
          name={emoji.name}
          url={emoji.url ?? null}
          animated={emoji.animated}
        />,
      );
    } else {
      parts.push(match[0]);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
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
