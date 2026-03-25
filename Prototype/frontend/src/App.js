// SecurePass Prototype v0.1
// Simple React frontend — calls FastAPI on port 8000

import React, { useState } from 'react';

const COLORS = {
  Weak:   '#e74c3c',
  Medium: '#f39c12',
  Strong: '#27ae60',
};

const CHECKS = {
  length:    'At least 8 characters',
  uppercase: 'Contains uppercase letter (A-Z)',
  lowercase: 'Contains lowercase letter (a-z)',
  number:    'Contains a number (0-9)',
  special:   'Contains special character (!@#$...)',
};

export default function App() {
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const checkPassword = async () => {
    if (!password) { setError('Please enter a password'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      // Calling FastAPI on port 8000 directly
      const res  = await fetch('http://localhost:8000/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('Cannot connect to server. Make sure FastAPI is running on port 8000.');
    } finally { setLoading(false); }
  };

  const color = result ? COLORS[result.label] : '#ccc';

  return (
    <div style={{ fontFamily:'Arial,sans-serif', maxWidth:480, margin:'40px auto', padding:20 }}>

      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:30 }}>
        <div style={{ fontSize:32, marginBottom:6 }}>🛡️</div>
        <h1 style={{ fontSize:24, color:'#2c3e50', margin:0 }}>SecurePass</h1>
        <p style={{ color:'#7f8c8d', fontSize:13, margin:'6px 0 0' }}>
          Password Strength Checker — Prototype v0.1
        </p>
      </div>

      {/* Card */}
      <div style={{ background:'#fff', border:'1px solid #ddd', borderRadius:10, padding:24, boxShadow:'0 2px 10px rgba(0,0,0,0.08)' }}>

        {/* Input */}
        <label style={{ fontWeight:'bold', fontSize:13, color:'#2c3e50', display:'block', marginBottom:8 }}>
          Enter Password
        </label>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input
            type={show ? 'text' : 'password'}
            placeholder="Type your password..."
            value={password}
            onChange={e => { setPassword(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && checkPassword()}
            style={{ flex:1, padding:'10px 12px', fontSize:15, border:'1px solid #bdc3c7', borderRadius:6, outline:'none' }}
          />
          <button
            onClick={() => setShow(s => !s)}
            style={{ padding:'10px 14px', background:'#ecf0f1', border:'1px solid #bdc3c7', borderRadius:6, cursor:'pointer', fontSize:16 }}
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>

        {error && <p style={{ color:'#e74c3c', fontSize:13, margin:'0 0 10px' }}>{error}</p>}

        <button
          onClick={checkPassword}
          disabled={loading}
          style={{ width:'100%', padding:12, background:'#3498db', color:'#fff', border:'none', borderRadius:6, fontSize:15, cursor:'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Checking...' : 'Check Password Strength'}
        </button>

        {/* Results */}
        {result && (
          <div style={{ marginTop:20 }}>
            <hr style={{ border:'none', borderTop:'1px solid #ecf0f1', margin:'0 0 16px' }} />

            {/* Score */}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontWeight:'bold', fontSize:18, color }}>{result.label}</span>
              <span style={{ color:'#7f8c8d', fontSize:14 }}>Score: {result.score} / 100</span>
            </div>

            {/* Meter */}
            <div style={{ height:10, background:'#ecf0f1', borderRadius:5, overflow:'hidden', marginBottom:20 }}>
              <div style={{ height:'100%', width:`${result.score}%`, background:color, borderRadius:5, transition:'width 0.4s ease' }} />
            </div>

            {/* Rule Checks */}
            <p style={{ fontWeight:'bold', fontSize:13, color:'#2c3e50', marginBottom:8 }}>Rule Checks:</p>
            {Object.entries(CHECKS).map(([key, label]) => (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0', fontSize:13 }}>
                <span>{result.checks[key] ? '✅' : '❌'}</span>
                <span style={{ color: result.checks[key] ? '#27ae60' : '#95a5a6' }}>{label}</span>
              </div>
            ))}

            {/* ML Box */}
            <div style={{ marginTop:16, background:'#f8f9fa', border:'1px solid #dee2e6', borderRadius:8, padding:14 }}>
              <p style={{ fontWeight:'bold', fontSize:13, color:'#2c3e50', margin:'0 0 6px' }}>🤖 ML Model Prediction</p>
              <p style={{ color: COLORS[result.ml_label], fontWeight:'bold', margin:'0 0 4px', fontSize:15 }}>
                {result.ml_label} — {result.confidence}% confidence
              </p>
              <p style={{ color:'#95a5a6', fontSize:11, margin:0 }}>
                Features used: password length, special characters, numbers
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p style={{ textAlign:'center', fontSize:11, color:'#bdc3c7', marginTop:16 }}>
        SecurePass Prototype v0.1 · B.Tech CSE 3rd Year · RBCET
      </p>
    </div>
  );
}
