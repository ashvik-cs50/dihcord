import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { MemberSidebar } from "@/components/layout/MemberSidebar";
import { VoiceJoinStub } from "@/components/layout/ChannelSidebar";
import type { Channel, Member, Message } from "@/types";

export function ChannelView({
  channel,
}: {
  channel: Channel | undefined;
}) {
  const { token, me } = useAuth();
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const serverId = channel?.serverId;
  const serverMembers = useQuery(
    api.memberships.listMembers,
    token && serverId ? { token, serverId } : "skip",
  ) as Member[] | undefined;

  const dmParticipants = useQuery(
    api.dms.getParticipants,
    token && channel?.type === "dm" ? { token, channelId: channel._id } : "skip",
  ) as Member[] | undefined;

  const members = serverMembers ?? dmParticipants;

  const canDeleteAny =
    !!members &&
    members.some((m) => m.userId === me?._id && m.role !== "member");

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-faint">
        Channel not found or you lack access.
      </div>
    );
  }

  if (channel.type === "voice") {
    return (
      <div className="flex flex-1 flex-col border-b-0">
        <ChatHeader channel={channel} subtitle="Voice channel" />
        <div className="flex flex-1 items-center justify-center">
          <VoiceJoinStub channelName={channel.name} />
        </div>
      </div>
    );
  }

  const authorNameOf = (userId: Id<"users">) => {
    const m = members?.find((x) => x.userId === userId);
    return m?.displayName ?? "Unknown";
  };

  const isDm = channel.type === "dm";
  const otherUser = isDm
    ? (dmParticipants ?? []).find((p) => p.userId !== me?._id) ?? null
    : null;
  const subtitle = isDm
    ? otherUser
      ? `@${otherUser.username}`
      : "Direct message"
    : `#${channel.name}`;

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          channel={channel}
          isDm={isDm}
          otherUser={otherUser}
          subtitle={subtitle}
        />
        <MessageList
          channelId={channel._id}
          members={members ?? []}
          canDeleteAny={canDeleteAny}
          onReply={(m) => setReplyTo(m)}
          serverId={serverId}
        />
        <Composer
          channelId={channel._id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          getAuthorName={authorNameOf}
        />
      </div>
      {!isDm && <MemberSidebar members={members} />}
    </div>
  );
}
