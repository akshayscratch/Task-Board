import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Send, User, MessageCircle } from 'lucide-react'

export default function Comments({ taskId }) {
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const [users, setUsers] = useState([])
    const commentsEndRef = useRef(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
        fetchUsers()
        fetchComments()

        const channel = supabase
            .channel(`comments:${taskId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `task_id=eq.${taskId}` }, (payload) => {
                setComments((prev) => [...prev, payload.new])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [taskId])

    const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('email, name')
        if (data) setUsers(data)
    }

    useEffect(() => {
        scrollToBottom()
    }, [comments])

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('task_id', taskId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching comments:', error)
        } else {
            setComments(data || [])
        }
    }

    const getUserName = (email) => {
        const user = users.find(u => u.email === email)
        return user?.name || email.split('@')[0]
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newComment.trim() || !currentUser) return

        setLoading(true)
        const { error } = await supabase
            .from('comments')
            .insert([
                {
                    task_id: taskId,
                    user_id: currentUser.email,
                    comment: newComment.trim(),
                }
            ])

        if (error) {
            console.error('Error adding comment:', error)
            alert('Failed to send comment')
        } else {
            setNewComment('')
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4 custom-scrollbar">
                {comments.map((comment) => (
                    <div key={comment.id} className={`flex gap-4 ${comment.user_id === currentUser?.email ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 ${comment.user_id === currentUser?.email ? 'bg-primary' : 'bg-surface'}`}>
                            <span className="text-xs text-white font-black">{getUserName(comment.user_id).charAt(0).toUpperCase()}</span>
                        </div>
                        <div className={`max-w-[85%] flex flex-col ${comment.user_id === currentUser?.email ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-black text-primary uppercase tracking-tighter">
                                    {getUserName(comment.user_id)}
                                </span>
                                <span className="text-[10px] font-bold text-text-muted opacity-40">
                                    {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className={`rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-xl ${comment.user_id === currentUser?.email
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white/5 text-text border border-white/5 rounded-tl-none'
                                }`}>
                                <p className="font-medium">{comment.comment}</p>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={commentsEndRef} />
                {comments.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                        <MessageCircle size={64} strokeWidth={1} />
                        <p className="text-sm font-bold uppercase tracking-widest mt-4">No activity yet</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full glass-input pr-14 py-4 rounded-3xl text-sm font-medium shadow-2xl transition-all group-focus-within:shadow-primary/10"
                />
                <button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-2xl transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center shadow-lg active:scale-95"
                >
                    <Send size={18} strokeWidth={2.5} />
                </button>
            </form>
        </div>
    )
}
