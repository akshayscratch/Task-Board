import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, GripVertical, Calendar, MessageSquare, Clock, ArrowRight } from 'lucide-react'
import CreateTaskModal from './CreateTaskModal'
import TaskDetailsModal from './TaskDetailsModal'

export default function TaskBoard() {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)
    const [filter, setFilter] = useState('All')

    const columns = ['To Do', 'In Progress', 'Done']

    useEffect(() => {
        fetchTasks()

        const channel = supabase
            .channel('tasks-board')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                fetchTasks()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assigned_user:users!inner(name)')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching tasks:', error)
            // Fallback to non-joined fetch if inner join fails (e.g. data inconsistency)
            const { data: fallbackData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
            setTasks(fallbackData || [])
        } else {
            setTasks(data || [])
        }

        if (loading) setLoading(false)
    }

    const handleTaskMove = async (taskId, newStatus) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId)

        if (error) {
            console.error('Error moving task:', error)
            fetchTasks()
        }
    }

    const onDragStart = (e, taskId) => {
        e.dataTransfer.setData("taskId", taskId)
    }

    const onDragOver = (e) => {
        e.preventDefault()
    }

    const onDrop = (e, status) => {
        const taskId = e.dataTransfer.getData("taskId")
        if (taskId) {
            handleTaskMove(taskId, status)
        }
    }

    return (
        <div className="h-full flex flex-col p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-4xl font-extrabold text-gradient-primary tracking-tight mb-1">Task Board</h2>
                    <p className="text-text-muted text-sm font-medium">Manage and track your team's <span className="text-accent italic">progress</span></p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-primary flex items-center gap-2 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        New Task
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-6 -mx-4 px-4">
                <div className="flex gap-8 min-w-[1000px] h-full">
                    {columns.map(status => (
                        <div
                            key={status}
                            className="flex-1 min-w-[320px] glass-card flex flex-col bg-white/[0.02]"
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, status)}
                        >
                            <div className="p-5 flex items-center justify-between sticky top-0 z-10 bg-surface/40 backdrop-blur-xl rounded-t-2xl border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${status === 'To Do' ? 'bg-zinc-400 shadow-zinc-400/40' :
                                        status === 'In Progress' ? 'bg-yellow-400 shadow-yellow-400/40' : 'bg-emerald-400 shadow-emerald-400/40'
                                        }`}></div>
                                    <h3 className={`font-black tracking-widest uppercase text-[10px] ${status === 'To Do' ? 'text-zinc-400' :
                                        status === 'In Progress' ? 'text-yellow-400' : 'text-emerald-400'
                                        }`}>{status}</h3>
                                </div>
                                <span className="bg-white/5 text-text-muted text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
                                    {tasks.filter(t => t.status === status).length}
                                </span>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                {tasks.filter(t => t.status === status).map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, task.id)}
                                        onClick={() => setSelectedTask(task)}
                                        className="group bg-surface/40 hover:bg-primary/[0.08] px-3 py-2.5 rounded-xl border border-white/5 hover:border-primary/40 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex items-center gap-3 relative overflow-hidden"
                                    >
                                        {/* Priority Indicator Strip */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'High' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                            task.priority === 'Medium' ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                                                'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]'
                                            }`}></div>

                                        <div className="flex-1 min-w-0 flex items-center gap-3">
                                            <h4 className="font-semibold text-white text-sm truncate group-hover:text-primary transition-colors flex-1">{task.title}</h4>

                                            <div className="flex items-center gap-3 shrink-0">
                                                {task.due_date && (
                                                    <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 ${new Date(task.due_date) < new Date() && status !== 'Done' ? 'text-red-400 border border-red-400/20' : 'text-accent border border-accent/20'
                                                        }`}>
                                                        <Clock size={10} strokeWidth={3} />
                                                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-primary/80 truncate max-w-[60px] uppercase tracking-tighter hidden md:block group-hover:text-primary">
                                                        {task.assigned_user?.name || task.assigned_to.split('@')[0]}
                                                    </span>
                                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary to-cyan-400 border border-white/10 flex items-center justify-center text-[10px] text-white font-black shadow-lg group-hover:scale-110 transition-transform">
                                                        {(task.assigned_user?.name || task.assigned_to).charAt(0).toUpperCase()}
                                                    </div>
                                                </div>

                                                <GripVertical size={14} className="text-white/5 group-hover:text-white/20 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={fetchTasks}
                />
            )}

            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onTaskUpdated={fetchTasks}
                    onTaskDeleted={fetchTasks}
                />
            )}
        </div>
    )
}
