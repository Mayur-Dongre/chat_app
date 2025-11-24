'use client'
import dynamic from 'next/dynamic';

const Chat = dynamic(() => import('./chat.jsx'), {
  ssr: false,
  loading: () => <p>Loading chat...</p>
});


export default function Home() {
  return (
    <div>
      <Chat />
    </div>
  );
}
