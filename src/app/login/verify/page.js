'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function VerificationPage() {

  const [code, setCode] = useState('');

  const router = useRouter();

  const handleVerification = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      router.push('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm p-6 rounded bg-transparent">
        <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Ověření přihlášení</h1>
        <form onSubmit={handleVerification} className="flex flex-col gap-3">
          <input className="border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="code" value={code} onChange={e => setCode(e.target.value)} />
          <button className="button" type="submit">Odeslat</button>
        </form>
      </div>
    </div>


  );
}