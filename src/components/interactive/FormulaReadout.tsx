import { useRef, useEffect } from 'react';

interface FormulaItem {
  label: string;
  expression: string;
  value?: string;
  highlight?: 'default' | 'accent' | 'warning' | 'critical';
}

interface FormulaReadoutProps {
  formulas: FormulaItem[];
}

export function FormulaReadout({ formulas }: FormulaReadoutProps) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).katex) return;
    formulas.forEach((f, i) => {
      const el = refs.current[i];
      if (el) {
        (window as any).katex.render(f.expression, el, {
          displayMode: true,
          throwOnError: false,
        });
      }
    });
  }, [formulas]);

  return (
    <div style={{
      background: 'var(--color-surface-1, var(--color-surface))',
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
      padding: '0.75rem 1rem',
      marginTop: '0.75rem',
    }}>
      {formulas.map((f, i) => (
        <div key={i} style={{
          marginBottom: i < formulas.length - 1 ? '0.75rem' : 0,
          paddingBottom: i < formulas.length - 1 ? '0.75rem' : 0,
          borderBottom: i < formulas.length - 1 ? '1px solid var(--color-border)' : 'none',
        }}>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--color-muted)',
            marginBottom: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {f.label}
          </div>
          <div
            ref={el => { refs.current[i] = el; }}
            style={{ textAlign: 'center', overflowX: 'auto' }}
          />
          {f.value && (
            <div style={{
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: f.highlight === 'critical' ? 'var(--color-vector-red)'
                : f.highlight === 'warning' ? 'var(--color-vector-yellow)'
                : 'var(--color-accent)',
              fontWeight: f.highlight === 'critical' || f.highlight === 'accent' ? 'bold' : 'normal',
              textAlign: 'center',
              marginTop: '0.25rem',
            }}>
              = {f.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
