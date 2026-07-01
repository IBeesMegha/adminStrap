import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layout } from '@/components/admin/Layout';
import {
  Bot,
  User,
  Send,
  Loader,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Share2,
  FileText,
  ExternalLink,
  ImageIcon,
  Check,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ImageData } from '@/components/ai/ImageGallery';

interface SupportingChunk {
  id: string;
  chunkText: string;
  similarity: number;
  sectionHeading: string | null;
  pageTitle: string | null;
  pageUrl: string;
  sourceName: string;
  sourceId: string;
  pageId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'faq' | 'rag';
  faqQuestion?: string;
  faqId?: string;
  relevanceScore?: number;
  supportingChunks?: SupportingChunk[];
  totalRetrieved?: number;
  totalAfterRerank?: number;
  images?: ImageData[];
}

function getConfidenceLabel(score: number): { label: string; color: string } {
  if (score >= 0.95) return { label: 'Highly Relevant', color: 'bg-emerald-100 text-emerald-700' };
  if (score >= 0.85) return { label: 'Relevant', color: 'bg-blue-100 text-blue-700' };
  if (score >= 0.7) return { label: 'Moderately Relevant', color: 'bg-amber-100 text-amber-700' };
  return { label: `${(score * 100).toFixed(0)}%`, color: 'bg-gray-100 text-gray-600' };
}

const thinkingMessages = ['Thinking', 'Thinking.', 'Thinking..', 'Thinking...'];

