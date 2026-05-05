import { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import { AuthContext } from '../contexts/AuthContext';

export default function ChatPage() {
  const { mode, id, roomId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const userId = user?.id || user?._id;
  const [room, setRoom] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [chatError, setChatError] = useState(null);
  const [roomError, setRoomError] = useState(null);
  const bottomRef = useRef(null);

  // Determine chat type
  const isUserChat = mode === 'user';
  const isRoomChat = mode === 'room' || (!mode && !!roomId);

  // Derive the socket/storage key
  const activeId = mode && id ? `${mode}:${id}` : roomId;
  const storageKey = `roomradar_chat_${activeId}`;
  const draftKey = `${storageKey}_draft`;

  useEffect(() => {
    if (!user) return;
    setMessages([]);
    setChatError(null);
    setRoomError(null);

    const draft = localStorage.getItem(draftKey);
    if (draft) setText(draft);

    const init = async () => {
      // Determine the chat room key used for storing messages
      const chatKey = isUserChat
        ? `dm:${[userId, id].sort().join(':')}`
        : (roomId || id);

      // Load messages
      try {
        const chatRes = await api.get(`/chat/${chatKey}`);
        setMessages(chatRes.data);
      } catch {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try { setMessages(JSON.parse(stored)); } catch { /* ignore */ }
        }
        setChatError('Could not load message history — showing cached messages.');
      }

      // Load room or user details
      if (isRoomChat) {
        try {
          const roomRes = await api.get(`/rooms/${roomId || id}`);
          setRoom(roomRes.data);
        } catch {
          setRoomError('Room details not found.');
        }
      } else if (isUserChat) {
        try {
          const userRes = await api.get(`/users/${id}`);
          setPartner(userRes.data);
        } catch {
          setRoomError('User details not found.');
        }
      }
    };

    if (activeId) init();
  }, [activeId, user]);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length) localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  // Persist draft
  useEffect(() => {
    localStorage.setItem(draftKey, text);
  }, [draftKey, text]);

  // Socket.io — join the chat room for real-time messages
  useEffect(() => {
    if (!user) return;
    const joinKey = isUserChat
      ? `dm:${[userId, id].sort().join(':')}`
      : (roomId || id);

    // Make sure socket is connected (AuthContext handles this, but ensure it)
    if (!socket.connected) socket.connect();
    socket.emit('joinRoom', { roomId: joinKey });

    const handleNewMessage = (msg) => {
      if (msg.roomId === joinKey) {
        // Deduplicate: skip if we already have this message (optimistic send)
        setMessages((prev) => {
          if (prev.some((m) => m._id && m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.emit('leaveRoom', { roomId: joinKey });
    };
  }, [activeId, mode, id, roomId, user]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // -------------------------------------------------------
  // Determine chat recipient (fixes the owner self-chat bug)
  // -------------------------------------------------------
  //
  // For room chats:
  //   - If current user IS the owner → recipient is the renter.
  //     We can't know which specific renter without a booking, so we
  //     keep chatPartnerId null but allow sending (the `to` field will
  //     come from the message history or we use a broadcast approach).
  //   - If current user is NOT the owner → recipient is the owner.
  //
  // For user (DM) chats: recipient is always the other user.
  const isSelfRoom = isRoomChat && room?.owner?._id?.toString() === userId?.toString();
  const chatPartnerId = isUserChat
    ? id
    : isSelfRoom
      ? null  // owner in their own room → they respond to whoever messages
      : room?.owner?._id;

  const partnerName = isUserChat
    ? (partner?.name || 'Roommate')
    : isSelfRoom
      ? 'Renter (room inbox)'
      : room?.owner?.name || 'Owner';

  const chatKey = isUserChat
    ? `dm:${[userId, id].sort().join(':')}`
    : (roomId || id);

  const handleSend = async () => {
    if (!text.trim()) return;

    // For owner's room inbox, we need to find the last message's sender as recipient
    let to = chatPartnerId;
    if (isSelfRoom && !to) {
      const lastOther = [...messages].reverse().find(
        (m) => m.from?.toString() !== userId?.toString()
      );
      to = lastOther?.from;
      if (!to) {
        setChatError('No one has messaged this room yet. You can reply once someone contacts you.');
        return;
      }
    }

    if (!to) {
      setChatError('Unable to determine chat recipient.');
      return;
    }

    const trimmed = text.trim();
    setText(''); // Clear input immediately for snappy UX
    setChatError(null);

    const payload = { roomId: chatKey, text: trimmed, to };
    try {
      const res = await api.post('/chat', payload);
      // Optimistically add our own message immediately (dedup handles socket echo)
      setMessages((prev) => {
        if (prev.some((m) => m._id && m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      // Broadcast to the room so the other party gets it live
      socket.emit('sendMessage', res.data);
    } catch {
      setChatError('Failed to send message. Please try again.');
      setText(trimmed); // Restore text on failure
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page">
      <div className="chat-header-row">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="chat-back-btn"
        >
          ← Back
        </button>
        <h1 className="m-0">💬 Chat</h1>
      </div>

      {/* Chat Header */}
      {isRoomChat && room && (
        <div className="chat-header" style={{ marginBottom: '0' }}>
          <>
            <div>
              <div className="chat-header-title">{room.title}</div>
              <div className="chat-header-meta">
                <span>📍 {room.location}</span>
                <span>•</span>
                <span>₹{room.rent?.toLocaleString()}/mo</span>
              </div>
            </div>
            <div className="chat-header-user">
              <div className="chat-header-label">Chatting with</div>
              <div className="chat-header-name">{partnerName}</div>
            </div>
          </>
        </div>
      )}

      {isUserChat && (
        <div className="chat-header" style={{ marginBottom: '0' }}>
          <div>
            <div className="chat-header-title">Direct Message</div>
            <div className="chat-header-meta"><span>Private conversation</span></div>
          </div>
          <div className="chat-header-user">
            <div className="chat-header-label">Chatting with</div>
            <div className="chat-header-name">{partner?.name || 'User'}</div>
          </div>
        </div>
      )}

      <div className="chat mt-4">
        {/* Alerts */}
        {chatError && <div className="info">{chatError}</div>}
        {roomError && <div className="error">{roomError}</div>}
        {isSelfRoom && (
          <div className="info">
            💡 This is your room's inbox. You can read and reply to messages from prospective renters.
          </div>
        )}

        {/* Messages */}
        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">💬</span>
              <h3>No messages yet</h3>
              <p>Start the conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.from?.toString() === userId?.toString();
              return (
                <div key={msg._id || msg.createdAt} className={`message ${isMine ? 'mine' : 'theirs'}`}>
                  <div className="message-bubble">{msg.text}</div>
                  <div className="message-meta">
                    <span>{isMine ? 'You' : (msg.fromName || 'Other')}</span>
                    <span>·</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
          />
          <button onClick={handleSend} disabled={!text.trim()}>
            Send ↑
          </button>
        </div>
      </div>
    </div>
  );
}
