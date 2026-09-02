"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Send, Paperclip, Search, Users, Shield, MessageSquare, 
  Trash2, X, FileText, CheckCircle2, ChevronLeft, CalendarRange
} from "lucide-react";

import AiLoader from "@/components/AiLoader";

export default function ChatPage() {
  return (
    <Suspense fallback={<AiLoader label="Connecting to Real-time Neural Chat..." sublabel="Establishing encrypted peer sync" />}>
      <ChatContent />
    </Suspense>
  );
}

// Global in-memory cache for instant switching between pages/chats
const globalChatCache = {
  conversations: null as any[] | null,
  teamMembers: null as any[] | null,
  messagesByConv: {} as Record<string, any[]>
};

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("id");

  // State variables with cached initial states for instant 0ms render
  const [conversations, setConversations] = useState<any[]>(globalChatCache.conversations || []);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<any[]>(
    initialConvId && globalChatCache.messagesByConv[initialConvId] 
      ? globalChatCache.messagesByConv[initialConvId] 
      : []
  );
  const [teamMembers, setTeamMembers] = useState<any[]>(globalChatCache.teamMembers || []);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loadingConv, setLoadingConv] = useState(!globalChatCache.conversations);
  const [loadingMsg, setLoadingMsg] = useState(
    Boolean(initialConvId && !globalChatCache.messagesByConv[initialConvId])
  );
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Attachment states
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current user
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMe();
  }, [router]);

  // Load team members
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          globalChatCache.teamMembers = data.users || [];
          setTeamMembers(data.users || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeam();
  }, []);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        const convList = data.conversations || [];
        globalChatCache.conversations = convList;
        setConversations(convList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // Fetch messages for active conversation with 0ms cache-first rendering
  const fetchMessages = async (convId: string) => {
    // If cached, show cached immediately without loader
    if (globalChatCache.messagesByConv[convId]) {
      setMessages(globalChatCache.messagesByConv[convId]);
      setLoadingMsg(false);
    } else {
      setLoadingMsg(true);
    }

    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        const msgList = data.messages || [];
        globalChatCache.messagesByConv[convId] = msgList;
        setMessages(msgList);
        
        // Mark conversation as read in background
        fetch(`/api/chat/conversations/${convId}/read`, { method: "POST" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsg(false);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  // Real-time Event Listener using Server-Sent Events (SSE) + 3s Polling Fallback
  useEffect(() => {
    if (!currentUser) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/chat/realtime");

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === "message") {
            const newMsg = payload.data;
            
            // Append message if active
            if (newMsg.conversationId === activeConvId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                const next = [...prev.filter((m) => !m.pending || m.id !== newMsg.id), newMsg];
                globalChatCache.messagesByConv[newMsg.conversationId] = next;
                return next;
              });
              // Mark as read instantly on active conversation
              fetch(`/api/chat/conversations/${activeConvId}/read`, { method: "POST" });
            } else {
              // Update cache for other conversations
              if (globalChatCache.messagesByConv[newMsg.conversationId]) {
                const existing = globalChatCache.messagesByConv[newMsg.conversationId];
                if (!existing.some(m => m.id === newMsg.id)) {
                  globalChatCache.messagesByConv[newMsg.conversationId].push(newMsg);
                }
              }
            }
            // Refresh list to show latest message / unread counts
            fetchConversations();
          } else if (payload.type === "delete") {
            const deleteData = payload.data;
            if (deleteData.conversationId === activeConvId) {
              setMessages((prev) => {
                const updated = prev.filter((m) => m.id !== deleteData.id);
                globalChatCache.messagesByConv[deleteData.conversationId] = updated;
                return updated;
              });
            }
          } else if (payload.type === "read") {
            const readData = payload.data;
            if (readData.conversationId === activeConvId) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.senderId === readData.userId) return m;
                  // Add read status
                  const alreadyRead = m.reads.some((r: any) => r.userId === readData.userId);
                  if (alreadyRead) return m;
                  return {
                    ...m,
                    reads: [...m.reads, { userId: readData.userId, readAt: readData.readAt }]
                  };
                })
              );
            }
          }
        } catch (err) {
          console.error("Failed to parse SSE payload:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE stream error, relying on sync polling:", err);
      };
    } catch (e) {
      console.error("SSE init failed:", e);
    }

    // Resilient background syncing every 3.5 seconds
    const interval = setInterval(() => {
      if (activeConvId) {
        fetch(`/api/chat/conversations/${activeConvId}/messages`)
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.messages) {
              setMessages((prev) => {
                const pendingOnly = prev.filter(m => m.pending);
                const merged = [...data.messages, ...pendingOnly.filter(p => !data.messages.some((m: any) => m.content === p.content && Math.abs(new Date(m.createdAt).getTime() - new Date(p.createdAt).getTime()) < 10000))];
                globalChatCache.messagesByConv[activeConvId] = merged;
                return merged;
              });
            }
          })
          .catch(() => {});
      }
      fetchConversations();
    }, 3500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [currentUser, activeConvId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send message with instant optimistic UI update
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && attachments.length === 0) return;
    if (!activeConvId || !currentUser) return;

    const currentText = messageText;
    const currentAttachments = [...attachments];

    // Create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      conversationId: activeConvId,
      content: currentText,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      attachments: currentAttachments.map((a, i) => ({
        id: `temp-att-${i}`,
        fileName: a.name,
        fileType: a.type,
        storagePath: ""
      })),
      reads: [{ userId: currentUser.id, readAt: new Date().toISOString() }],
      pending: true
    };

    // Instant append
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText("");
    setAttachments([]);

    const payload = {
      content: currentText,
      attachments: currentAttachments.map((a) => ({
        fileName: a.name,
        fileType: a.type,
        base64: a.base64
      }))
    };

    try {
      const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to send message");
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => {
            const updated = prev.map((m) => (m.id === tempId ? data.message : m));
            if (activeConvId) globalChatCache.messagesByConv[activeConvId] = updated;
            return updated;
          });
        }
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Start 1-to-1 chat with a user
  const handleStartDirectChat = async (userId: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "DIRECT", recipientId: userId })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConvId(data.conversationId);
        setSearchQuery("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle attachment selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds the 10MB file limit.`);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            base64: base64String
          }
        ]);
      };
    });
  };

  // Handle 0ms instant delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    // Instant optimistic removal from UI
    setMessages((prev) => prev.filter((m) => m.id !== msgId));

    try {
      const res = await fetch(`/api/chat/messages/${msgId}/delete`, {
        method: "POST"
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to delete message");
        if (activeConvId) fetchMessages(activeConvId);
      }
    } catch (err) {
      console.error(err);
      if (activeConvId) fetchMessages(activeConvId);
    }
  };

  // Handle 0ms instant delete or clear conversation
  const handleDeleteConversation = async (convId: string, convName: string) => {
    if (!confirm(`Are you sure you want to delete chat with "${convName}"? All message history will be cleared.`)) return;

    // Instant optimistic UI cleanup
    delete globalChatCache.messagesByConv[convId];
    if (globalChatCache.conversations) {
      globalChatCache.conversations = globalChatCache.conversations.filter(c => c.id !== convId);
    }
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
      router.replace("/dashboard/chat");
    }

    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to delete conversation");
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
      fetchConversations();
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter team members for starting new chats
  const filteredTeam = searchQuery.trim()
    ? teamMembers.filter(
        (m) =>
          m.id !== currentUser?.id &&
          m.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div style={styles.container} className="crm-chat-container">
      {/* Sidebar - LEFT PANEL */}
      <div 
        style={styles.sidebar} 
        className={`crm-chat-sidebar ${activeConvId ? "hide-on-mobile" : "show-on-mobile"}`}
      >
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search chats or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Search Results / Start New Chat List */}
        {searchQuery.trim() !== "" && filteredTeam.length > 0 && (
          <div style={styles.sectionHeader}>
            <span>Start Direct Chat</span>
          </div>
        )}
        {searchQuery.trim() !== "" &&
          filteredTeam.map((member) => (
            <div
              key={member.id}
              onClick={() => handleStartDirectChat(member.id)}
              style={styles.convItem}
            >
              <div style={styles.avatar}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div style={styles.convInfo}>
                <div style={styles.convName}>{member.name}</div>
                <div style={styles.convRole}>{member.roleName || "Team"}</div>
              </div>
            </div>
          ))}

        {/* Existing Conversations List */}
        <div style={styles.sectionHeader}>
          <span>Conversations</span>
        </div>

        <div style={styles.scrollList}>
          {loadingConv ? (
            <AiLoader size="sm" label="Scanning Channels..." sublabel="Connecting to secure sockets" />
          ) : filteredConversations.length === 0 ? (
            <div style={styles.emptyList}>No chats found</div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveConvId(c.id);
                    // Add URL param for navigation persistence
                    router.replace(`/dashboard/chat?id=${c.id}`);
                  }}
                  style={{
                    ...styles.convItem,
                    backgroundColor: isActive ? "var(--bg-primary)" : "transparent",
                    borderLeft: isActive ? "3px solid var(--primary-color)" : "3px solid transparent"
                  }}
                >
                  <div style={styles.avatar}>
                    {c.type === "PROJECT" ? "P" : c.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.convInfo}>
                    <div style={styles.convHeader}>
                      <div style={styles.convName}>{c.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={styles.convTime}>
                          {c.lastMessage
                            ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : ""}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(c.id, c.name);
                          }}
                          style={{
                            border: "none",
                            background: "none",
                            color: "var(--text-tertiary)",
                            cursor: "pointer",
                            padding: "2px",
                            display: "flex",
                            alignItems: "center"
                          }}
                          title="Delete this chat"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div style={styles.convSubHeader}>
                      <div style={styles.convLastMessage}>
                        {c.lastMessage ? c.lastMessage.content : "No messages yet"}
                      </div>
                      {c.unreadCount > 0 && (
                        <div style={styles.unreadBadge}>{c.unreadCount}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Right panel */}
      <div 
        style={styles.chatArea}
        className={`crm-chat-area ${activeConvId ? "active-open" : ""}`}
      >
        {activeConvId && activeConversation ? (
          <>
            {/* Chat header */}
            <div style={styles.chatHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button 
                  onClick={() => setActiveConvId(null)} 
                  style={styles.mobileBackBtn}
                >
                  <ChevronLeft size={20} />
                </button>
                <div style={styles.avatar}>
                  {activeConversation.type === "PROJECT" ? "P" : activeConversation.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.activeChatName}>{activeConversation.name}</div>
                  <div style={styles.activeChatStatus}>
                    {activeConversation.type === "PROJECT" ? "Project Workspace" : "Online"}
                  </div>
                </div>
              </div>

              {/* Chat action buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  onClick={() => handleDeleteConversation(activeConversation.id, activeConversation.name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "0.75rem",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-primary)",
                    backgroundColor: "transparent",
                    color: "var(--danger-color)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  title="Delete entire chat history"
                >
                  <Trash2 size={14} />
                  <span>Delete Chat</span>
                </button>
              </div>
            </div>

            {/* Chat Message History */}
            <div style={styles.messageHistory}>
              {loadingMsg ? (
                <AiLoader size="sm" label="Decrypting Thread Messages..." sublabel="Loading encrypted message stream" />
              ) : messages.length === 0 ? (
                <div style={styles.centered}>Send a message to start the conversation!</div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === currentUser?.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        ...styles.messageRow,
                        justifyContent: isMe ? "flex-end" : "flex-start"
                      }}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          backgroundColor: isMe ? "var(--primary-color)" : "var(--bg-secondary)",
                          color: isMe ? "#ffffff" : "var(--text-primary)"
                        }}
                      >
                        {!isMe && (
                          <div style={styles.messageSender}>{m.senderName}</div>
                        )}
                        <div style={styles.messageContent}>{m.content}</div>

                        {/* Attachments rendering */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div style={styles.attachmentWrapper}>
                            {m.attachments.map((att: any) => {
                              const isImage = att.fileType.startsWith("image/");
                              return (
                                <div key={att.id} style={styles.attachmentItem}>
                                  {isImage ? (
                                    <a href={`/api/chat/attachments/${att.id}`} target="_blank" rel="noopener noreferrer">
                                      <img 
                                        src={`/api/chat/attachments/${att.id}`} 
                                        alt={att.fileName} 
                                        style={styles.attachmentImage} 
                                      />
                                    </a>
                                  ) : (
                                    <a 
                                      href={`/api/chat/attachments/${att.id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{
                                        ...styles.attachmentFileLink,
                                        color: isMe ? "#ffffff" : "var(--primary-color)"
                                      }}
                                    >
                                      <FileText size={16} />
                                      <span style={{ fontSize: "0.75rem", textDecoration: "underline" }}>
                                        {att.fileName}
                                      </span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={styles.messageFooter}>
                          <span style={styles.messageTime}>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          {isMe && !m.isDeleted && (
                            <button
                              onClick={() => handleDeleteMessage(m.id)}
                              style={styles.deleteBtn}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message composer */}
            <form onSubmit={handleSendMessage} style={styles.composer}>
              {/* Render staged attachments */}
              {attachments.length > 0 && (
                <div style={styles.stagedAttachments}>
                  {attachments.map((att, idx) => (
                    <div key={idx} style={styles.stagedItem}>
                      <FileText size={14} />
                      <span style={styles.stagedName}>{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                        style={styles.stagedRemove}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.inputWrapper}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.actionBtn}
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={styles.messageInput}
                />

                <button type="submit" style={styles.sendBtn}>
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={styles.noActiveChat}>
            <MessageSquare size={48} style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }} />
            <h3>Your Messages</h3>
            <p>Select a conversation or search for a team member to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    height: "calc(100vh - 70px)",
    width: "100%",
    backgroundColor: "var(--bg-primary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "12px",
    overflow: "hidden"
  },
  sidebar: {
    width: "320px",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid var(--border-primary)",
    backgroundColor: "var(--bg-secondary)"
  },
  searchContainer: {
    padding: "1rem",
    borderBottom: "1px solid var(--border-primary)"
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  searchIcon: {
    position: "absolute",
    left: "0.75rem",
    color: "var(--text-tertiary)"
  },
  searchInput: {
    width: "100%",
    padding: "0.5rem 0.5rem 0.5rem 2.25rem",
    borderRadius: "6px",
    border: "1px solid var(--border-primary)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none"
  },
  sectionHeader: {
    padding: "0.75rem 1rem 0.25rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  scrollList: {
    flex: 1,
    overflowY: "auto",
    padding: "0.5rem"
  },
  convItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginBottom: "0.25rem"
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color)",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "1rem"
  },
  convInfo: {
    flex: 1,
    overflow: "hidden"
  },
  convHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "0.25rem"
  },
  convName: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  convTime: {
    fontSize: "0.75rem",
    color: "var(--text-tertiary)"
  },
  convSubHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  convLastMessage: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1
  },
  unreadBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "18px",
    height: "18px",
    borderRadius: "9px",
    backgroundColor: "var(--danger-color)",
    color: "#ffffff",
    fontSize: "0.675rem",
    fontWeight: 600,
    padding: "0 4px",
    marginLeft: "0.5rem"
  },
  convRole: {
    fontSize: "0.75rem",
    color: "var(--text-tertiary)"
  },
  emptyList: {
    padding: "2rem",
    textAlign: "center",
    color: "var(--text-tertiary)",
    fontSize: "0.875rem"
  },
  centered: {
    padding: "2rem",
    textAlign: "center",
    color: "var(--text-secondary)"
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--bg-primary)"
  },
  chatHeader: {
    padding: "0.75rem 1.5rem",
    borderBottom: "1px solid var(--border-primary)",
    backgroundColor: "var(--bg-secondary)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  mobileBackBtn: {
    display: "none",
    border: "none",
    background: "none",
    color: "var(--text-primary)",
    cursor: "pointer",
    padding: 0
  },
  activeChatName: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-primary)"
  },
  activeChatStatus: {
    fontSize: "0.75rem",
    color: "#10b981"
  },
  messageHistory: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  messageRow: {
    display: "flex",
    width: "100%"
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    position: "relative"
  },
  messageSender: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--primary-color)",
    marginBottom: "0.25rem"
  },
  messageContent: {
    fontSize: "0.875rem",
    lineHeight: "1.4",
    wordBreak: "break-word"
  },
  messageFooter: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "0.25rem",
    fontSize: "0.675rem",
    opacity: 0.8
  },
  messageTime: {
    fontSize: "0.675rem"
  },
  deleteBtn: {
    border: "none",
    background: "none",
    color: "var(--danger-color)",
    cursor: "pointer",
    opacity: 0.6,
    padding: 0,
    transition: "opacity 0.2s ease"
  },
  composer: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid var(--border-primary)",
    backgroundColor: "var(--bg-secondary)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  stagedAttachments: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem"
  },
  stagedItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    backgroundColor: "var(--bg-primary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "4px",
    padding: "0.25rem 0.5rem",
    fontSize: "0.75rem"
  },
  stagedName: {
    color: "var(--text-secondary)",
    maxWidth: "120px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  stagedRemove: {
    border: "none",
    background: "none",
    color: "var(--danger-color)",
    cursor: "pointer",
    padding: 0
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem"
  },
  actionBtn: {
    border: "none",
    background: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "0.25rem",
    transition: "color 0.2s ease"
  },
  messageInput: {
    flex: 1,
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    border: "1px solid var(--border-primary)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none"
  },
  sendBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--primary-color)",
    color: "#ffffff",
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },
  noActiveChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
    padding: "2rem",
    textAlign: "center"
  },
  attachmentWrapper: {
    marginTop: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  attachmentItem: {
    maxWidth: "100%",
    borderRadius: "4px",
    overflow: "hidden"
  },
  attachmentImage: {
    maxWidth: "200px",
    maxHeight: "150px",
    borderRadius: "4px",
    border: "1px solid var(--border-primary)",
    objectFit: "cover"
  },
  attachmentFileLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.75rem",
    fontWeight: 500
  }
};
