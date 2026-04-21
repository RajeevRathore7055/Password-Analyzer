/**
 * Analyzer.js — Password Strength Analyzer
 * Shows: strength meter, radar chart, metric cards, checklist, feedback, breach check.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = { Strong: '#00f5ff', Medium: '#ffb800', Weak: '#ff3c5a' };

const CHECK_LABELS = {
  min_length:   '>= 8 characters',
  good_length:  '>= 12 characters',
  great_length: '>= 16 characters',
  has_upper:    'Uppercase letters',
  has_lower:    'Lowercase letters',
  has_digit:    'Numbers (0-9)',
  has_symbol:   'Special characters',
  no_repeat:    'No repeated chars',
  no_common:    'No common patterns',
};

// Simple SVG Radar / Spider chart
function RadarChart({ data, color }) {
  const size   = 200;
  const cx     = size / 2;
  const cy     = size / 2;
  const r      = 80;
  const levels = 4;
  const labels = data.map(d => d.label);
  const n      = labels.length;

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, radius) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) =>
    Array.from({ length: n }, (_, j) => point(j, (r * (i + 1)) / levels))
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`)
      .join(' ') + 'Z'
  );

  // Data polygon
  const polygon = data.map((d, i) => {
    const p = point(i, (d.value / 100) * r);
    return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`;
  }).join(' ') + 'Z';

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid */}
      {rings.map((d, i) => (
        <path key={i} d={d} fill="none"
          stroke="rgba(0,245,255,0.1)" strokeWidth={1} />
      ))}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const p = point(i, r);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
          stroke="rgba(0,245,255,0.12)" strokeWidth={1} />;
      })}
      {/* Data area */}
      <path d={polygon} fill={color + '33'} stroke={color} strokeWidth={2} />
      {/* Data dots */}
      {data.map((d, i) => {
        const p = point(i, (d.value / 100) * r);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />;
      })}
      {/* Labels */}
      {data.map((d, i) => {
        const p = point(i, r + 18);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 9, fill: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// Horizontal bar chart for strength breakdown
function StrengthBars({ rule, pw }) {
  const bars = [
    { label: 'Length',     val: Math.min(100, (pw.length / 20) * 100), color: '#00f5ff' },
    { label: 'Entropy',    val: Math.min(100, (rule.entropy / 100) * 100), color: '#7c3aed' },
    { label: 'Uniqueness', val: rule.uniqueness ?? Math.min(100, (new Set(pw).size / pw.length) * 100), color: '#00ff88' },
    { label: 'Complexity', val: rule.score,      color: '#ffb800' },
  ];
  return (
    <div style={{ margin: '1.2rem 0' }}>
      {bars.map(b => (
        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.1em',
            color: 'var(--text-secondary)', width: 80, flexShrink: 0 }}>
            {b.label.toUpperCase()}
          </span>
          <div style={{ flex: 1, height: 6, background: 'var(--bg-deep)', borderRadius: 3,
            border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${b.val}%`, background: b.color,
              borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-secondary)', width: 34, textAlign: 'right' }}>
            {Math.round(b.val)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Analyzer() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [pw,      setPw]      = useState('');
  const [show,    setShow]    = useState(false);
  const [result,  setResult]  = useState(null);
  const [breach,  setBreach]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [bLoad,   setBLoad]   = useState(false);
  const [error,   setError]   = useState('');
  const debounce = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setPw(val); setBreach(null); setError('');
    clearTimeout(debounce.current);
    if (!val) { setResult(null); return; }
    debounce.current = setTimeout(() => analyze(val), 400);
  };

  const analyze = async (password) => {
    setLoading(true);
    try {
      const res = await analyzeAPI.analyze(password);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Is the backend running?');
    } finally { setLoading(false); }
  };

  const checkBreach = async () => {
    if (!pw) return;
    setBLoad(true); setBreach(null);
    try {
      const res = await analyzeAPI.breach(pw, result?.scan_id);
      setBreach(res.data);
    } catch (err) {
      setBreach({ error: err.response?.data?.detail || 'Breach check failed' });
    } finally { setBLoad(false); }
  };

  const rule  = result?.rule_based;
  const ml    = result?.ml;
  const color = rule ? COLORS[rule.label] || '#888' : '#888';

  // Radar chart data
  const radarData = rule ? [
    { label: 'Length',    value: Math.min(100, (pw.length / 20) * 100) },
    { label: 'Entropy',   value: Math.min(100, (rule.entropy / 100) * 100) },
    { label: 'Unique',    value: rule.uniqueness ?? Math.min(100, (new Set(pw).size / pw.length) * 100) },
    { label: 'Variety',   value: [rule.checks.has_upper, rule.checks.has_lower, rule.checks.has_digit, rule.checks.has_symbol].filter(Boolean).length * 25 },
    { label: 'Score',     value: rule.score },
  ] : [];

  return (
    <div className="page">
      <div className="panel">
        <div className="page-title">PASSWORD ANALYZER</div>
        <div className="page-sub">
          {user ? `logged in as ${user.name} — scans are saved` : 'guest mode — scans not saved'}
        </div>

        <div className="form-group">
          <label className="form-label">ENTER PASSWORD</label>
          <div className="input-wrap">
            <input className="form-input" type={show ? 'text' : 'password'}
              placeholder="[ type password to analyze... ]"
              value={pw} onChange={handleChange} autoComplete="off" spellCheck="false" />
            <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}>
              {show ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error   && <div className="alert alert-error">⚠ {error}</div>}
        {loading && <div className="loading-bar"><div className="loading-fill" /></div>}

        {rule && (
          <>
            {/* Strength meter */}
            <div className="meter-wrap">
              <div className="meter-bar-bg">
                <div className="meter-bar-fill"
                  style={{ width: `${rule.score}%`, background: color }} />
              </div>
              <div className="meter-meta">
                <span className="meter-label" style={{ color }}>{rule.label.toUpperCase()}</span>
                <span className="meter-entropy">{rule.entropy} bits · {rule.crack_time}</span>
              </div>
            </div>

            {/* ML badge */}
            {ml && (
              <div className={`ml-badge ${ml.label.toLowerCase()}`}>
                <span>🤖</span>
                <span>ML: <strong>{ml.label.toUpperCase()}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    &nbsp;· {ml.confidence_pct} confidence
                  </span>
                </span>
              </div>
            )}

            {/* Metric cards */}
            <div className="metrics-row">
              {[
                { icon: '📏', val: pw.length,          name: 'LENGTH'  },
                { icon: '🔢', val: `${rule.entropy}b`, name: 'ENTROPY' },
                { icon: '⏱',  val: rule.crack_time,   name: 'CRACK'   },
                { icon: '💯', val: `${rule.score}`,    name: 'SCORE'   },
              ].map(m => (
                <div className="metric-card" key={m.name}>
                  <span className="metric-icon">{m.icon}</span>
                  <span className="metric-val">{m.val}</span>
                  <span className="metric-name">{m.name}</span>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '1.2rem 0',
              background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)', padding: '16px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9,
                  color: 'var(--text-secondary)', letterSpacing: '0.15em', marginBottom: 8 }}>
                  STRENGTH RADAR
                </div>
                <RadarChart data={radarData} color={color} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9,
                  color: 'var(--text-secondary)', letterSpacing: '0.15em', marginBottom: 8 }}>
                  BREAKDOWN
                </div>
                <StrengthBars rule={rule} pw={pw} />
              </div>
            </div>

            {/* Checklist */}
            <div className="check-list">
              {Object.entries(CHECK_LABELS).map(([key, label]) => (
                <div key={key} className={`check-item ${rule.checks[key] ? 'ok' : ''}`}>
                  <span className="check-dot" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Feedback */}
            {rule.feedback?.length > 0 && (
              <div className="feedback-box">
                <div className="feedback-title">SUGGESTIONS</div>
                {rule.feedback.map((f, i) => (
                  <div className="feedback-item" key={i}>→ {f}</div>
                ))}
              </div>
            )}

            {/* Tips CTA */}
            {(rule.label === 'Weak' || rule.label === 'Medium') && (
              <div className="m4-cta" onClick={() => navigate('/security-tips')}>
                <div className="m4-cta-icon">💡</div>
                <div className="m4-cta-text">
                  <div className="m4-cta-title">WHY IS IT WEAK?</div>
                  <div className="m4-cta-sub">Get specific advice based on your exact weakness</div>
                </div>
                <div className="m4-cta-arrow">›</div>
              </div>
            )}

            <div className="divider" />
            <button className="btn" onClick={checkBreach} disabled={bLoad}>
              {bLoad ? '[ SCANNING HIBP DATABASE... ]' : '[ CHECK IF PASSWORD WAS BREACHED ]'}
            </button>

            {breach && !breach.error && (
              <div className={`breach-result ${breach.is_breached ? 'pwned' : 'safe'}`}>
                <span style={{ fontSize: 18 }}>{breach.is_breached ? '⚠️' : '✅'}</span>
                <span>{breach.message}</span>
              </div>
            )}
            {breach?.error && (
              <div className="breach-result error">⚡ {breach.error}</div>
            )}
          </>
        )}

        {!pw && (
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <div className="empty-text">// awaiting input...</div>
          </div>
        )}
      </div>
    </div>
  );
}
