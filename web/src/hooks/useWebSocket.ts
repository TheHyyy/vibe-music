import { io, type Socket } from "socket.io-client";
import { onUnmounted, ref, type Ref } from "vue";
import { useRoomActions, useRoomSelector } from "@/stores/useRoomStore";
import type { QueueItem, RoomStatePayload } from "@/types/api";

type Ack<T> = { ok: true; data: T } | { ok: false; error: { message: string } };

export interface WebSocketClient {
  socket: Ref<any>;
  connect: () => void;
  disconnect: () => void;
  emitAck: <T>(event: string, body: unknown) => Promise<T>;
  emit: (event: string, body: unknown) => void;
}

export function useWebSocket(roomId: string): WebSocketClient {
  const actions = useRoomActions();
  const token = useRoomSelector((s) => s.token);
  const socketRef = ref<Socket | null>(null);

  function connect() {
    if (socketRef.value) return;
    const socket = io(import.meta.env.VITE_WS_BASE_URL || undefined, {
      transports: ["websocket"],
      auth: { token: token.value },
    });
    socketRef.value = socket;

    socket.on("connect", () => {
      socket.emit("room:join", { roomId }, (ack: Ack<RoomStatePayload>) => {
        if (ack && ack.ok) actions.hydrate(ack.data);
      });
    });

    socket.on("room:state", (payload: RoomStatePayload) => {
      actions.hydrate(payload);
    });

    socket.on("player:sync", (state) => {
      actions.setPlayback(state);
    });

    socket.on(
      "queue:update",
      (payload: { mode: "replace" | "patch"; queue: QueueItem[] }) => {
        actions.setQueue(payload.queue);
      },
    );

    socket.on(
      "vote:update",
      (payload: { itemId: string; voteScore: number }) => {
        actions.updateVote(payload.itemId, payload.voteScore);
      },
    );

    socket.on("user:kicked", (payload: { reason?: string }) => {
      actions.setKicked(payload.reason);
    });
  }

  function disconnect() {
    socketRef.value?.disconnect();
    socketRef.value = null;
  }

  async function emitAck<T>(event: string, body: unknown) {
    connect();
    const socket = socketRef.value;
    if (!socket) throw new Error("Socket not connected");
    return await new Promise<T>((resolve, reject) => {
      socket.emit(event, body, (ack: Ack<T>) => {
        if (!ack) {
          reject(new Error("Request failed"));
          return;
        }
        if (ack.ok) {
          resolve(ack.data);
          return;
        }
        reject(
          new Error((ack as Extract<Ack<T>, { ok: false }>).error.message),
        );
      });
    });
  }

  function emit(event: string, body: unknown) {
    socketRef.value?.emit(event, body);
  }

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket: socketRef,
    connect,
    disconnect,
    emitAck,
    emit,
  };
}
