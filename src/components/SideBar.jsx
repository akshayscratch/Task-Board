import { LayoutDashboard, KanbanSquare, LogOut, Settings, User, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEffect, useState } from 'react'
import ProfileSettings from './ProfileSettings'

export default function SideBar({ isCollapsed, onToggle }) {
    const navigate = useNavigate()
    const [userEmail, setUserEmail] = useState('')
    const [userName, setUserName] = useState('')
    const [showProfileSettings, setShowProfileSettings] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUserEmail(user.email)
            const { data } = await supabase
                .from('users')
                .select('name')
                .eq('id', user.id)
                .single()
            if (data) setUserName(data.name)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const navClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
            : 'text-text-muted hover:bg-primary/5 hover:text-primary'
        } ${isCollapsed ? 'justify-center px-0' : ''}`

    return (
        <div className={`glass border-r border-[#8CC63F]/10 flex flex-col h-full transition-all duration-300 relative z-40 ${isCollapsed ? 'w-20' : 'w-72'}`}>
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white border-2 border-[#E9F7EE] shadow-lg z-50 hover:scale-110 transition-transform active:scale-95"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className="flex flex-col h-full overflow-hidden">
                <div className={`p-8 mb-4 transition-all duration-300 ${isCollapsed ? 'px-4 flex justify-center' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                            <KanbanSquare className="text-white" size={24} />
                        </div>
                        {!isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">
                                <h1 className="text-xl font-bold text-[#1A2A24] tracking-tight">WorkMatrix</h1>
                                <span className="text-[10px] text-primary font-black uppercase tracking-widest">Workspace</span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    <div className="pb-4">
                        {!isCollapsed && (
                            <p className="px-4 text-[11px] font-black text-[#1A2A24]/30 uppercase tracking-[0.2em] mb-4 animate-in fade-in duration-300 whitespace-nowrap">Explore</p>
                        )}
                        <NavLink to="/" className={navClass} title={isCollapsed ? "Dashboard" : ""}>
                            <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                            {!isCollapsed && <span className="font-bold animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">Dashboard</span>}
                        </NavLink>
                        <NavLink to="/board" className={navClass} title={isCollapsed ? "Task Board" : ""}>
                            <KanbanSquare size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                            {!isCollapsed && <span className="font-bold animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">Task Board</span>}
                        </NavLink>
                        <NavLink to="/timeline" className={navClass} title={isCollapsed ? "Timeline" : ""}>
                            <Clock size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                            {!isCollapsed && <span className="font-bold animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">Timeline</span>}
                        </NavLink>
                    </div>
                </nav>

                <div className={`p-4 bg-white/30 border-t border-[#8CC63F]/10 transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
                    <button
                        onClick={() => setShowProfileSettings(true)}
                        className={`w-full flex items-center gap-3 p-3 bg-white/40 hover:bg-white/60 rounded-2xl mb-3 transition-all group ${isCollapsed ? 'justify-center p-2' : ''}`}
                        title={isCollapsed ? "Profile Settings" : ""}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-[#3FA9F5] flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform shrink-0">
                            <span className="text-white font-black text-sm">{(userName || userEmail).charAt(0).toUpperCase()}</span>
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0 text-left animate-in fade-in slide-in-from-left-2 duration-300">
                                <p className="text-sm font-black text-[#1A2A24] truncate">{userName || userEmail.split('@')[0]}</p>
                                <p className="text-[11px] text-text-muted font-bold truncate">{userEmail}</p>
                            </div>
                        )}
                        {!isCollapsed && (
                            <Settings size={14} className="text-text-muted group-hover:rotate-90 transition-transform shrink-0" />
                        )}
                    </button>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-500/5 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] ${isCollapsed ? 'px-0' : ''}`}
                        title={isCollapsed ? "Sign Out" : ""}
                    >
                        <LogOut size={16} className="shrink-0" />
                        {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Sign Out</span>}
                    </button>
                </div>
            </div>

            {showProfileSettings && (
                <ProfileSettings
                    onClose={() => setShowProfileSettings(false)}
                    onUpdate={(newName) => setUserName(newName)}
                />
            )}
        </div>
    )
}
