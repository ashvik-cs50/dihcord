export function CustomEmojiSpan({
  name,
  url,
  animated: _animated,
}: {
  name: string;
  url: string | null;
  animated: boolean;
}) {
  return (
    <span
      className="inline-flex items-center rounded-md border border-line/60 bg-bg-2/50 px-0.5"
      title={name}
    >
      {url ? (
        <img
          src={url}
          alt={`:${name}:`}
          className="h-5 w-5 rounded-sm object-cover"
          draggable={false}
          loading="lazy"
        />
      ) : (
        <span className="h-5 w-5 flex items-center justify-center rounded-sm text-[11px] font-medium text-text-dim">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}
