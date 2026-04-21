/**
 * SecurityTips.js — Context-aware tips + Security Education panel.
 * Detects: keyboard walks, simple names, dictionary words, patterns, etc.
 */
import React, { useState, useRef, useEffect } from 'react';
import { analyzeAPI } from '../services/api';

const PROBLEM_LABELS = {
  keyboard_walk:   { icon: '⌨️',  label: 'Keyboard Pattern Detected',  color: '#ff3c5a' },
  simple_name:     { icon: '👤', label: 'Simple Name Detected',        color: '#ff3c5a' },
  dictionary_word: { icon: '📖', label: 'Dictionary Word Detected',    color: '#ff3c5a' },
  repeating_chars: { icon: '🔁', label: 'Repeating Characters Found',  color: '#ffb800' },
  common_password: { icon: '⚠️',  label: 'Common Password Detected',   color: '#ff3c5a' },
  too_short:       { icon: '📏', label: 'Password Too Short',          color: '#ff3c5a' },
  slightly_short:  { icon: '📐', label: 'Could Be Longer',             color: '#ffb800' },
  no_uppercase:    { icon: '🔤', label: 'Missing Uppercase Letters',   color: '#ffb800' },
  no_symbols:      { icon: '🔣', label: 'Missing Special Characters',  color: '#ffb800' },
  looks_ok:        { icon: '✅', label: 'Passes Basic Checks',         color: '#00ff88' },
};

const CRACK_COLORS = { red: '#ff3c5a', orange: '#ff7c3a', yellow: '#ffb800', green: '#00ff88' };

export default function SecurityTips() {
  const [pw,      setPw]      = useState('');
  const [show,    setShow]    = useState(false);
  const [tips,    setTips]    = useState(null);
  const [edu,     setEdu]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const debounce = useRef(null);

  useEffect(() => {
    analyzeAPI.getEducation().then(res => setEdu(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setPw(val); setError('');
    clearTimeout(debounce.current);
    if (!val) { setTips(null); return; }
    debounce.current = setTimeout(() => fetchTips(val), 500);
  };

  const fetchTips = async (password) => {
    setLoading(true);
    try {
      const res = await analyzeAPI.getTips(password);
      setTips(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Backend unavailable. Is it running?');
    } finally { setLoading(false); }
  };

  const problem = tips ? (PROBLEM_LABELS[tips.problem_type] || PROBLEM_LABELS['looks_ok']) : null;

  return (
    <div className="page">

      {/* Tips Panel */}
      <div className="panel" style={{ marginBottom: '2rem' }}>
        <div className="page-title">SECURITY TIPS</div>
        <div className="page-sub">Context-aware advice — specific to your exact password weakness</div>

        <div className="form-group">
          <label className="form-label">ENTER PASSWORD</label>
          <div className="input-wrap">
            <input className="form-input" type={show ? 'text' : 'password'}
              placeholder="[ type password to get specific tips... ]"
              value={pw} onChange={handleChange} autoComplete="off" spellCheck="false" />
            <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}>
              {show ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error   && <div className="alert alert-error">⚠ {error}</div>}
        {loading && <div className="loading-bar"><div className="loading-fill" /></div>}

        {tips && problem && (
          <>
            <div className="tips-problem-badge" style={{ borderColor: problem.color, color: problem.color }}>
              <span style={{ fontSize: 22 }}>{problem.icon}</span>
              <div>
                <div className="tips-problem-label">{problem.label}</div>
                <div className="tips-problem-sub">
                  Score: {tips.password_score}/100 · Rating: {tips.password_label}
                </div>
              </div>
            </div>

            <div className="tips-section">
              <div className="tips-section-title">SPECIFIC ADVICE</div>
              <div className="tips-sub">Based on exactly what was detected in your password</div>
              {tips.context_tips.map((tip, i) => (
                <div className="tips-item context" key={i}>
                  <span className="tips-arrow">→</span>
                  <span>{tip}</span>
                </div>
              ))}
              {tips.substitution_example && (
                <div className="tips-substitution">
                  <span className="tips-sub-label">SUBSTITUTION EXAMPLE</span>
                  <code className="tips-sub-code">{tips.substitution_example}</code>
                </div>
              )}
            </div>

            {tips.extra_tips?.length > 0 && (
              <div className="tips-section">
                <div className="tips-section-title">ADDITIONAL WARNINGS</div>
                {tips.extra_tips.map((tip, i) => (
                  <div className="tips-item extra" key={i}>
                    <span className="tips-arrow amber">⚡</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!pw && (
          <div className="empty-state">
            <div className="empty-icon">💡</div>
            <div className="empty-text">// type a password above to get specific advice...</div>
          </div>
        )}
      </div>

      {/* Education Panel */}
      {edu && (
        <div className="panel edu-panel">
          <div className="page-title">SECURITY EDUCATION</div>
          <div className="page-sub">Why password security matters — with real numbers</div>

          <div className="edu-section">
            <div className="edu-section-title"><span>⏱</span> CRACK TIME COMPARISON</div>
            <div className="edu-section-sub">At 10 billion guesses per second (modern GPU)</div>
            <div className="crack-table">
              {edu.crack_time_examples.map((ex, i) => (
                <div className="crack-row" key={i}>
                  <div className="crack-pw">
                    <code style={{ color: CRACK_COLORS[ex.color] || '#fff' }}>{ex.password}</code>
                  </div>
                  <div className="crack-time" style={{ color: CRACK_COLORS[ex.color] }}>{ex.time}</div>
                  <div className="crack-reason">{ex.reason}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="edu-section">
            <div className="edu-section-title"><span>🔗</span> {edu.reuse_risk.title}</div>
            <div className="edu-card red-card">
              <p className="edu-card-text">{edu.reuse_risk.message}</p>
              <div className="edu-stat">
                <span className="edu-stat-icon">📊</span>
                <span className="edu-stat-text">{edu.reuse_risk.stat}</span>
              </div>
            </div>
          </div>

          <div className="edu-section">
            <div className="edu-section-title"><span>🔐</span> {edu.two_factor.title}</div>
            <div className="edu-card cyan-card">
              <p className="edu-card-text">{edu.two_factor.message}</p>
              <div className="edu-2fa-types">
                {edu.two_factor.types.map((t, i) => (
                  <div className="edu-2fa-type" key={i}>
                    <span className="edu-2fa-num">{i + 1}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="edu-section">
            <div className="edu-section-title"><span>📐</span> {edu.length_vs_complexity.title}</div>
            <div className="edu-card green-card">
              <p className="edu-card-text">{edu.length_vs_complexity.message}</p>
              <div className="lvc-table">
                <div className="lvc-header">
                  <span>TYPE</span><span>EXAMPLE</span>
                  <span>ENTROPY</span><span>MEMORABLE?</span>
                </div>
                {edu.length_vs_complexity.comparison.map((item, i) => (
                  <div className="lvc-row" key={i}>
                    <span className="lvc-type">{item.type}</span>
                    <code className="lvc-example">{item.example}</code>
                    <span className="lvc-entropy">{item.entropy}</span>
                    <span className={`lvc-mem ${item.memorable ? 'yes' : 'no'}`}>
                      {item.memorable ? '✅ YES' : '❌ NO'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
