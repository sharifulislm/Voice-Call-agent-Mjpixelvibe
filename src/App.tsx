import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Mic, MicOff, Video, Palette, Sparkles, MessageSquare, 
  Info, X, Phone, Send, History, Plus, ChevronLeft, ChevronRight,
  User, Bot, Settings, Trash2
} from 'lucide-react';
import { useLiveAPI } from './hooks/useLiveAPI';
import { useChat } from './hooks/useChat';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { cn } from './lib/utils';
import { Session, Message } from './types';

const SYSTEM_INSTRUCTION = `You are Mjpixelvibe, an advanced AI Specialist in Video Content and Image Design.

Your Core Capabilities:
- Expert in Premiere Pro, After Effects, Midjourney, and Content Strategy.
- Provide expert advice on video editing, content strategy, graphic design, and AI image generation.
- Suggest creative visual ideas, color palettes, typography, and storytelling techniques.

Communication Style & Rules:
- Bilingual: Fluently speak Bengali and English. Detect language automatically.
- Voice-Optimized: Conversational, concise, and easy to listen to.
- Tone: Creative, highly energetic, professional, and inspiring.
- Identity: Mjpixelvibe, the Design and Content Specialist.`;

export default function App() {
  const [mode, setMode] = useState<'chat' | 'call'>('chat');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, isConnecting, connect, disconnect, 
    audioLevel, fullTranscript, setFullTranscript 
  } = useLiveAPI({
    apiKey: process.env.GEMINI_API_KEY || '',
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const { messages, setMessages, sendMessage, isLoading: isChatLoading } = useChat(
    process.env.GEMINI_API_KEY || '',
    SYSTEM_INSTRUCTION
  );

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mjpixelvibe_sessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('mjpixelvibe_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Call Transcripts
  useEffect(() => {
    if (fullTranscript.length > 0 && currentSessionId) {
      const last = fullTranscript[fullTranscript.length - 1];
      const newMessage: Message = {
        id: Date.now().toString(),
        role: last.role,
        text: last.text,
        timestamp: Date.now(),
      };
      
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, newMessage] };
        }
        return s;
      }));
    }
  }, [fullTranscript, currentSessionId]);

  const startNewSession = (type: 'chat' | 'call') => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: `New ${type === 'chat' ? 'Chat' : 'Call'} Session`,
      messages: [],
      type,
      timestamp: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setFullTranscript([]);
    setMode(type);
    if (type === 'call') connect();
  };

  const selectSession = (session: Session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setMode(session.type);
    if (session.type === 'call' && !isConnected) {
      // Don't auto-reconnect call for old sessions unless user clicks call
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isChatLoading) return;
    
    if (!currentSessionId) {
      startNewSession('chat');
    }
    
    const text = inputText;
    setInputText("");
    const modelMsg = await sendMessage(text);
    
    if (modelMsg && currentSessionId) {
      const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const updatedMessages = [...s.messages, userMsg, modelMsg];
          return { ...s, messages: updatedMessages, title: text.slice(0, 30) + (text.length > 30 ? '...' : '') };
        }
        return s;
      }));
    }
  };

  const toggleCall = () => {
    if (isConnected) {
      disconnect();
      setMode('chat');
    } else {
      if (!currentSessionId || mode !== 'call') {
        startNewSession('call');
      } else {
        connect();
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0502] text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 300 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="bg-[#0f0a1a] border-r border-white/5 flex flex-col overflow-hidden relative z-30"
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] overflow-hidden">
              <img 
                src="https://github.com/sharifulislm/Minas_protfolio/blob/main/src/assets/logo/minas_log.jpeg?raw=true" 
                alt="Mjpixelvibe Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Mjpixelvibe</h1>
          </div>

          <button
            onClick={() => startNewSession('chat')}
            className="flex items-center gap-2 w-full p-3 mb-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 px-2">History</p>
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => selectSession(session)}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                  currentSessionId === session.id 
                    ? "bg-indigo-600/20 border-indigo-500/50" 
                    : "bg-transparent border-transparent hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {session.type === 'chat' ? <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" /> : <Phone className="w-4 h-4 text-emerald-400 shrink-0" />}
                  <span className="text-sm truncate text-white/70">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/5 mt-auto">
            <button 
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-3 w-full p-3 text-white/50 hover:text-white transition-colors text-sm"
            >
              <Info className="w-4 h-4" /> About Mjpixelvibe
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-[#0a0502]">
        {/* Background Accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[150px] rounded-full" />
        </div>

        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 relative z-20 backdrop-blur-md bg-black/20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/50"
            >
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </button>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-white/20")} />
              <span className="text-sm font-medium text-white/70">
                {isConnected ? "Call Mode Active" : "Chat Mode"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleCall}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                isConnected 
                  ? "bg-red-500/10 text-red-400 border border-red-500/30" 
                  : "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500"
              )}
            >
              {isConnected ? <MicOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              {isConnected ? "End Call" : "Call Mjpixelvibe"}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            {mode === 'call' && isConnected ? (
              <motion.div
                key="call-mode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12"
              >
                <div className="w-80 h-80 rounded-full bg-indigo-600/5 border border-indigo-500/20 flex items-center justify-center relative shadow-[0_0_100px_rgba(79,70,229,0.1)]">
                  <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping" />
                  <VoiceVisualizer isActive={isConnected} level={audioLevel} />
                </div>
                <div className="mt-12 text-center space-y-4">
                  <h2 className="text-4xl font-light tracking-tight text-indigo-100">Mjpixelvibe is speaking</h2>
                  <p className="text-white/40 text-sm max-w-md mx-auto">
                    Real-time voice conversation active. Ask about video editing, design strategy, or content creation.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat-mode"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar"
              >
                <div className="max-w-3xl mx-auto w-full space-y-8 pb-12">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                      <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center border border-indigo-500/20">
                        <MessageSquare className="w-10 h-10 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Welcome to Mjpixelvibe</h3>
                        <p className="text-white/40 max-w-sm">
                          Your expert AI partner for high-end video content and image design. How can I help you today?
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                        {["Premiere Pro tips", "Midjourney prompts", "Content Strategy", "Color Palettes"].map(tip => (
                          <button 
                            key={tip}
                            onClick={() => { setInputText(tip); }}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 hover:bg-white/10 transition-all"
                          >
                            {tip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-4 max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        msg.role === 'user' ? "bg-indigo-600" : "bg-white/10 border border-white/10"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
                      )}>
                        {msg.role === 'model' ? (
                          <div className="markdown-body prose prose-invert prose-sm max-w-none">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-4 mr-auto">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-6 relative z-20">
            <div className="max-w-3xl mx-auto relative">
              <div className="absolute inset-0 bg-indigo-600/5 blur-xl rounded-full pointer-events-none" />
              <div className="relative flex items-center gap-2 bg-[#151619] border border-white/10 p-2 rounded-2xl shadow-2xl backdrop-blur-xl">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask Mjpixelvibe anything..."
                  className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm text-white placeholder:text-white/20"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isChatLoading}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl transition-all shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#151619] border border-white/10 rounded-3xl p-8 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full" />
              
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://picsum.photos/seed/mjpixelvibe-logo/200/200" 
                      alt="Mjpixelvibe Logo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Mjpixelvibe</h3>
                    <p className="text-indigo-400 text-xs font-mono uppercase tracking-wider">Hybrid AI Specialist</p>
                  </div>
                </div>

                <div className="space-y-4 text-white/70 text-sm leading-relaxed">
                  <p>
                    An advanced AI Specialist in Video Content and Image Design. Expert in Premiere Pro, After Effects, Midjourney, and Content Strategy.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <Video className="w-4 h-4 text-indigo-400 mb-1" />
                      <h4 className="text-white text-[10px] font-bold">Video Expert</h4>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <Palette className="w-4 h-4 text-purple-400 mb-1" />
                      <h4 className="text-white text-[10px] font-bold">Design Guru</h4>
                    </div>
                  </div>
                  <p className="text-xs italic text-white/40">
                    Supports English and Bengali fluently with automatic language detection.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
