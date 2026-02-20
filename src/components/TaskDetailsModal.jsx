import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Trash2, Calendar, User, AlignLeft, BarChart3, Clock, CheckCircle2, ChevronRight, ChevronLeft, Settings2 } from 'lucide-react'
import Comments from './Comments'

export default function TaskDetailsModal({ task, onClose, onTaskUpdated, onTaskDeleted }) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [status, setStatus] = useState(task.status)
    const [priority, setPriority] = useState(task.priority)
    const [assignedTo, setAssignedTo] = useState(task.assigned_to)
    const [users, setUsers] = useState([])
    const [dueDate, setDueDate] = useState(task.due_date || '')
    const [loading, setLoading] = useState(false)
    const [showDetails, setShowDetails] = useState(false) // Default to hidden

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('email, name')
        if (error) console.error('Error fetching users:', error)
        else setUsers(data || [])
    }

    const handleUpdate = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('tasks')
            .update({ title, description, status, priority, assigned_to: assignedTo, due_date: dueDate || null })
            .eq('id', task.id)

        if (error) {
            console.error('Error updating task:', error)
            alert('Failed to update task')
        } else {
            onTaskUpdated()
            setShowDetails(false) // Collapse after saving
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this task?')) return

        setLoading(true)
        const { error } = await supabase.from('tasks').delete().eq('id', task.id)

        if (error) {
            console.error('Error deleting task:', error)
            alert('Failed to delete task')
        } else {
            onTaskDeleted()
            onClose()
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md overflow-y-auto">
            <div className={`glass-card flex flex-col md:flex-row h-[85vh] overflow-hidden transition-all duration-500 ease-in-out shadow-[0_0_50px_rgba(99,102,241,0.2)] ${showDetails ? 'w-full max-w-6xl' : 'w-full max-w-2xl'}`}>

                {/* Left side: Task Content - Collapsible */}
                <div className={`flex flex-col border-r border-white/5 transition-all duration-500 ease-in-out bg-white/[0.01] ${showDetails ? 'flex-[0.45] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 pointer-events-none'}`}>

                    {/* Header Controls */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between min-w-[400px]">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status === 'Done' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                <CheckCircle2 size={24} />
                            </div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="bg-transparent border-none text-sm font-black text-white focus:outline-none uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                            >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>
                        <button onClick={handleDelete} className="text-red-400/50 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-xl transition-all">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar min-w-[400px]">
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-transparent text-3xl font-black text-white placeholder-white/20 focus:outline-none leading-tight"
                                placeholder="Task Title"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <User size={12} strokeWidth={3} /> Assignee
                                </label>
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    className="w-full glass-input text-sm font-bold text-white cursor-pointer"
                                >
                                    {users.map(u => (
                                        <option key={u.email} value={u.email}>{u.name || u.email}</option>
                                    ))}
                                    {users.length === 0 && <option value={assignedTo}>{assignedTo}</option>}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <BarChart3 size={12} strokeWidth={3} /> Priority
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full glass-input text-sm font-bold text-white cursor-pointer"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Calendar size={12} strokeWidth={3} /> Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full glass-input text-sm font-bold text-white cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <AlignLeft size={14} strokeWidth={3} /> Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full glass-input text-sm font-medium text-white leading-relaxed min-h-[180px] resize-none"
                                placeholder="Add a more detailed description..."
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-white/5 flex justify-end gap-3 min-w-[400px]">
                        <button
                            onClick={() => setShowDetails(false)}
                            className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-text-muted hover:text-white hover:bg-white/5 transition-all"
                        >
                            Collapse
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Right side: Comments - Always visible */}
                <div className="flex-1 flex flex-col h-full bg-white/[0.02]">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className={`p-2 rounded-xl transition-all ${showDetails ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                                title={showDetails ? "Hide Details" : "Show Details"}
                            >
                                <Settings2 size={20} />
                            </button>
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Activity Feed</h3>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted text-xs font-bold truncate max-w-[200px] opacity-40 uppercase tracking-widest mr-4">
                            {task.title}
                        </div>
                        <button onClick={onClose} className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <Comments taskId={task.id} />
                    </div>
                </div>
            </div>
        </div>
    )
}
