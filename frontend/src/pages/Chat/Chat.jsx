import { useEffect, useMemo, useRef, useState } from "react";
import {
  Edit3,
  File,
  Image,
  Mic,
  Paperclip,
  Pin,
  Search,
  Send,
  Smile,
  Trash2,
  Users,
  X,
} from "lucide-react";
import AppShell from "../../components/AppShell";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/socketContext.jsx";
import {
  createGroupChat,
  createPrivateChat,
  deleteChatMessage,
  editChatMessage,
  getMessages,
  listChatGroups,
  listChats,
  markChatRead,
  searchChatUsers,
  searchMessages,
  sendChatMessage,
  togglePinnedMessage,
} from "../../services/chatService";

const EMOJIS = ["👍", "👏", "✅", "🎓", "📌", "💬", "🙌", "🚀"];

function displayName(user) {
  return user?.name || user?.email?.split("@")[0] || "Unknown";
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function otherParticipant(chat, auth) {
  return chat?.participants?.find((user) => user.email !== auth?.email) || chat?.participants?.[0];
}

function chatTitle(chat, auth) {
  if (!chat) return "Select a chat";
  if (chat.type === "GROUP") return chat.name || chat.group?.name || "Group chat";
  return displayName(otherParticipant(chat, auth));
}

function getChatId(value) {
  return value?._id || value?.toString?.() || value;
}

export default function Chat() {
  const { auth } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [query, setQuery] = useState("");
  const [messageQuery, setMessageQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [editing, setEditing] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [messageResults, setMessageResults] = useState([]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat._id === activeChatId),
    [activeChatId, chats]
  );

  const activeChatName = chatTitle(activeChat, auth);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [chatResponse, userResponse, groupResponse] = await Promise.all([
          listChats(roleFilter ? { role: roleFilter } : {}),
          searchChatUsers({ role: roleFilter || undefined }),
          auth?.role === "ADMIN" ? listChatGroups() : Promise.resolve({ data: [] }),
        ]);
        setChats(chatResponse.data || []);
        setUsers(userResponse.data || []);
        setGroups(groupResponse.data || []);
        setActiveChatId((current) => current || chatResponse.data?.[0]?._id || "");
      } catch (error) {
        setChats([]);
        setUsers([]);
        setGroups([]);
        setLoadError(error?.response?.data?.message || "Unable to load chats right now.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth?.role, roleFilter]);

  useEffect(() => {
    if (!activeChatId) return;
    async function loadMessages() {
      const response = await getMessages(activeChatId);
      setMessages(response.data || []);
      await markChatRead(activeChatId);
      socket?.emit("chat:join", activeChatId);
      socket?.emit("messages:read", { chatId: activeChatId });
    }
    loadMessages();
  }, [activeChatId, socket]);

  useEffect(() => {
    if (!socket) return undefined;

    const onNewMessage = (message) => {
      if (getChatId(message.chat) !== activeChatId) return;
      setMessages((items) => [...items, message]);
      markChatRead(activeChatId).catch(() => {});
    };

    const onUpdatedMessage = (message) => {
      setMessages((items) => items.map((item) => (item._id === message._id ? message : item)));
    };

    const onDeletedMessage = ({ messageId }) => {
      setMessages((items) =>
        items.map((item) => (item._id === messageId ? { ...item, text: "", attachments: [], isDeleted: true } : item))
      );
    };

    const onTyping = ({ chatId, user, typing }) => {
      if (chatId !== activeChatId || user.email === auth?.email) return;
      setTypingUser(typing ? user : null);
      if (typing) window.setTimeout(() => setTypingUser(null), 2500);
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:updated", onUpdatedMessage);
    socket.on("message:deleted", onDeletedMessage);
    socket.on("typing:update", onTyping);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:updated", onUpdatedMessage);
      socket.off("message:deleted", onDeletedMessage);
      socket.off("typing:update", onTyping);
    };
  }, [activeChatId, auth?.email, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeChatId]);

  useEffect(() => {
    if (!messageQuery.trim()) {
      setMessageResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      const response = await searchMessages({ q: messageQuery, role: roleFilter || undefined });
      setMessageResults(response.data || []);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [messageQuery, roleFilter]);

  const filteredChats = chats.filter((chat) =>
    chatTitle(chat, auth).toLowerCase().includes(query.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())
  );

  const startPrivateChat = async (userId) => {
    const response = await createPrivateChat(userId);
    const chat = response.data;
    setChats((items) => [chat, ...items.filter((item) => item._id !== chat._id)]);
    setActiveChatId(chat._id);
  };

  const startGroupChat = async (group) => {
    const groupId = group?.id || auth.groupId;
    const groupName = group?.name || auth.groupName;
    const response = await createGroupChat({ groupId, name: groupName ? `${groupName} Chat` : undefined });
    const chat = response.data;
    setChats((items) => [chat, ...items.filter((item) => item._id !== chat._id)]);
    setActiveChatId(chat._id);
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
    if (!activeChatId || !socket) return;
    socket.emit("typing:start", { chatId: activeChatId });
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      socket.emit("typing:stop", { chatId: activeChatId });
    }, 900);
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    if (!activeChatId || (!text.trim() && !attachment)) return;

    if (editing) {
      if (socket?.connected) {
        socket.emit("message:edit", { messageId: editing._id, text });
      } else {
        const response = await editChatMessage(editing._id, text);
        setMessages((items) => items.map((item) => (item._id === editing._id ? response.data : item)));
      }
      setEditing(null);
      setText("");
      return;
    }

    const payload = {
      text,
      attachments: attachment ? [attachment] : [],
    };

    if (socket?.connected) {
      socket.emit("message:send", { chatId: activeChatId, ...payload });
    } else {
      const response = await sendChatMessage(activeChatId, payload);
      setMessages((items) => [...items, response.data]);
    }

    setText("");
    setAttachment(null);
    socket?.emit("typing:stop", { chatId: activeChatId });
  };

  const handleAttach = (type) => {
    const name = type === "VOICE" ? "Voice note" : type === "IMAGE" ? "Image preview" : "Attachment";
    setAttachment({
      type,
      name,
      url: `local-preview://${Date.now()}`,
      mimeType: type === "IMAGE" ? "image/png" : type === "VOICE" ? "audio/webm" : "application/octet-stream",
    });
  };

  const handleDelete = async (message) => {
    if (socket?.connected) {
      socket.emit("message:delete", { messageId: message._id, chatId: activeChatId });
    } else {
      await deleteChatMessage(message._id);
      setMessages((items) =>
        items.map((item) => (item._id === message._id ? { ...item, text: "", attachments: [], isDeleted: true } : item))
      );
    }
  };

  const handlePin = async (message) => {
    try {
      const response = await togglePinnedMessage(message._id, !message.pinned);
      setMessages((items) => items.map((item) => (item._id === message._id ? response.data : item)));
    } catch {
      // Keep the chat usable if a stale message cannot be pinned.
    }
  };

  return (
    <AppShell title="Chat">
      <div className="chat-workspace">
        <aside className="chat-sidebar">
          <div className="chat-search-row">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users or chats" />
          </div>

          <div className="chat-filter-row" aria-label="Role filter">
            {["", "STUDENT", "MENTOR", "ADMIN"].map((role) => (
              <button key={role || "all"} className={roleFilter === role ? "active" : ""} onClick={() => setRoleFilter(role)} type="button">
                {role || "All"}
              </button>
            ))}
          </div>

          {auth?.groupId && (
            <button className="chat-group-action" type="button" onClick={startGroupChat}>
              <Users size={17} /> Department chat
            </button>
          )}

          <div className="chat-list">
            {loading ? <div className="chat-empty">Loading conversations...</div> : null}
            {loadError ? <div className="chat-empty">{loadError}</div> : null}
            {filteredChats.map((chat) => {
              const participant = otherParticipant(chat, auth);
              const online = chat.type === "PRIVATE" && onlineUsers[participant?._id];
              return (
                <button key={chat._id} type="button" className={`chat-list-item ${activeChatId === chat._id ? "active" : ""}`} onClick={() => setActiveChatId(chat._id)}>
                  <span className={`chat-avatar ${online ? "online" : ""}`}>{chat.type === "GROUP" ? "G" : displayName(participant).slice(0, 1)}</span>
                  <span className="chat-list-copy">
                    <strong>{chatTitle(chat, auth)}</strong>
                    <small>{chat.lastMessage?.isDeleted ? "Message deleted" : chat.lastMessage?.text || chat.course || "No messages yet"}</small>
                  </span>
                  {chat.unreadCount > 0 && <span className="chat-unread">{chat.unreadCount}</span>}
                </button>
              );
            })}

            {filteredUsers.length > 0 && <div className="chat-list-label">People</div>}
            {filteredUsers.map((user) => (
              <button key={user._id} type="button" className="chat-list-item" onClick={() => startPrivateChat(user._id)}>
                <span className={`chat-avatar ${onlineUsers[user._id] ? "online" : ""}`}>{displayName(user).slice(0, 1)}</span>
                <span className="chat-list-copy">
                  <strong>{displayName(user)}</strong>
                  <small>{user.role}</small>
                </span>
              </button>
            ))}

            {groups.length > 0 && <div className="chat-list-label">Department chats</div>}
            {groups.map((group) => (
              <button key={group.id} type="button" className="chat-list-item" onClick={() => startGroupChat(group)}>
                <span className="chat-avatar">G</span>
                <span className="chat-list-copy">
                  <strong>{group.name}</strong>
                  <small>{group.memberCount || 0} members</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="chat-panel">
          {activeChat ? (
            <>
              <header className="chat-panel-header">
                <button type="button" className="chat-title-button" onClick={() => setProfileUser(otherParticipant(activeChat, auth))}>
                  <span className="chat-avatar">{activeChat.type === "GROUP" ? "G" : activeChatName.slice(0, 1)}</span>
                  <span>
                    <strong>{activeChatName}</strong>
                    <small>{typingUser ? `${displayName(typingUser)} is typing...` : activeChat.type === "GROUP" ? activeChat.course : "Private chat"}</small>
                  </span>
                </button>

                <div className="chat-search-row message-search">
                  <Search size={16} />
                  <input value={messageQuery} onChange={(event) => setMessageQuery(event.target.value)} placeholder="Search messages" />
                </div>
              </header>

              {messageResults.length > 0 && (
                <div className="chat-search-results">
                  {messageResults.map((result) => (
                    <button key={result._id} type="button" onClick={() => setActiveChatId(result.chat?._id || result.chat)}>
                      <strong>{displayName(result.sender)}</strong>
                      <span>{result.text}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="chat-messages">
                {messages.map((message) => {
                  const mine = message.sender?.email === auth?.email || message.sender?._id === auth?.id;
                  return (
                    <div key={message._id} className={`chat-message-row ${mine ? "mine" : ""}`}>
                      <div className="chat-bubble">
                        <div className="chat-bubble-meta">
                          <button type="button" onClick={() => setProfileUser(message.sender)}>{mine ? "You" : displayName(message.sender)}</button>
                          <span>{formatTime(message.createdAt)}</span>
                        </div>
                        {message.isDeleted ? (
                          <p className="chat-deleted">This message was deleted.</p>
                        ) : (
                          <>
                            {message.text && <p>{message.text}</p>}
                            {message.attachments?.map((fileItem, index) => (
                              <a className="chat-attachment" href={fileItem.url} key={`${fileItem.url}-${index}`} onClick={(event) => event.preventDefault()}>
                                {fileItem.type === "IMAGE" ? <Image size={16} /> : fileItem.type === "VOICE" ? <Mic size={16} /> : <File size={16} />}
                                {fileItem.name}
                              </a>
                            ))}
                          </>
                        )}
                        <div className="chat-message-actions">
                          {message.pinned && <Pin size={14} />}
                          {message.isEdited && <span>edited</span>}
                          <span>{message.readBy?.length > 1 ? "Read" : "Sent"}</span>
                          {!message.isDeleted && (mine || auth?.role === "ADMIN") && (
                            <>
                              {mine && <button type="button" title="Edit" onClick={() => { setEditing(message); setText(message.text); }}><Edit3 size={14} /></button>}
                              <button type="button" title="Delete" onClick={() => handleDelete(message)}><Trash2 size={14} /></button>
                            </>
                          )}
                          {!message.isDeleted && <button type="button" title="Pin" onClick={() => handlePin(message)}><Pin size={14} /></button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form className="chat-composer" onSubmit={submitMessage}>
                {editing && (
                  <button type="button" className="chat-editing-pill" onClick={() => { setEditing(null); setText(""); }}>
                    Editing <X size={14} />
                  </button>
                )}
                {attachment && (
                  <button type="button" className="chat-editing-pill" onClick={() => setAttachment(null)}>
                    {attachment.name} <X size={14} />
                  </button>
                )}
                <div className="chat-tool-row">
                  <button type="button" title="Emoji" onClick={() => setText((value) => `${value}${EMOJIS[0]}`)}><Smile size={18} /></button>
                  <div className="chat-emoji-row">
                    {EMOJIS.map((emoji) => <button type="button" key={emoji} onClick={() => setText((value) => `${value}${emoji}`)}>{emoji}</button>)}
                  </div>
                  <button type="button" title="Attach file" onClick={() => handleAttach("FILE")}><Paperclip size={18} /></button>
                  <button type="button" title="Attach image" onClick={() => handleAttach("IMAGE")}><Image size={18} /></button>
                  <button type="button" title="Voice note" onClick={() => handleAttach("VOICE")}><Mic size={18} /></button>
                </div>
                <input value={text} onChange={handleTextChange} placeholder="Write a message" />
                <button type="submit" className="chat-send-button" title="Send"><Send size={19} /></button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">Select a conversation or start one from the sidebar.</div>
          )}
        </section>
      </div>

      {profileUser && (
        <div className="chat-profile-backdrop" onClick={() => setProfileUser(null)}>
          <div className="chat-profile" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="chat-profile-close" onClick={() => setProfileUser(null)}><X size={18} /></button>
            <span className="chat-profile-avatar">{displayName(profileUser).slice(0, 1)}</span>
            <h2>{displayName(profileUser)}</h2>
            <p>{profileUser.email}</p>
            <div><span>Role</span><strong>{profileUser.role}</strong></div>
            {profileUser.branch && <div><span>Branch</span><strong>{profileUser.branch}</strong></div>}
          </div>
        </div>
      )}
    </AppShell>
  );
}
