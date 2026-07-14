import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

let globalSocket = null;

/**
 * Custom React hook for CRM Socket.IO connection.
 * Connects once per session using admin JWT cookie auth.
 * Supports reconnect with state resync and browser notifications.
 */
export function useSocket({
  onMessageNew,
  onMessageStatus,
  onMessagesRead,
  onChatStatusChanged,
  onChatDeleted,
  onCustomerUpdated,
  onTyping,
  onTestEvent,
} = {}) {
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);

  const handleNewMessage = useCallback((data) => {
    // Browser notification if page not focused
    const hasNotifications = typeof window !== "undefined" && "Notification" in window;
    if (document.visibilityState !== "visible" && hasNotifications && window.Notification.permission === "granted") {
      const preview = typeof data.message?.body === "string"
        ? data.message.body.substring(0, 60)
        : "[Media message]";
      new window.Notification(`💬 ${data.customer?.name || "Customer"}`, {
        body: preview,
        icon: "/favicon.ico",
      });
    }
    onMessageNew?.(data);
  }, [onMessageNew]);

  useEffect(() => {
    // Request browser notification permission
    const hasNotifications = typeof window !== "undefined" && "Notification" in window;
    if (hasNotifications && window.Notification.permission === "default") {
      window.Notification.requestPermission();
    }

    // Reuse existing socket if already connected
    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        auth: {
          // token is sent via cookie automatically; this is a fallback for non-cookie envs
          token: localStorage.getItem("admin_token") || "",
        },
      });
    } else {
      if (globalSocket.auth) {
        globalSocket.auth.token = localStorage.getItem("admin_token") || "";
      }
    }

    socketRef.current = globalSocket;
    const socket = socketRef.current;

    // Reconnect resync — re-fetch should be triggered from calling component
    socket.on("connect", () => {
      console.log("🔌 Socket.IO CRM Connected:", socket.id);
      clearTimeout(reconnectTimer.current);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔌 Socket.IO CRM Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("🔌 Socket.IO Connect Error:", err.message);
    });

    // CRM event listeners
    socket.on("message_new", handleNewMessage);
    socket.on("message_status", onMessageStatus || (() => {}));
    socket.on("messages_read", onMessagesRead || (() => {}));
    socket.on("chat_status_changed", onChatStatusChanged || (() => {}));
    socket.on("chat_deleted", onChatDeleted || (() => {}));
    socket.on("customer_updated", onCustomerUpdated || (() => {}));
    socket.on("typing", onTyping || (() => {}));
    socket.on("test_event", onTestEvent || ((d) => console.log("🧪 Test Socket Event:", d)));

    return () => {
      socket.off("message_new", handleNewMessage);
      socket.off("message_status");
      socket.off("messages_read");
      socket.off("chat_status_changed");
      socket.off("chat_deleted");
      socket.off("customer_updated");
      socket.off("typing");
      socket.off("test_event");
    };
  }, [handleNewMessage, onMessageStatus, onMessagesRead, onChatStatusChanged, onChatDeleted, onCustomerUpdated, onTyping, onTestEvent]);

  /**
   * Emit typing indicator to other admins viewing the same chat
   */
  const emitTyping = useCallback((customerId, isTyping) => {
    socketRef.current?.emit("typing", { customerId, isTyping });
  }, []);

  /**
   * Returns current connection status
   */
  const isConnected = () => socketRef.current?.connected || false;

  return { emitTyping, isConnected };
}
