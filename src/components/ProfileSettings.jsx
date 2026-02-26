import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, User, Save, Loader2 } from 'lucide-react'

export default function ProfileSettings({ onClose, onUpdate }) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('users')
                .select('name')
                .eq('id', user.id)
                .single()

            if (error) throw error
            if (data) setName(data.name || '')
        } catch (err) {
            console.error('Error fetching profile:', err)
            setError('Failed to load profile')
        } finally {
            setFetching(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('users')
                .update({ name: name.trim() })
                .eq('id', user.id)

            if (error) throw error

            if (onUpdate) onUpdate(name.trim())
            onClose()
        } catch (err) {
            console.error('Error updating profile:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1A2A24]/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md glass-card overflow-hidden animate-in fade-in zoom-in duration-200 border-[#8CC63F]/20">
                <div className="flex items-center justify-between p-6 border-b border-[#8CC63F]/10 bg-white/30">
                    <h2 className="text-xl font-black text-[#1A2A24] flex items-center gap-2">
                        <User className="text-primary" size={20} />
                        Profile Settings
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-[#1A2A24] transition-colors p-2 hover:bg-[#8CC63F]/5 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 bg-white/50">
                    {fetching ? (
                        <div className="flex flex-col items-center py-10 gap-3">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-sm font-black text-primary/30 uppercase tracking-widest">Loading Profile</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-6">
                            {error && (
                                <div className="p-3 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-[#1A2A24]/40 uppercase tracking-[0.2em] mb-3 px-1">Display Name</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50">
                                        <User size={18} strokeWidth={3} />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full glass-input pl-12 py-3 text-sm font-black text-[#1A2A24]"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <p className="mt-3 text-[10px] text-text-muted font-bold px-1 italic">This name will be visible to your team members.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Saving Settings...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} strokeWidth={3} />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
