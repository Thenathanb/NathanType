import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { acceptFriendRequest, declineFriendRequest } from '../../utils/firestoreService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface FriendRequest {
  fromUid: string;
  fromUsername: string;
  sentAt: number;
}

export function FriendRequestBanner() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      collection(db, 'users', currentUser.uid, 'friendRequests'),
      snap => setRequests(snap.docs.map(d => d.data() as FriendRequest)),
      err => console.error('friend requests snapshot error:', err)
    );
    return () => unsub();
  }, [currentUser]);

  if (!requests.length) return null;

  const accept = async (req: FriendRequest) => {
    if (!currentUser) return;
    try {
      await acceptFriendRequest(currentUser.uid, req.fromUid);
      toast.success(`you and ${req.fromUsername} are now friends`);
    } catch { toast.error('failed to accept request'); }
  };

  const decline = async (req: FriendRequest) => {
    if (!currentUser) return;
    try {
      await declineFriendRequest(currentUser.uid, req.fromUid);
    } catch { toast.error('failed to decline request'); }
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      {requests.map(req => (
        <div key={req.fromUid} className="flex items-center justify-between rounded-xl px-4 py-3 font-mono"
          style={{ backgroundColor: 'var(--bg2)', border: '0.5px solid color-mix(in srgb, var(--main) 20%, transparent)' }}>
          <span style={{ color: 'var(--text)', fontSize: 13 }}>
            <span style={{ color: 'var(--main)' }}>{req.fromUsername}</span> wants to be friends
          </span>
          <div className="flex gap-2">
            <button onClick={() => accept(req)}
              className="rounded px-3 py-1 font-mono text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--main)', color: 'var(--bg)', border: 'none', cursor: 'pointer', fontSize: 12 }}>
              accept
            </button>
            <button onClick={() => decline(req)}
              className="rounded px-3 py-1 font-mono text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'transparent', color: 'var(--sub)', border: '0.5px solid var(--sub)', cursor: 'pointer', fontSize: 12 }}>
              decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
