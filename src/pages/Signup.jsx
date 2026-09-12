import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    // Store name in auth metadata — this works even if email confirmation
    // is required and no session exists yet (unlike a direct table insert,
    // which needs an active session to pass the RLS check).
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    // If email confirmation is ON, there's no session yet — user must
    // confirm via email before logging in.
    if (data.user && !data.session) {
      setInfo('Account created. Check your email to confirm, then log in.')
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSignup}>
        <h1>Create account</h1>
        <p className="auth-sub">Set up admin access for litter monitoring</p>

        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
