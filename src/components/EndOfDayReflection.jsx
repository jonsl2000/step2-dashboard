import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

async function getReflection(date) {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  if (error) {
    console.error('getReflection error:', error);
    return null;
  }
  return data;
}

async function saveReflection(date, reflectionText) {
  const { data, error } = await supabase
    .from('reflections')
    .upsert(
      {
        date,
        reflection_text: reflectionText,
      },
      { onConflict: 'date' }
    )
    .select()
    .single();

  if (error) {
    console.error('saveReflection error:', error);
    return null;
  }
  return data;
}

export default function EndOfDayReflection({
  currentDate,
  dayData,
  hoursLogged,
  ankiLogged,
  tasksCompleted,
  totalTasks,
  currentSystem,
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    setText('');
    setExisting(null);
    setSaved(false);

    getReflection(currentDate).then((r) => {
      if (r) {
        setExisting(r);
        setText(r.reflection_text || '');
        setSaved(true);
      }
    });
  }, [currentDate]);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);

    const result = await saveReflection(currentDate, text);

    if (result) {
      setExisting(result);
      setSaved(true);
    }

    setLoading(false);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: existing ? '#F0FFF4' : 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {existing ? '✓ Reflection logged' : 'End of day reflection'}
          </span>
        </div>
        <span style={{ color: '#9CA3AF', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          style={{
            borderTop: '1px solid #F3F4F6',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
            What clicked today? What is still fuzzy? Be specific.
          </div>

          <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
            {currentDate} · {currentSystem || 'Unknown system'} · {hoursLogged || 0}h · {ankiLogged || 0} Anki · {tasksCompleted}/{totalTasks} tasks
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="e.g. Cardio arrhythmias finally clicked. GI bleed management still feels shaky."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              fontSize: 13,
              fontFamily: 'inherit',
              color: '#111827',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />

          <button
            onClick={submit}
            disabled={loading || !text.trim()}
            style={{
              background: loading ? '#9CA3AF' : '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Saving...' : saved ? 'Saved' : 'Save reflection'}
          </button>
        </div>
      )}
    </div>
  );
}
