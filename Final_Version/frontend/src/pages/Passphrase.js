/**
 * Passphrase.js — Diceware Passphrase Suggester
 * Generates memorable, cryptographically strong passphrases.
 */
import React, { useState, useEffect } from 'react';
import { passphraseAPI } from '../services/api';

const STRENGTH_COLORS = {
  'Fair': '#ffb800', 'Strong': '#00f5ff',
  'Very Strong': '#00ff88', 'Extremely Strong': '#00ff88',
};

export default function Passphrase() {
  const [wordCount,  setWordCount]  = useState(4);
  const [result,     setResult]     = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    passphraseAPI.compare()
      .then(res => setComparison(res.data.comparison))
      .catch(() => {});
    generate(4);
  }, []); // eslint-disable-line

  const generate = async (words = wordCount) => {
    setLoading(true); setError(''); setCopied(false);
    try {
      const res = await passphraseAPI.generate(words);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Backend unavailable. Is it running?');
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.passphrase).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sColor = result ? STRENGTH_COLORS[result.strength_label] || '#00f5ff' : '#888';

  return (
    <div className="page">
      <div className="panel" style={{ marginBottom: '2rem' }}>
        <div className="page-title">PASSPHRASE GENERATOR</div>
        <div className="page-sub">
          Diceware algorithm · EFF wordlist · Cryptographically random (OS CSPRNG)
        </div>

        {/* Word count slider */}
        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label className="form-label">
            NUMBER OF WORDS —&nbsp;
            <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              {wordCount} words
            </span>
          </label>
          <input type="range" min={3} max={8} value={wordCount}
            onChange={e => { const v = +e.target.value; setWordCount(v); generate(v); }}
            className="pp-slider" />
          <div className="pp-slider-labels">
            {[3,4,5,6,7,8].map(n => (
              <span key={n} style={{ color: n === wordCount ? 'var(--cyan)' : 'var(--text-muted)' }}>{n}</span>
            ))}
          </div>
        </div>

        {error   && <div className="alert alert-error">⚠ {error}</div>}
        {loading && <div className="loading-bar"><div className="loading-fill" /></div>}

        {result && !loading && (
          <>
            {/* Passphrase display */}
            <div className="pp-display">
              <div className="pp-words">
                {result.words.map((w, i) => (
                  <React.Fragment key={i}>
                    <span className="pp-word">{w}</span>
                    {i < result.words.length - 1 && <span className="pp-sep">-</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="metrics-row" style={{ marginTop: '1rem' }}>
              {[
                { icon: '🎲', val: result.word_count,    name: 'WORDS'    },
                { icon: '🔢', val: `${result.entropy_bits}b`, name: 'ENTROPY' },
                { icon: '📚', val: result.wordlist_size, name: 'WORDLIST' },
                { icon: '💪', val: result.strength_label, name: 'STRENGTH' },
              ].map(m => (
                <div className="metric-card" key={m.name}>
                  <span className="metric-icon">{m.icon}</span>
                  <span className="metric-val"
                    style={m.name === 'STRENGTH' ? { color: sColor, fontSize: 11 } : {}}>
                    {m.val}
                  </span>
                  <span className="metric-name">{m.name}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pp-actions">
              <button className="btn" onClick={copy}>
                {copied ? '✅ COPIED!' : '[ COPY TO CLIPBOARD ]'}
              </button>
              <button className="btn btn-outline" onClick={() => generate(wordCount)} disabled={loading}>
                🔄 REGENERATE
              </button>
            </div>

            {/* Why it works */}
            <div className="feedback-box" style={{ marginTop: '1rem' }}>
              <div className="feedback-title">WHY THIS WORKS</div>
              <div className="feedback-item">→ {result.word_count} real words = easy to remember and type</div>
              <div className="feedback-item">→ Entropy = log2({result.wordlist_size}^{result.word_count}) = {result.entropy_bits} bits</div>
              <div className="feedback-item">→ secrets.choice() uses OS CSPRNG — truly unpredictable</div>
              <div className="feedback-item">→ EFF wordlist: no offensive, ambiguous, or confusing words</div>
            </div>
          </>
        )}
      </div>

      {/* Comparison table */}
      {comparison.length > 0 && (
        <div className="panel edu-panel">
          <div className="page-title">ENTROPY COMPARISON</div>
          <div className="page-sub">
            Why long passphrases often outperform short complex passwords
          </div>
          <div className="crack-table" style={{ marginTop: '1.2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px 90px 1fr',
              gap: 12, padding: '8px 14px', background: 'rgba(0,255,136,0.08)',
              fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--green)' }}>
              <span>TYPE</span><span>EXAMPLE</span>
              <span>ENTROPY</span><span>MEMORABLE</span><span>VERDICT</span>
            </div>
            {comparison.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px 90px 1fr',
                gap: 12, padding: '10px 14px', borderTop: '1px solid rgba(0,245,255,0.08)',
                fontSize: 13, alignItems: 'center',
                background: row.memorable ? 'rgba(0,255,136,0.03)' : 'transparent' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{row.type}</span>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--text-primary)', wordBreak: 'break-all' }}>{row.example}</code>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontSize: 12 }}>
                  {row.entropy}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700,
                  color: row.memorable ? 'var(--green)' : 'var(--red)' }}>
                  {row.memorable ? '✅ YES' : '❌ NO'}
                </span>
                <span style={{ fontSize: 12,
                  color: row.memorable ? 'var(--green)' : 'var(--text-secondary)' }}>
                  {row.verdict}
                </span>
              </div>
            ))}
          </div>
          <div className="edu-card cyan-card" style={{ marginTop: '1.5rem' }}>
            <p className="edu-card-text">
              <strong style={{ color: 'var(--cyan)' }}>Key insight:</strong> A 4-word
              Diceware passphrase (~51.7 bits) matches an 8-character complex password
              in strength — while being far easier to remember. Every additional word
              adds ~12.9 bits of entropy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
