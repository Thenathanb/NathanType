import { useState } from 'react';
import { FriendRequestBanner } from '../components/Friends/FriendRequestBanner';
import { AddFriendInput }      from '../components/Friends/AddFriendInput';
import { FriendsTable }        from '../components/Friends/FriendsTable';

export function Friends() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="page-scroll">
      <div className="w-full max-w-5xl mx-auto px-5 py-8 font-mono" style={{ animation: 'fadeIn 0.2s ease-out' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--main)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            <h1 style={{ color: 'var(--main)', fontSize: 26, fontWeight: 500 }}>friends</h1>
          </div>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="font-mono rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg2)', color: 'var(--text)', border: '0.5px solid rgba(255,255,255,0.1)', padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--main)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
          >
            {showAdd ? '✕ cancel' : '+ add friend'}
          </button>
        </div>

        {showAdd && (
          <div className="mb-5">
            <AddFriendInput />
          </div>
        )}

        <FriendRequestBanner />

        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg2)' }}>
          <FriendsTable />
        </div>

      </div>
    </div>
  );
}
