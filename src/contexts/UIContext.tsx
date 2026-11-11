import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Id } from "@convex/_generated/dataModel";

export type ModalType =
  | "createServer"
  | "joinServer"
  | "explore"
  | "createChannel"
  | "editChannel"
  | "invite"
  | "settings"
  | "profile"
  | "search"
  | "serverSettings"
  | "profileEditor"
  | "serverEmojiManager";

export type ModalPayload = {
  serverId?: Id<"servers">;
  serverName?: string;
  channelId?: Id<"channels">;
  channelName?: string;
  channelType?: "text" | "voice";
  category?: string;
  userId?: Id<"users">;
};

export type Toast = {
  id: number;
  message: string;
  kind: "info" | "error" | "success";
};

type UIContextValue = {
  modal: ModalType | null;
  modalPayload: ModalPayload;
  openModal: (type: ModalType, payload?: ModalPayload) => void;
  closeModal: () => void;
  toasts: Toast[];
  pushToast: (message: string, kind?: Toast["kind"]) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

let toastSeq = 1;

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalType | null>(null);
  const [modalPayload, setModalPayload] = useState<ModalPayload>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  const openModal = useCallback((type: ModalType, payload?: ModalPayload) => {
    setModalPayload(payload ?? {});
    setModal(type);
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const pushToast = useCallback(
    (message: string, kind: Toast["kind"] = "info") => {
      const id = toastSeq++;
      setToasts((prev) => [...prev.slice(-4), { id, message, kind }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    [],
  );

  const value = useMemo(
    () => ({ modal, modalPayload, openModal, closeModal, toasts, pushToast }),
    [modal, modalPayload, openModal, closeModal, toasts, pushToast],
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className={
                "pointer-events-auto rounded-md border px-3.5 py-2.5 text-sm shadow-lg " +
                (t.kind === "error"
                  ? "border-danger/40 bg-[#2a1a1a] text-[#ff9c9c]"
                  : t.kind === "success"
                    ? "border-accent/40 bg-[#12281d] text-[#9cf2c6]"
                    : "border-line-strong bg-bg-3 text-text")
              }
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
