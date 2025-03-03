import React from 'react';

export default function Layout({ children }) {
  // const session = await auth();

  return (
    // Header here
    <main className="max-w-3xl m-auto py-12 flex flex-col justify-between min-h-[88vh]">
      {children}
    </main>
    // Footer here
  );
}
