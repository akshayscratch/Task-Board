import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Clock, Calendar, User, AlertCircle, ChevronRight } from 'lucide-react'
import TaskDetailsModal from './TaskDetailsModal'

export default function Timeline() {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState(null)

    useEffect(() => {
        fetchTimelineTasks()
    }, [])

    const fetchTimelineTasks = async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assigned_user:users!inner(name)')
            .not('due_date', 'is', null)
            .neq('status', 'Done')
            .order('due_date', { ascending: true })

        if (error) {
            console.error('Error fetching timeline tasks:', error)
            // Fallback
            const { data: fallbackData } = await supabase
                .from('tasks')
                .select('*')
                .not('due_date', 'is', null)
                .neq('status', 'Done')
                .order('due_date', { ascending: true })
            setTasks(fallbackData || [])
        } else {
            setTasks(data || [])
        }
        setLoading(false)
    }

    const handleTaskUpdated = () => {
        fetchTimelineTasks()
    }

    const handleTaskDeleted = () => {
        setSelectedTask(null)
        fetchTimelineTasks()
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-400 bg-red-400/10 border-red-400/20'
            case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
            case 'Low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
            default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
        }
    }

    const getDaysRemaining = (dueDate) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const due = new Date(dueDate)
        due.setHours(0, 0, 0, 0)
        const diffTime = due - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                    <Clock size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gradient-primary tracking-tight">Timeline View</h1>
                    <p className="text-sm text-text-muted font-bold uppercase tracking-widest mt-1">Strategic <span className="text-primary italic">Roadmap</span> & Deadlines</p>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Calendar size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-white mb-2">No Deadlines Set</h3>
                    <p className="text-text-muted">Tasks with due dates will appear here in chronological order.</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent rounded-full hidden md:block"></div>

                    <div className="space-y-12">
                        {tasks.map((task, index) => {
                            const daysLeft = getDaysRemaining(task.due_date)
                            const isOverdue = daysLeft < 0
                            const isDueToday = daysLeft === 0

                            return (
                                <div key={task.id} className="relative flex flex-col md:flex-row gap-8 group">
                                    {/* Timeline Node */}
                                    <div className="absolute left-8 -translate-x-1/2 mt-8 hidden md:block">
                                        <div className={`w-4 h-4 rounded-full border-4 border-background shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 group-hover:scale-150 ${task.priority === 'High' ? 'bg-red-500 shadow-red-500/50' :
                                            task.priority === 'Medium' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'
                                            }`}></div>
                                    </div>

                                    {/* Date Sidebar */}
                                    <div className="md:w-32 pt-6 text-right shrink-0">
                                        <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-sm font-bold text-white/40 mt-1">
                                            {new Date(task.due_date).getFullYear()}
                                        </p>
                                    </div>

                                    {/* Task Card */}
                                    <div className="flex-1 glass-card p-6 border-l-4 transition-all duration-300 hover:translate-x-2 relative group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] cursor-pointer"
                                        onClick={() => setSelectedTask(task)}
                                        style={{ borderLeftColor: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#10b981' }}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority} Priority
                                                </div>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${isOverdue ? 'text-white border-red-500 bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                                                    isDueToday ? 'text-black border-amber-500 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-white border-orange-500 bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_15px_rgba(255,69,0,0.4)]'
                                                    }`}>
                                                    <AlertCircle size={10} className={isDueToday ? 'text-black' : 'text-white'} />
                                                    {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : `${daysLeft} Days Remaining`}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                                <Calendar size={10} />
                                                {task.status}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{task.title}</h3>
                                        <p className="text-sm text-text-muted mb-6 line-clamp-2 leading-relaxed">{task.description || 'No description provided.'}</p>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center text-[10px] text-white font-black shadow-lg">
                                                    {(task.assigned_user?.name || task.assigned_to).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-black text-primary/80 uppercase tracking-tighter group-hover:text-primary transition-colors">
                                                    {task.assigned_user?.name || task.assigned_to.split('@')[0]}
                                                </span>
                                            </div>
                                            <button className="text-white/20 group-hover:text-primary transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                />
            )}
        </div>
    )
}
