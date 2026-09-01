import { EventEmitter } from "events";

class ChatEventEmitter extends EventEmitter {}

// Global singleton instance
declare global {
  var chatEmitter: ChatEventEmitter | undefined;
}

export const chatEmitter = globalThis.chatEmitter || new ChatEventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.chatEmitter = chatEmitter;
}
