import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AppMode, ChatSession } from '../types';

interface SidebarProps {
    currentMode: AppMode;
    setMode: (mode: AppMode) => void;
    sessions: ChatSession[];
    currentSessionId: string | null;
    onNewChat: () => void;
    onSelectSession: (id: string) => void;
    onDeleteSession: (e: React.MouseEvent, id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentMode,
    setMode,
    sessions,
    currentSessionId,
    onNewChat,
    onSelectSession,
    onDeleteSession
}) => {
    const { data: session } = useSession();
    const navItems = [
        { id: AppMode.ASSISTANT, label: 'Assistant & Prompts', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
        { id: AppMode.VISUALIZER, label: 'Visualizer (Gen)', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: AppMode.RESTYLER, label: 'Restyler (Edit)', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
        { id: AppMode.MEDIA, label: 'Media Assets', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
    ];

    return (
        <div className="w-64 bg-[#161a1d] border-r border-[#2d343a] flex flex-col h-full shrink-0">
            <div className="p-6 border-b border-[#2d343a]">
                {/* Branding: GRAVIS AI with Logo */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        {/* Logo SVG - Abstract "G" Orb */}
                        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                            <circle cx="50" cy="50" r="50" fill="#4137be" />
                            <path d="M70 25C80 35 85 55 75 70C65 85 40 85 30 75C40 80 55 75 60 60C65 45 55 35 45 35C35 35 25 45 25 60C25 40 35 25 55 20C60 18 65 20 70 25Z" fill="#161a1d" />
                            <ellipse cx="40" cy="65" rx="10" ry="6" transform="rotate(-30 40 65)" fill="#161a1d" />
                        </svg>
                        <h1 className="text-3xl font-bold text-[#4137be] tracking-widest font-sans">
                            GRAVIS
                        </h1>
                    </div>
                    <p className="text-[10px] text-[#edf2f4]/50 uppercase tracking-[0.2em] ml-1">Design Intelligence</p>
                </div>
            </div>

            <div className="p-4 pb-0">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-[#1e2327] hover:bg-[#2d343a] text-[#edf2f4] py-3 rounded-xl font-medium transition-all border border-[#2d343a] shadow-sm hover:border-[#4137be]/50"
                >
                    <svg className="w-5 h-5 text-[#fe5c24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Chat
                </button>
            </div>

            <nav className="p-4 space-y-2 border-b border-[#2d343a]">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setMode(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentMode === item.id
                            ? 'bg-[#4137be] text-[#edf2f4] shadow-lg shadow-[#4137be]/30'
                            : 'text-[#edf2f4]/60 hover:bg-[#1e2327] hover:text-[#edf2f4]'
                            }`}
                    >
                        <svg className={`w-5 h-5 ${currentMode === item.id ? 'text-[#edf2f4]' : 'text-[#f6d935]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs font-semibold text-[#edf2f4]/40 uppercase tracking-wider mb-3">Recent Chats</h3>
                <div className="space-y-1">
                    {[...sessions].sort((a, b) => b.timestamp - a.timestamp).map(session => (
                        <div
                            key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-[#1e2327] text-[#4137be]' : 'text-[#edf2f4]/60 hover:bg-[#1e2327] hover:text-[#edf2f4]'
                                }`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                <span className="text-sm truncate max-w-[120px]">{session.title}</span>
                            </div>
                            <button
                                onClick={(e) => onDeleteSession(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-[#fe5c24] p-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <p className="text-xs text-[#edf2f4]/40 text-center py-4">No history yet.</p>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-[#2d343a] space-y-4">
                {session?.user && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group transition-all hover:bg-white/[0.08]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 bg-gradient-to-br from-[#4137be] to-[#fe5c24] rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
                                {session.user.name?.[0] || 'A'}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-semibold text-white truncate">{session.user.name}</span>
                                <span className="text-[10px] text-white/40 truncate">{session.user.email}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="p-2 hover:bg-red-500/10 hover:text-red-400 text-white/40 rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                            title="Sign Out"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="text-[10px] text-[#edf2f4]/30 text-center font-medium tracking-wider uppercase">
                    Gravis AI v0.1 • Gemini 3 Pro
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
