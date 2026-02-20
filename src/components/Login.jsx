import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

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
        <div className="flex min-h-screen items-center justify-center bg-background text-text">
            <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-lg shadow-xl border border-gray-800">
                <h2 className="text-3xl font-bold text-center text-primary">Task Platform</h2>
                <p className="text-center text-text-muted">
                    {isSignUp ? 'Create a new account' : 'Sign in to your account'}
                </p>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="user@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-10"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary hover:bg-indigo-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="text-center text-sm text-text-muted mt-4">
                    <p>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                setError(null)
                                setMessage(null)
                            }}
                            className="ml-2 text-primary hover:underline font-semibold"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
