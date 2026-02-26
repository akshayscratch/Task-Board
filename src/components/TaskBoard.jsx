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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('tasks')
            .select('*, assigned_user:users(name)')
            .or(`created_by.eq.${user.email},assigned_to.eq.${user.email}`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching tasks:', error)
            // Fallback to non-joined fetch
            const { data: fallbackData } = await supabase
                .from('tasks')
                .select('*')
                .or(`created_by.eq.${user.email},assigned_to.eq.${user.email}`)
                .order('created_at', { ascending: false })
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
        <div className="h-full flex flex-col p-8 relative overflow-hidden bg-transparent">
            {/* Background Aesthetic Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-gradient-primary tracking-tight mb-1">WorkMatrix</h2>
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

            <div className="flex-1 overflow-x-auto pb-6 -mx-4 px-4 relative z-10 custom-scrollbar">
                <div className="flex gap-6 min-w-[1000px] h-full">
                    {columns.map(status => (
                        <div
                            key={status}
                            className={`flex-1 min-w-[320px] rounded-3xl flex flex-col transition-all duration-300 relative overflow-hidden ${status === 'To Do' ? 'bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md' :
                                status === 'In Progress' ? 'bg-amber-50/40 border border-amber-200/50 shadow-[0_8px_32px_rgba(251,191,36,0.04)] backdrop-blur-md' :
                                    'bg-primary/5 border border-primary/20 shadow-[0_8px_32px_rgba(140,198,63,0.04)] backdrop-blur-md'
                                }`}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, status)}
                        >
                            {/* Inner glow for columns */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-3xl"></div>

                            <div className="p-5 flex items-center justify-between sticky top-0 z-10 bg-white/40 backdrop-blur-xl border-b border-white/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${status === 'To Do' ? 'bg-zinc-400' :
                                        status === 'In Progress' ? 'bg-amber-500' : 'bg-[#8CC63F]'
                                        }`}></div>
                                    <h3 className={`font-black tracking-widest uppercase text-[10px] ${status === 'To Do' ? 'text-zinc-500' :
                                        status === 'In Progress' ? 'text-amber-600' : 'text-[#1A2A24]/60'
                                        }`}>{status}</h3>
                                </div>
                                <span className="bg-black/5 text-[#1A2A24]/40 text-[10px] font-bold px-2 py-0.5 rounded-full border border-black/10">
                                    {tasks.filter(t => t.status === status).length}
                                </span>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar relative z-10">
                                {tasks.filter(t => t.status === status).map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, task.id)}
                                        onClick={() => setSelectedTask(task)}
                                        className={`group relative bg-white/70 backdrop-blur-sm hover:bg-white px-4 py-3.5 rounded-2xl border border-white/60 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 flex items-center gap-3 overflow-hidden ${status === 'Done' ? 'opacity-70 hover:opacity-100' : ''
                                            }`}
                                    >
                                        {/* Priority Indicator Glow */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2 ${task.priority === 'High' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' :
                                                task.priority === 'Medium' ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' :
                                                    'bg-accent shadow-[0_0_15px_rgba(63,169,245,0.6)]'
                                            }`}></div>

                                        <div className="flex-1 min-w-0 flex items-center gap-3 pl-2">
                                            <h4 className="font-bold text-[#1A2A24] text-sm truncate group-hover:text-primary transition-colors flex-1 tracking-tight">{task.title}</h4>

                                            <div className="flex items-center gap-3 shrink-0">
                                                {task.due_date && (
                                                    <div className={`flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-md backdrop-blur-sm border ${new Date(task.due_date) < new Date() && status !== 'Done'
                                                            ? 'text-red-600 bg-red-50/80 border-red-100'
                                                            : 'text-text-muted bg-white/60 border-black/5'
                                                        }`}>
                                                        <Clock size={12} strokeWidth={2.5} className={new Date(task.due_date) < new Date() && status !== 'Done' ? 'animate-pulse' : ''} />
                                                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-text-muted/70 truncate max-w-[80px] hidden md:block group-hover:text-primary transition-colors">
                                                        {task.assigned_user?.name || task.assigned_to.split('@')[0]}
                                                    </span>
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-[#3FA9F5] border-2 border-white flex items-center justify-center text-[11px] text-white font-black shadow-sm group-hover:scale-110 group-hover:shadow-primary/30 transition-all duration-300 relative z-10">
                                                        {(task.assigned_user?.name || task.assigned_to).charAt(0).toUpperCase()}
                                                    </div>
                                                </div>

                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted/30 group-hover:text-primary/70 group-hover:bg-primary/5 transition-all duration-300">
                                                    <GripVertical size={16} />
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
