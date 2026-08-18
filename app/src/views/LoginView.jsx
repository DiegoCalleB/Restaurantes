import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';

const LoginView = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Usuarios predefinidos
    if (username === 'EmilioGallego' && password === 'Silvestre2026') {
      onLogin({ username, role: 'admin' });
    } else if (username === 'Diego' && password === 'hamlet21') {
      onLogin({ username, role: 'admin' });
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <div style={{
        background: 'var(--surface)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', color: 'var(--accent)', fontFamily: 'serif' }}>
            silvestre
          </div>
          <div style={{ fontSize: '12px', color: 'var(--textSoft)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '-2px' }}>
            VINOS Y COMIDAS
          </div>
          <div style={{ marginTop: '20px', fontSize: '18px', fontWeight: '600' }}>
            Iniciar Sesión
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--textSoft)' }}>
              Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--textSoft)' }}>
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Introduce tu usuario"
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--textSoft)' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--textSoft)' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduce tu contraseña"
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              color: 'white',
              border: 'none',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px -3px rgba(59, 110, 165, 0.5)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
