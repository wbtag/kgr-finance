'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push('/login/verify');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm p-6 rounded bg-transparent">
        <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Přihlášení</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input className="border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="Uživatelské jméno" value={username} onChange={e => setUsername(e.target.value)} />
          <input className="border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" type="password" placeholder="Heslo" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="button" type="submit">Přihlásit se</button>
        </form>
      </div>
    </div>


  );
}