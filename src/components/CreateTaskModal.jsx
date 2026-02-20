import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Plus, Target, Users, Calendar, BarChart3, AlignLeft } from 'lucide-react'
import { X as XIcon } from 'lucide-react'

export default function CreateTaskModal({ onClose, onTaskCreated }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [users, setUsers] = useState([])
    const [priority, setPriority] = useState('Medium')
    const [dueDate, setDueDate] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('email, name')
        if (error) console.error('Error fetching users:', error)
        else {
            setUsers(data || [])
            if (data && data.length > 0) setAssignedTo(data[0].email)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Authentication required")

            const payload = {
                title,
                description,
                assigned_to: assignedTo,
                created_by: user.email,
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
            <div className="glass-card w-full max-w-xl shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden">
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Create New Task</h3>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Project Roadmap</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <XIcon size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <Target size={12} strokeWidth={3} className="text-primary" /> Task Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full glass-input text-base font-bold text-white placeholder-white/20"
                            placeholder="What needs to be done?"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                <Users size={12} strokeWidth={3} className="text-primary" /> Assign To
                            </label>
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full glass-input text-sm font-bold text-white cursor-pointer bg-surface/60"
                            >
                                {users.map(u => (
                                    <option key={u.email} value={u.email}>{u.name || u.email}</option>
                                ))}
                                {users.length === 0 && <option value="" disabled>No users found</option>}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                <BarChart3 size={12} strokeWidth={3} className="text-primary" /> Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full glass-input text-sm font-bold text-white cursor-pointer bg-surface/60"
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
                                className="w-full glass-input text-sm font-bold text-white cursor-pointer bg-surface/60"
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
                            className="w-full glass-input text-sm font-medium text-white h-32 resize-none leading-relaxed"
                            placeholder="Add more context to this task..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:bg-white/5 transition-all"
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
