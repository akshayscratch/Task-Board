import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { CheckCircle2, Clock, ListTodo, AlertCircle, MessageSquare, TrendingUp, Calendar, User } from 'lucide-react'

export default function Dashboard() {
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
    const [prioritizedTasks, setPrioritizedTasks] = useState([])
    const [recentUpdates, setRecentUpdates] = useState([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')

    useEffect(() => {
        fetchDashboardData()

        const channel = supabase
            .channel('dashboard-activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => {
                fetchDashboardData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch current user name
            const { data: userData } = await supabase
                .from('users')
                .select('name')
                .eq('id', user.id)
                .single()
            if (userData) setUserName(userData.name)

            const userFilter = `created_by.eq.${user.email},assigned_to.eq.${user.email}`

            // Fetch ALL tasks related to the user in one robust query
            const { data: allUserTasks, error: tasksError } = await supabase
                .from('tasks')
                .select('*') // Removed relational fetch to prevent DB crash
                .or(userFilter)

            if (tasksError) {
                console.error("Error fetching tasks:", tasksError)
                return
            }

            if (allUserTasks) {
                // 1. Calculate Stats
                const total = allUserTasks.length
                const completed = allUserTasks.filter(t => t.status === 'Done').length
                const pending = total - completed
                setStats({ total, pending, completed })

                // 2. Calculate Prioritized Tasks
                const activeTasks = allUserTasks.filter(t => t.status !== 'Done')
                const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 }
                const sortedTasks = [...activeTasks].sort((a, b) => {
                    const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
                    // If same priority, sort by due_date (urgent first) or created_at
                    if (weightDiff === 0) {
                        return new Date(b.created_at) - new Date(a.created_at)
                    }
                    return weightDiff
                })
                setPrioritizedTasks(sortedTasks.slice(0, 6))

                // 3. Fetch Recent Updates for these specific tasks
                const taskIds = allUserTasks.map(t => t.id)
                if (taskIds.length > 0) {
                    const { data: updatesData, error: commentsError } = await supabase
                        .from('comments')
                        .select('*, tasks(title)') // Removed author:users(name) to prevent DB crash
                        .in('task_id', taskIds)
                        .order('created_at', { ascending: false })
                        .limit(5)

                    if (!commentsError && updatesData) {
                        setRecentUpdates(updatesData)
                    } else {
                        console.error("Error fetching comments:", commentsError)
                        setRecentUpdates([])
                    }
                } else {
                    setRecentUpdates([])
                }
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-colors`}></div>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-4xl font-black text-[#1A2A24] tracking-tight">{value}</h3>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2 text-primary text-[10px] font-black uppercase tracking-wider">
                            <TrendingUp size={12} strokeWidth={3} /> {trend}
                        </div>
                    )}
                </div>
                <div className="p-3 rounded-2xl bg-white/50 border border-[#8CC63F]/10 text-primary shadow-sm">
                    <Icon size={24} strokeWidth={3} />
                </div>
            </div>
        </div>
    )

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm font-black text-primary/30 uppercase tracking-[0.3em]">Preparing Workspace</p>
            </div>
        </div>
    )

    return (
        <div className="space-y-10 p-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(140,198,63,0.3)]"></div>
                        <h2 className="text-4xl font-black text-[#1A2A24] tracking-tighter">Workspace <span className="text-primary">Overview</span></h2>
                    </div>
                    <p className="text-text-muted font-bold flex items-center gap-2">
                        Welcome back, <span className="text-[#1A2A24] font-black underline decoration-primary/40 underline-offset-4">{userName || 'User'}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="px-5 py-2.5 glass-card !rounded-2xl flex items-center gap-3 border-[#8CC63F]/10">
                        <Calendar size={18} className="text-primary" />
                        <span className="text-sm font-black text-[#1A2A24] tracking-wide">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Assignments" value={stats.total} icon={ListTodo} color="blue" trend="Focus Area" />
                <StatCard title="In Progress" value={stats.pending} icon={Clock} color="amber" trend="Priority Status" />
                <StatCard title="Target Achieved" value={stats.completed} icon={CheckCircle2} color="emerald" trend="Performance" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Prioritized Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-[#1A2A24] tracking-tight flex items-center gap-3">
                            <AlertCircle className="text-primary" />
                            <span className="text-[#1A2A24]">Priority Stack</span>
                        </h3>
                        <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-accent transition-colors">View All Tasks</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prioritizedTasks.length > 0 ? prioritizedTasks.map(task => (
                            <div key={task.id} className="glass-card p-5 group cursor-pointer hover:bg-white/60 border-[#8CC63F]/5 hover:border-primary/20 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${task.priority === 'High' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                        task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                            'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        }`}>
                                        {task.priority} Priority
                                    </span>
                                    <div className="text-[10px] text-text-muted font-black opacity-40 uppercase tracking-widest">{task.status}</div>
                                </div>
                                <h4 className="text-lg font-black text-[#1A2A24] mb-2 group-hover:text-primary transition-colors truncate">{task.title}</h4>
                                <p className="text-sm text-text-muted line-clamp-2 mb-4 h-10 font-medium leading-relaxed">{task.description || 'No description provided.'}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-[#8CC63F]/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <User size={12} className="text-primary" />
                                        </div>
                                        <span className="text-[10px] font-black text-primary truncate max-w-[80px] uppercase tracking-tighter">
                                            {task.assigned_user?.name || task.assigned_to?.split('@')[0] || 'Unassigned'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-black text-[#1A2A24]/20 uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={12} />
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 glass-card py-20 flex flex-col items-center justify-center opacity-20">
                                <ListTodo size={48} strokeWidth={1} />
                                <p className="mt-4 font-black uppercase tracking-widest text-sm text-[#1A2A24]">No active assignments</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* New Updates Activity Feed */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-[#1A2A24] tracking-tight flex items-center gap-3 px-2">
                        <MessageSquare className="text-accent" />
                        <span className="text-[#1A2A24]">Activity Feed</span>
                    </h3>
                    <div className="glass-card p-2 flex flex-col h-[500px] border-[#8CC63F]/10">
                        <div className="flex-1 overflow-y-auto space-y-1 p-2 custom-scrollbar">
                            {recentUpdates.length > 0 ? recentUpdates.map((update, idx) => (
                                <div key={update.id} className="p-4 hover:bg-white/40 rounded-2xl transition-all border-b border-[#8CC63F]/5 last:border-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{update.user_id.split('@')[0]}</span>
                                        <span className="text-[9px] text-text-muted font-bold opacity-30">{new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-[#1A2A24]/80 font-bold line-clamp-2 mb-2 leading-relaxed italic">"{update.comment}"</p>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-lg w-fit">
                                        <ListTodo size={12} strokeWidth={3} /> {update.tasks?.title || 'Unknown Task'}
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-[#1A2A24]">
                                    <MessageSquare size={32} strokeWidth={1} />
                                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest">No recent updates</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
