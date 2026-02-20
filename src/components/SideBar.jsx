import { LayoutDashboard, KanbanSquare, LogOut, User } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEffect, useState } from 'react'

export default function SideBar() {
    const navigate = useNavigate()
    const [userEmail, setUserEmail] = useState('')

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserEmail(user.email)
        })
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const navClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
            : 'text-text-muted hover:bg-white/5 hover:text-white'
        }`

    return (
        <div className="w-72 glass border-r border-white/5 flex flex-col h-full overflow-hidden">
            <div className="p-8 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                        <KanbanSquare className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">TaskBoard</h1>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Workspace</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                <div className="pb-4">
                    <p className="px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Main Menu</p>
                    <NavLink to="/" className={navClass}>
                        <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Dashboard</span>
                    </NavLink>
                    <NavLink to="/board" className={navClass}>
                        <KanbanSquare size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Task Board</span>
                    </NavLink>
                </div>
            </nav>

            <div className="p-4 bg-white/[0.02] border-t border-white/5">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center border border-white/10">
                        <span className="text-white font-bold text-sm">{userEmail.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{userEmail.split('@')[0]}</p>
                        <p className="text-[11px] text-text-muted truncate">{userEmail}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-medium text-sm"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