export default function SearchTestPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [thinkingDots, setThinkingDots] = useState(0);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedId, setLikedId] = useState<string | null>(null);
  const [dislikedId, setDislikedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setThinkingDots(prev => (prev + 1) % 4);
      }, 400);
      return () => clearInterval(interval);
    }
    setThinkingDots(0);
  }, [loading]);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  const simulateStreaming = (fullText: string, messageId: string) => {
    let index = 0;
    const words = fullText.split(' ');
    const interval = setInterval(() => {
      index += 1;
      if (index >= words.length) {
        index = words.length;
        clearInterval(interval);
        setStreamingMessageId(null);
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, content: fullText } : m))
        );
      }
      setStreamingText(words.slice(0, index).join(' '));
    }, 35);
    streamIntervalRef.current = interval;
  };

  const handleSend = async (text?: string) => {
    const queryText = (text || input).trim();
    if (!queryText) return;

    setInput('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/knowledge-base/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantId = `assistant-${Date.now()}`;
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          source: result.source || 'rag',
          faqQuestion: result.faqQuestion,
          faqId: result.faqId,
          relevanceScore: result.relevanceScore,
          supportingChunks: result.supportingChunks || [],
          totalRetrieved: result.totalRetrieved || 0,
          totalAfterRerank: result.totalAfterRerank || 0,
          images: result.images,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStreamingMessageId(assistantId);
        simulateStreaming(result.answer, assistantId);

        if (result.source === 'faq') {
          toast.success('Answered from FAQ');
        } else if (!result.supportingChunks || result.supportingChunks.length === 0) {
          toast('No relevant info found', { icon: '🔍' });
        }
      } else {
        toast.error(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (message: ChatMessage) => {
    const lastUserMessage = [...messages]
      .reverse()
      .find(m => m.role === 'user' && messages.indexOf(m) < messages.indexOf(message));
    if (!lastUserMessage) return;
    setMessages(prev => prev.filter(m => m.id !== message.id));
    await handleSend(lastUserMessage.content);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async (message: ChatMessage) => {
    const shareText = `${message.faqQuestion ? `Q: ${message.faqQuestion}\n\n` : ''}${message.content}`;
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Copied to share');
    } catch {
      toast.error('Failed to share');
    }
  };

  const handleLike = (id: string) => {
    setLikedId(prev => (prev === id ? null : id));
    setDislikedId(prev => (prev === id ? null : prev));
    toast.success('Feedback recorded');
  };

  const handleDislike = (id: string) => {
    setDislikedId(prev => (prev === id ? null : id));
    setLikedId(prev => (prev === id ? null : prev));
    toast.success('Feedback recorded');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    handleSend(question);
  };

  const toggleSources = (id: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderConfidenceBadge = (similarity: number) => {
    const { label, color } = getConfidenceLabel(similarity);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'text-emerald-600 bg-emerald-50';
    if (similarity >= 0.8) return 'text-blue-600 bg-blue-50';
    if (similarity >= 0.7) return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
  };

  const renderMarkdown = (content: string) => (
    <div className="markdown-body text-[15px] leading-relaxed text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-');
            return <h1 id={id} className="text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0" {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-');
            return <h2 id={id} className="text-lg font-bold text-gray-900 mt-5 mb-2 first:mt-0" {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }) => {
            const id = String(children).toLowerCase().replace(/\s+/g, '-');
            return <h3 id={id} className="text-base font-semibold text-gray-900 mt-4 mb-2 first:mt-0" {...props}>{children}</h3>;
          },
          p: ({ children, ...props }) => (
            <p className="mb-3 leading-relaxed last:mb-0" {...props}>{children}</p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc pl-6 mb-3 space-y-1 last:mb-0" {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-6 mb-3 space-y-1 last:mb-0" {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-gray-700" {...props}>{children}</li>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-900 rounded-xl p-4 mb-4 overflow-x-auto last:mb-0">
                <code className="text-sm text-gray-100 font-mono leading-relaxed" {...props}>{children}</code>
              </pre>
            );
          },
          pre: ({ children }) => (
            <div>{children}</div>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm" {...props}>{children}</table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-50" {...props}>{children}</thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="divide-y divide-gray-200" {...props}>{children}</tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="hover:bg-gray-50" {...props}>{children}</tr>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" {...props}>{children}</th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-3 text-gray-700" {...props}>{children}</td>
          ),
          a: ({ children, href, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline underline-offset-2" {...props}>
              {children}
            </a>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-blue-200 pl-4 py-1 my-3 text-gray-600 italic" {...props}>{children}</blockquote>
          ),
          hr: ({ ...props }) => <hr className="my-6 border-gray-200" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  const suggestedPrompts = [
    'Admission Process',
    'Campus Information',
    'AI Research',
    'Fee Structure',
  ];

  const followUpQuestions = [
    'Tell me more',
    'Show related courses',
    'Explain in detail',
    'Give examples',
  ];

  const currentStreaming = streamingMessageId
    ? messages.find(m => m.id === streamingMessageId)
    : null;

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F8FAFC]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-6 animate-[fadeIn_0.5s_ease-out]">
                  <Bot size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-[fadeIn_0.5s_ease-out_0.1s_both]">
                  How can I help you today?
                </h1>
                <p className="text-gray-500 mb-8 text-center max-w-md animate-[fadeIn_0.5s_ease-out_0.2s_both]">
                  Ask anything about our knowledge base and get AI-powered answers instantly.
                </p>
                <div className="flex flex-wrap gap-3 justify-center animate-[fadeIn_0.5s_ease-out_0.3s_both]">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSuggestedQuestion(prompt)}
                      className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="space-y-6 pb-4">
                {messages.map((message) => {
                  const isStreaming = message.id === streamingMessageId;
                  const displayContent = isStreaming
                    ? streamingText
                    : message.content;

                  return (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 animate-[slideUp_0.3s_ease-out] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-blue-600'
                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User size={16} className="text-white" />
                        ) : (
                          <Bot size={16} className="text-white" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`flex flex-col max-w-[85%] ${
                          message.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-5 py-3.5 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-md'
                              : 'bg-white text-gray-800 rounded-tl-md shadow-sm border border-gray-100'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          ) : isStreaming && displayContent === '' ? (
                            <div className="flex items-center gap-1.5 py-1">
                              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          ) : (
                            <div className="animate-[fadeIn_0.3s_ease-out]">
                              {renderMarkdown(displayContent)}
                            </div>
                          )}
                        </div>

                        {/* Timestamp + Source Badge */}
                        <div className={`flex items-center gap-2 mt-1.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[11px] text-gray-400">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.source === 'faq' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium">
                              <Sparkles size={10} />
                              FAQ Match
                            </span>
                          )}
                        </div>

                        {/* Actions - AI messages only */}
                        {message.role === 'assistant' && !isStreaming && message.content && (
                          <div className="flex items-center gap-1 mt-2 justify-start">
                            <button
                              onClick={() => handleLike(message.id)}
                              className={`p-1.5 rounded-lg transition-all ${
                                likedId === message.id
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title="Like"
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              onClick={() => handleDislike(message.id)}
                              className={`p-1.5 rounded-lg transition-all ${
                                dislikedId === message.id
                                  ? 'bg-red-50 text-red-500'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title="Dislike"
                            >
                              <ThumbsDown size={14} />
                            </button>
                            <button
                              onClick={() => handleCopy(displayContent, message.id)}
                              className={`p-1.5 rounded-lg transition-all ${
                                copiedId === message.id
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title="Copy"
                            >
                              {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            <button
                              onClick={() => handleRegenerate(message)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                              title="Regenerate"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              onClick={() => handleShare(message)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                              title="Share"
                            >
                              <Share2 size={14} />
                            </button>
                          </div>
                        )}

                        {/* Images Section */}
                        {message.role === 'assistant' && !isStreaming && message.images && message.images.length > 0 && (
                          <div className="mt-3 w-full animate-[fadeIn_0.4s_ease-out]">
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon size={14} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-500">Related Images</span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                              {message.images.map((img, idx) => (
                                <div
                                  key={`${img.url}-${idx}`}
                                  className="flex-shrink-0 w-48 group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                                  onClick={() => window.open(img.pageUrl || img.url, '_blank')}
                                >
                                  <div className="relative overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                                    <div className="aspect-[4/3] relative">
                                      <img
                                        src={img.url}
                                        alt={img.alt || img.title || ''}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                        crossOrigin="anonymous"
                                      />
                                    </div>
                                    <div className="p-2.5 bg-white">
                                      {img.title && (
                                        <p className="text-xs font-medium text-gray-800 truncate">{img.title}</p>
                                      )}
                                      {img.caption && (
                                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{img.caption}</p>
                                      )}
                                      <div className="flex items-center justify-between mt-1.5">
                                        {img.relevanceScore !== undefined && (
                                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                            img.relevanceScore >= 0.95
                                              ? 'bg-emerald-100 text-emerald-700'
                                              : img.relevanceScore >= 0.85
                                              ? 'bg-blue-100 text-blue-700'
                                              : img.relevanceScore >= 0.7
                                              ? 'bg-amber-100 text-amber-700'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {img.relevanceScore >= 0.95
                                              ? 'Highly Relevant'
                                              : img.relevanceScore >= 0.85
                                              ? 'Relevant'
                                              : img.relevanceScore >= 0.7
                                              ? 'Moderately Relevant'
                                              : `${(img.relevanceScore * 100).toFixed(0)}%`}
                                          </span>
                                        )}
                                        <span className="text-[10px] font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                          Open →
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sources Section */}
                        {message.role === 'assistant' && !isStreaming && message.supportingChunks && message.supportingChunks.length > 0 && (
                          <div className="mt-3 w-full animate-[fadeIn_0.4s_ease-out_0.2s_both]">
                            <button
                              onClick={() => toggleSources(message.id)}
                              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <FileText size={13} />
                              Sources ({message.supportingChunks.length})
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${
                                  expandedSources.has(message.id) ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {expandedSources.has(message.id) && (
                              <div className="mt-2 space-y-1.5">
                                {message.supportingChunks.map((chunk, idx) => (
                                  <a
                                    key={chunk.id}
                                    href={chunk.pageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-all group"
                                  >
                                    <FileText size={14} className="text-gray-400 flex-shrink-0 group-hover:text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-700 truncate group-hover:text-blue-700">
                                        {chunk.pageTitle || chunk.sourceName || 'Untitled'}
                                      </p>
                                      <p className="text-[10px] text-gray-400">
                                        {chunk.sourceName}
                                        {chunk.sectionHeading && ` · ${chunk.sectionHeading}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {renderConfidenceBadge(chunk.similarity)}
                                      <ExternalLink size={11} className="text-gray-300 group-hover:text-blue-400" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Suggested Follow-ups */}
                        {message.role === 'assistant' && !isStreaming && message.content && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {followUpQuestions.map((q) => (
                              <button
                                key={q}
                                onClick={() => handleSuggestedQuestion(q)}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg text-xs text-gray-600 hover:text-blue-700 transition-all"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Thinking Indicator */}
                {loading && (
                  <div className="flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3.5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{thinkingMessages[thinkingDots]}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative"
            >
              <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl pl-4 pr-2 py-2 shadow-sm focus-within:border-blue-300 focus-within:shadow-md focus-within:shadow-blue-100 transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about our knowledge base..."
                  rows={1}
                  disabled={loading || streamingMessageId !== null}
                  className="flex-1 resize-none outline-none text-[15px] text-gray-800 placeholder-gray-400 bg-transparent max-h-[200px] py-1.5"
                  style={{ scrollbarWidth: 'thin' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading || streamingMessageId !== null}
                  className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    input.trim() && !loading && !streamingMessageId
                      ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                AI responses may contain inaccuracies. Verify important information.
              </p>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
