'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ padding: '4rem', textAlign: 'center' }}>
      <h1>Algo deu errado.</h1>
      <p>Estamos trabalhando para resolver isso.</p>
      <button onClick={() => reset()}>Tentar novamente</button>
    </main>
  );
}
