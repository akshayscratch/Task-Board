import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)
    const navigate = useNavigate()

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error

                // Sync user to public.users table
                if (data.user) {
                    await supabase.from('users').upsert([
                        { id: data.user.id, email: data.user.email, name: data.user.email.split('@')[0] }
                    ])
                }

                setMessage('Registration successful! Please check your email to verify your account.')
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                // Sync user to public.users table on login too (in case they were manually created or missed)
                if (data.user) {
                    const { error: upsertError } = await supabase.from('users').upsert([
                        { id: data.user.id, email: data.user.email, name: data.user.email.split('@')[0] }
                    ])
                    if (upsertError) console.error('Error syncing user profile:', upsertError)
                }

                navigate('/')
            }
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[--color-background]">
            {/* Background Aesthetic Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md p-1 group relative z-10 mx-4">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>

                <div className="glass-card !bg-surface/60 backdrop-blur-2xl p-10 relative flex flex-col items-center">
                    <div className="mb-8 relative">
                        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="w-20 h-20 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
                            <img src="/app_icon.svg" alt="WorkMatrix" className="w-12 h-12" />
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black text-gradient-primary tracking-tighter mb-2">WorkMatrix</h2>
                        <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-[10px]">
                            {isSignUp ? 'Create a new account' : 'Sign in to your account'}
                        </p>
                    </div>

                    {error && (
                        <div className="w-full mb-6 p-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
                            <ShieldCheck size={16} /> {error}
                        </div>
                    )}

                    {message && (
                        <div className="w-full mb-6 p-4 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-400/20 rounded-xl flex items-center gap-3">
                            <ShieldCheck size={16} /> {message}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="w-full space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/input:text-primary transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="glass-input w-full pl-12 !py-3 font-medium placeholder:text-white/10"
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/input:text-primary transition-colors" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="glass-input w-full pl-12 pr-12 !py-3 font-medium placeholder:text-white/10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full !py-4 shadow-xl shadow-primary/20 relative overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        {isSignUp ? 'Sign Up' : 'Sign In'}
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp)
                                    setError(null)
                                    setMessage(null)
                                }}
                                className="ml-2 text-primary hover:text-accent font-black transition-colors"
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
