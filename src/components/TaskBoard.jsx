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
            .select('*')
            .order('created_at', { ascending: false })

        if (error) console.error('Error fetching tasks:', error)
        else setTasks(data || [])

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
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-1">Task Board</h2>
                    <p className="text-text-muted text-sm font-medium">Manage and track your team's progress</p>
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
                                    <h3 className="font-bold text-white tracking-wide uppercase text-xs">{status}</h3>
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
                                        className="group bg-surface/60 hover:bg-white/[0.05] p-5 rounded-2xl border border-white/5 hover:border-primary/40 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-lg border ${task.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {task.priority}
                                            </span>
                                            <GripVertical size={14} className="text-white/10 group-hover:text-white/30 transition-colors" />
                                        </div>

                                        <h4 className="font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{task.title}</h4>
                                        <p className="text-text-muted text-xs line-clamp-2 mb-4 leading-relaxed font-medium opacity-80">{task.description}</p>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-4">
                                                {task.due_date && (
                                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${new Date(task.due_date) < new Date() && status !== 'Done' ? 'text-red-400' : 'text-text-muted'
                                                        }`}>
                                                        <Clock size={12} strokeWidth={2.5} />
                                                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex -space-x-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-indigo-400 border-2 border-surface flex items-center justify-center text-[10px] text-white font-black shadow-lg">
                                                    {task.assigned_to.charAt(0).toUpperCase()}
                                                </div>
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
