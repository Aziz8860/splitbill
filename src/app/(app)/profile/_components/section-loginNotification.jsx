import Link from 'next/link';
import React from 'react';

export const SectionLoginNotification = () => {
  return (
    <section className="flex flex-col text-center space-y-4">
      <p className="text-2xl font-bold text-gray-600 ">
        Kamu belum memiliki akun,{' '}
      </p>
      <Link
        href={'/login'}
        className="flex items-center justify-center rounded-full text-xl bg-indigo-500 hover:bg-green-500 animate-pulse h-12 w-full text-white "
      >
        Masuk
      </Link>
    </section>
  );
};
