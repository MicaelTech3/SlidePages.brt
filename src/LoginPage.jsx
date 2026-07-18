import React, { useState } from 'react';
import { loginUser, registerUser } from './firebaseService';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'Email não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'Este email já está cadastrado.',
        'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
        'auth/invalid-email': 'Email inválido.',
        'auth/invalid-credential': 'Email ou senha incorretos.',
      };
      setError(msgs[err.code] || `Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0c0c10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Outfit', sans-serif",
      padding: '1.5rem'
    }}>
      {/* Glow background blobs */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 40% at 20% 30%, rgba(229,62,62,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 80% 70%, rgba(229,62,62,0.05) 0%, transparent 70%)'
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(229,62,62,0.15)',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        boxShadow: '0 0 40px rgba(229,62,62,0.08), 0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'rgba(229,62,62,0.12)', border: '1px solid rgba(229,62,62,0.3)',
            marginBottom: '1rem'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: 0 }}>SlidePages</h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: '0.3rem 0 0' }}>
            Painel Administrativo
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
          padding: '3px', marginBottom: '1.75rem', gap: '3px'
        }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '0.45rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.8rem',
                background: mode === m ? '#E53E3E' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.2s ease'
              }}>
              {m === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>
              Email
            </label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)',
                color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box',
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(229,62,62,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>
              Senha
            </label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)',
                color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box',
                outline: 'none', fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(229,62,62,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>
                Confirmar Senha
              </label>
              <input
                type="password" required
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)',
                  color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'inherit'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(229,62,62,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)',
              borderRadius: '8px', padding: '0.65rem 0.85rem',
              color: '#fc8181', fontSize: '0.8rem', lineHeight: 1.4
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none',
            background: loading ? 'rgba(229,62,62,0.4)' : '#E53E3E',
            color: '#fff', fontWeight: '700', fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 20px rgba(229,62,62,0.3)',
            transition: 'all 0.2s ease', fontFamily: 'inherit'
          }}>
            {loading ? 'Aguarde...' : (mode === 'login' ? 'Entrar no Painel' : 'Criar Conta')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', marginTop: '1.5rem' }}>
          SlidePages • Controle Remoto em Tempo Real
        </p>
      </div>
    </div>
  );
}
