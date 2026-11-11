import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";

export function PollDisplay({
  pollId,
  question,
  options,
  userVoted,
}: {
  pollId: Id<"polls">;
  question: string;
  options: { index: number; text: string; votes: number; votedByMe: boolean }[];
  userVoted: boolean;
}) {
  const { token } = useAuth();
  const { pushToast } = useUI();
  const vote = useMutation(api.polls.votePoll);
  const [voting, setVoting] = useState(false);

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  const handleVote = (index: number) => {
    if (!token || voting || userVoted) return;
    setVoting(true);
    vote({ token, pollId, optionIndex: index })
      .then(() => {})
      .catch((err: Error) => pushToast(err.message, "error"))
      .finally(() => setVoting(false));
  };

  return (
    <div className="mt-2 rounded-lg border border-line bg-bg-2 p-3">
      <div className="mb-2 text-sm font-medium text-text">{question}</div>
      {options.map((opt) => {
        const pct = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
        return (
          <div key={opt.index} className="mb-2">
            <button
              onClick={() => handleVote(opt.index)}
              disabled={userVoted || voting}
              className={cn(
                "w-full flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors",
                userVoted
                  ? opt.votedByMe
                    ? "border-accent/50 bg-accent-dim/50"
                    : "border-line bg-bg-1"
                  : "border-line bg-bg-1 hover:border-line-strong hover:text-text",
                voting ? "opacity-60" : "",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-text">{opt.text}</span>
                {opt.votedByMe && (
                  <span className="h-3 w-3 rounded-full border border-accent bg-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-text-dim">
                  {opt.votes}
                </span>
                <div className="h-1.5 w-24 rounded-full bg-bg-3 overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-faint">
                  {pct.toFixed(0)}%
                </span>
              </div>
            </button>
          </div>
        );
      })}
      <div className="mt-2 text-[11px] text-text-faint">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
      </div>
    </div>
  );
}