import { Suspense, lazy, useEffect } from "react";
import { useQuery } from "convex/react";
import { Outlet, useNavigate, useParams } from "react-router";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { ServerSidebar } from "@/components/layout/ServerSidebar";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";
import { HomeSidebar } from "@/components/layout/HomeSidebar";
import { ChannelView } from "@/components/chat/ChannelView";
import { FriendsPage } from "@/components/home/FriendsPage";
import type { Channel, ServerDetail } from "@/types";

const CreateServerModal = lazy(() =>
  import("@/components/modals/ServerModals").then((m) => ({
    default: m.CreateServerModal,
  })),
);
const JoinServerModal = lazy(() =>
  import("@/components/modals/ServerModals").then((m) => ({
    default: m.JoinServerModal,
  })),
);
const ExploreModal = lazy(() =>
  import("@/components/modals/ServerModals").then((m) => ({
    default: m.ExploreModal,
  })),
);
const CreateChannelModal = lazy(() =>
  import("@/components/modals/ServerModals").then((m) => ({
    default: m.CreateChannelModal,
  })),
);
const EditChannelModal = lazy(() =>
  import("@/components/modals/ServerModals").then((m) => ({
    default: m.EditChannelModal,
  })),
);
const InviteModal = lazy(() =>
  import("@/components/modals/ServerModals").then((m) => ({
    default: m.InviteModal,
  })),
);
const ServerSettingsModal = lazy(() =>
  import("@/components/modals/ServerModals").then((m) => ({
    default: m.ServerSettingsModal,
  })),
);
const ProfileModal = lazy(() =>
  import("@/components/modals/UserModals").then((m) => ({
    default: m.ProfileModal,
  })),
);
const SettingsContent = lazy(() =>
  import("@/components/settings/SettingsContent").then((m) => ({
    default: m.SettingsContent,
  })),
);
const ProfileEditor = lazy(() =>
  import("@/components/modals/ProfileEditor").then((m) => ({
    default: m.ProfileEditor,
  })),
);
const ServerEmojiManager = lazy(() =>
  import("@/components/modals/ServerEmojiManager").then((m) => ({
    default: m.ServerEmojiManager,
  })),
);
const PersonalEmojiManager = lazy(() =>
  import("@/components/modals/PersonalEmojiManager").then((m) => ({
    default: m.PersonalEmojiManager,
  })),
);
const SearchModal = lazy(() =>
  import("@/components/modals/SearchModal").then((m) => ({
    default: m.SearchModal,
  })),
);
const ThemeEditor = lazy(() =>
  import("@/components/customization/ThemeEditor").then((m) => ({
    default: m.ThemeEditor,
  })),
);

export function ModalRoot({
  currentServerId,
  currentChannelId,
  server,
}: {
  currentServerId?: string;
  currentChannelId?: string;
  server?: ServerDetail;
}) {
  const { modal } = useUI();
  const { token } = useAuth();

  const serverDetail = useQuery(
    api.servers.get,
    token && currentServerId ? { token, serverId: currentServerId as Id<"servers"> } : "skip",
  ) as ServerDetail | null | undefined;

  const activeServer = server ?? serverDetail ?? undefined;

  return (
    <Suspense fallback={null}>
      <CreateServerModal />
      <JoinServerModal />
      <ExploreModal />
      {modal === "createChannel" && (
        <CreateChannelModal server={activeServer} />
      )}
      {modal === "editChannel" && <EditChannelModal />}
      {modal === "invite" && <InviteModal server={activeServer} />}
      {modal === "serverSettings" && (
        <ServerSettingsModal server={activeServer} />
      )}
      {modal === "profile" && <ProfileModal />}
      {modal === "settings" && <SettingsContent />}
      {modal === "profileEditor" && <ProfileEditor />}
      {modal === "serverEmojiManager" && <ServerEmojiManager server={server} />}
      {modal === "personalEmojiManager" && <PersonalEmojiManager />}
      {modal === "search" && (
        <SearchModal
          currentServerId={currentServerId}
          currentChannelId={currentChannelId}
        />
      )}
      {modal === "themeEditor" && <ThemeEditor open onClose={closeModal} />}
    </Suspense>
  );
}

export function AppShell() {
  return (
    <div className="flex h-full">
      <ServerSidebar />
      <Outlet />
    </div>
  );
}

export function ServerPage() {
  const { token } = useAuth();
  const { serverId, channelId } = useParams();
  const navigate = useNavigate();

  const server = useQuery(
    api.servers.get,
    token && serverId ? { token, serverId: serverId as Id<"servers"> } : "skip",
  ) as ServerDetail | null | undefined;

  const channels = useQuery(
    api.channels.listByServer,
    token && serverId ? { token, serverId: serverId as Id<"servers"> } : "skip",
  ) as Channel[] | undefined;

  // Auto-navigate to first text channel
  useEffect(() => {
    if (channels && channels.length > 0 && !channelId) {
      const firstText = channels.find((c) => c.type === "text");
      if (firstText && serverId) {
        navigate(`/channels/${serverId}/${firstText._id}`, { replace: true });
      }
    }
  }, [channels, channelId, serverId, navigate]);

  const activeChannel = channels?.find((c) => c._id === channelId);

  return (
    <>
      <ChannelSidebar
        channels={channels}
        server={server === null ? undefined : server}
      />
      <main className="flex min-w-0 flex-1 flex-col bg-bg-0">
        {serverId && channels === undefined ? (
          <div className="flex flex-1 items-center justify-center text-sm text-text-faint">
            Loading server…
          </div>
        ) : server === null ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-text-faint">
            <p>You are not a member of this server.</p>
            <button
              onClick={() => navigate("/@me")}
              className="text-accent hover:underline"
            >
              Go home
            </button>
          </div>
        ) : (
          <ChannelView channel={activeChannel} />
        )}
      </main>
      <ModalRoot currentServerId={serverId} currentChannelId={channelId} server={server ?? undefined} />
    </>
  );
}

export function HomePage() {
  return (
    <>
      <HomeSidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-bg-0">
        <FriendsPage />
      </main>
      <ModalRoot />
    </>
  );
}

export function DmPage() {
  const { token } = useAuth();
  const { channelId } = useParams();

  const channel = useQuery(
    api.channels.getChannel,
    token && channelId ? { token, channelId: channelId as Id<"channels"> } : "skip",
  ) as Channel | null | undefined;

  return (
    <>
      <HomeSidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-bg-0">
        <ChannelView channel={channel ?? undefined} />
      </main>
      <ModalRoot currentChannelId={channelId} />
    </>
  );
}
