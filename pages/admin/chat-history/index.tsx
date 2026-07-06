import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import {
  MessageSquare,
  User,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Bot,
  Loader,
} from 'lucide-react';
import { format } from 'date-fns';

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface ChatSession {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: SessionUser;
  _count: { messages: number };
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  source?: string;
  createdAt: string;
}

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat-sessions/all', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      setMessages([]);
      return;
    }

    setExpandedId(sessionId);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/chat-sessions/${sessionId}/messages`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.user.name.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
            <p className="text-sm text-gray-500 mt-1">{total} total conversations</p>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-300 outline-none w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={24} className="text-blue-600 animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No conversations found</p>
            <p className="text-sm mt-1">{search ? 'Try a different search term' : 'Start a chat to see conversations here'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {session.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {session.user.name || session.user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bot size={12} />
                          {session._count.messages} messages
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          session.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedId === session.id ? (
                    <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {expandedId === session.id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader size={18} className="text-blue-600 animate-spin" />
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-3 ${
                              msg.role === 'user' ? 'flex-row-reverse' : ''
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                            }`}>
                              {msg.role === 'user' ? (
                                <User size={14} className="text-white" />
                              ) : (
                                <Bot size={14} className="text-white" />
                              )}
                            </div>
                            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-800'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap line-clamp-6">{msg.content}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-gray-400">
                                  {format(new Date(msg.createdAt), 'h:mm a')}
                                </span>
                                {msg.source === 'faq' && (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium">
                                    FAQ
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
