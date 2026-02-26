import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Target, Users, Calendar, BarChart3, AlignLeft } from 'lucide-react'
import { X as XIcon } from 'lucide-react'

export default function CreateTaskModal({ onClose, onTaskCreated }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [users, setUsers] = useState([])
    const [priority, setPriority] = useState('Medium')
    const [dueDate, setDueDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentUser, setCurrentUser] = useState(null)
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        getCurrentUser()
    }, [])

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setCurrentUser(user)
            setAssignedTo(user.email) // Default to self
        }
    }

    const handleSearch = async (term) => {
        setSearchTerm(term)
        if (term.length < 2) {
            setUsers([])
            return
        }

        setIsSearching(true)
        const { data, error } = await supabase
            .from('users')
            .select('email, name')
            .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
            .limit(5)

        if (error) console.error('Error searching users:', error)
        else setUsers(data || [])
        setIsSearching(false)
    }

    const handleAssignSelf = () => {
        if (currentUser) {
            setAssignedTo(currentUser.email)
            setSearchTerm('')
            setUsers([])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!assignedTo) {
            alert("Please assign the task to someone.")
            return
        }
        setLoading(true)

        try {
            if (!currentUser) throw new Error("Authentication required")

            const payload = {
                title,
                description,
                assigned_to: assignedTo,
                created_by: currentUser.email,
                status: 'To Do',
                priority,
                due_date: dueDate ? dueDate : null,
            }

            const { error } = await supabase.from('tasks').insert([payload])

            if (error) throw error

            onTaskCreated()
            onClose()
        } catch (error) {
            console.error('Error creating task:', error)
            alert(`Failed to create task: ${error.message || error.error_description || JSON.stringify(error)}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-[#1A2A24]/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="glass-card w-full max-w-xl shadow-[0_20px_50px_rgba(26,42,36,0.15)] overflow-hidden border-[#8CC63F]/20">
                <div className="flex items-center justify-between p-8 border-b border-[#8CC63F]/10 bg-white/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#1A2A24] tracking-tight">Create New Task</h3>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Project Roadmap</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-primary hover:bg-[#8CC63F]/5 rounded-xl transition-all">
                        <XIcon size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <Target size={12} strokeWidth={3} className="text-primary" /> Task Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full glass-input text-base font-bold text-[#1A2A24] placeholder-[#1A2A24]/30"
                            placeholder="What needs to be done?"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center justify-between px-1">
                                <span className="flex items-center gap-2">
                                    <Users size={12} strokeWidth={3} className="text-primary" /> Assign To
                                </span>
                                <button
                                    type="button"
                                    onClick={handleAssignSelf}
                                    className="text-[9px] font-black text-primary hover:text-accent uppercase tracking-wider transition-colors"
                                >
                                    Assign to Self
                                </button>
                            </label>

                            <div className="flex flex-col gap-2">
                                <div className="relative group/assignee">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full glass-input text-sm font-bold text-[#1A2A24] placeholder-[#1A2A24]/30"
                                        placeholder={assignedTo ? `Current: ${assignedTo}` : "Search by name or email..."}
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {users.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 glass-card bg-white shadow-2xl z-[60] border border-[#8CC63F]/20 max-h-48 overflow-y-auto overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        {users.map(u => (
                                            <button
                                                key={u.email}
                                                type="button"
                                                onClick={() => {
                                                    setAssignedTo(u.email)
                                                    setSearchTerm('')
                                                    setUsers([])
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-[#8CC63F]/5 flex flex-col gap-0.5 border-b border-[#8CC63F]/5 last:border-0 transition-colors group/item"
                                            >
                                                <span className="text-sm font-bold text-[#1A2A24] group-hover/item:text-primary transition-colors">{u.name || u.email}</span>
                                                <span className="text-[10px] text-text-muted font-medium">{u.email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {assignedTo && !searchTerm && (
                                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 w-fit">
                                    <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px] text-primary font-black">
                                        {assignedTo.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-bold text-primary/80 uppercase tracking-tight truncate max-w-[150px]">
                                        {assignedTo === currentUser?.email ? "You" : assignedTo}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                <BarChart3 size={12} strokeWidth={3} className="text-primary" /> Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full glass-input text-sm font-bold text-[#1A2A24] cursor-pointer bg-white/60"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                <Calendar size={12} strokeWidth={3} className="text-primary" /> Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full glass-input text-sm font-bold text-[#1A2A24] cursor-pointer bg-white/60"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <AlignLeft size={12} strokeWidth={3} className="text-primary" /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full glass-input text-sm font-medium text-[#1A2A24] h-32 resize-none leading-relaxed"
                            placeholder="Add more context to this task..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-text-muted hover:text-[#1A2A24] hover:bg-[#8CC63F]/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary min-w-[140px]"
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
