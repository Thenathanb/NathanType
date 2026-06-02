import { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { sendFriendRequest } from '../../utils/firestoreService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function AddFriendInput() {
  const { currentUser, userProfile } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!input.trim() || !currentUser || !userProfile) return;
    setLoading(true);
    setError('');
    try {
      // Search by username field in users collection
      const q = query(collection(db, 'users'), where('username', '==', input.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('user not found');
        setLoading(false);
        return;
      }
      const targetUid = snap.docs[0].id;
      if (targetUid === currentUser.uid) {
        setError('you cannot add yourself');
        setLoading(false);
        return;
      }
      const fromUsername = userProfile.username || userProfile.displayName;
      const result = await sendFriendRequest(currentUser.uid, fromUsername, targetUid);
      if (result.success) {
        toast.success(`friend request sent to ${input.trim()}`);
        setInput('');
      } else {
        setError(result.error ?? 'failed to send request');
      }
    } catch (err) {
      setError('something went wrong');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="font-mono">
      <div className="flex gap-2 items-center">
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="enter username"
          className="font-mono outline-none rounded-lg"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid color-mix(in srgb, var(--sub) 40%, transparent)', padding: '8px 14px', fontSize: 13, width: 220 }}
          autoFocus
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="font-mono rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--main)', color: 'var(--bg)', border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: 13 }}
        >
          {loading ? '…' : 'send'}
        </button>
      </div>
      {error && <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
