import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { CheckCircle2, Clock, ListTodo, AlertCircle, MessageSquare, TrendingUp, Calendar, User } from 'lucide-react'

export default function Dashboard() {
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
    const [prioritizedTasks, setPrioritizedTasks] = useState([])
    const [recentUpdates, setRecentUpdates] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch Stats
            const { data: statsData } = await supabase
                .from('tasks')
                .select('status')
                .eq('assigned_to', user.email)

            if (statsData) {
                const total = statsData.length
                const completed = statsData.filter(t => t.status === 'Done').length
                const pending = total - completed
                setStats({ total, pending, completed })
            }

            // Fetch Prioritized Tasks
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .eq('assigned_to', user.email)
                .neq('status', 'Done')
                .order('priority', { ascending: false }) // This depends on priority strings sorting, may need manual sort
                .limit(6)

            if (tasksData) {
                // Manual sort for High > Medium > Low
                const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 }
                const sorted = [...tasksData].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
                setPrioritizedTasks(sorted)
            }

            // Fetch Recent Updates (Comments)
            const { data: updatesData } = await supabase
                .from('comments')
                .select('*, tasks(title)')
                .order('created_at', { ascending: false })
                .limit(5)

            if (updatesData) setRecentUpdates(updatesData)

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-${color}-500/10 transition-colors`}></div>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-4xl font-black text-white tracking-tight">{value}</h3>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-[10px] font-bold uppercase">
                            <TrendingUp size={12} /> {trend}
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 text-${color}-400 shadow-xl shadow-black/20`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    )

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm font-black text-white/20 uppercase tracking-[0.3em]">Preparing Dashboard</p>
            </div>
        </div>
    )

    return (
        <div className="space-y-10 p-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">Workspace Overview</h2>
                    </div>
                    <p className="text-text-muted font-medium flex items-center gap-2">
                        Welcome back, Agent <span className="text-white font-bold underline decoration-primary/40 underline-offset-4">{recentUpdates[0]?.user_id.split('@')[0] || 'User'}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="px-5 py-2.5 glass-card !rounded-2xl flex items-center gap-3 border-white/10">
                        <Calendar size={18} className="text-primary" />
                        <span className="text-sm font-bold text-white tracking-wide">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Assignments" value={stats.total} icon={ListTodo} color="indigo" trend="Focus Area" />
                <StatCard title="In Progress" value={stats.pending} icon={Clock} color="amber" trend="+2 since yesterday" />
                <StatCard title="Target Achieved" value={stats.completed} icon={CheckCircle2} color="emerald" trend="Completed" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Prioritized Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                            <AlertCircle className="text-primary" />
                            Priority Stack
                        </h3>
                        <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline underline-offset-4">View All Tasks</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prioritizedTasks.length > 0 ? prioritizedTasks.map(task => (
                            <div key={task.id} className="glass-card p-5 group cursor-pointer hover:bg-white/[0.04] border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${task.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                        }`}>
                                        {task.priority} Priority
                                    </span>
                                    <div className="text-[10px] text-text-muted font-bold opacity-40">{task.status}</div>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors truncate">{task.title}</h4>
                                <p className="text-sm text-text-muted line-clamp-2 mb-4 h-10 font-medium">{task.description || 'No description provided.'}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center border border-white/5">
                                            <User size={12} className="text-text-muted" />
                                        </div>
                                        <span className="text-[10px] font-bold text-text-muted truncate max-w-[80px]">{task.assigned_to.split('@')[0]}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={12} />
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 glass-card py-20 flex flex-col items-center justify-center opacity-20">
                                <ListTodo size={48} strokeWidth={1} />
                                <p className="mt-4 font-black uppercase tracking-widest text-sm">No active assignments</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* New Updates Activity Feed */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3 px-2">
                        <MessageSquare className="text-primary" />
                        Mission Updates
                    </h3>
                    <div className="glass-card p-2 flex flex-col h-[500px] border-white/10">
                        <div className="flex-1 overflow-y-auto space-y-1 p-2 custom-scrollbar">
                            {recentUpdates.length > 0 ? recentUpdates.map((update, idx) => (
                                <div key={update.id} className="p-4 hover:bg-white/[0.03] rounded-2xl transition-all border-b border-white/5 last:border-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{update.user_id.split('@')[0]}</span>
                                        <span className="text-[9px] text-text-muted font-bold opacity-30">{new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-white/80 font-medium line-clamp-2 mb-2 leading-relaxed italic">"{update.comment}"</p>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                                        <ListTodo size={12} strokeWidth={3} /> {update.tasks?.title || 'Unknown Task'}
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20">
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
