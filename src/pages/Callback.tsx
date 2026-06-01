import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleSpotifyCallback } from '../services/spotify';

export function Callback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error || !code) {
      setStatus('error');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    handleSpotifyCallback(code).then((ok) => {
      if (ok) {
        setStatus('success');
        setTimeout(() => navigate('/'), 1000);
      } else {
        setStatus('error');
        setTimeout(() => navigate('/'), 2000);
      }
    });
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center font-mono" style={{ color: '#646669' }}>
      {status === 'loading' && <p>connecting to spotify…</p>}
      {status === 'success' && <p style={{ color: '#1DB954' }}>spotify connected! redirecting…</p>}
      {status === 'error' && <p style={{ color: '#ca4754' }}>connection failed — redirecting…</p>}
    </div>
  );
}
