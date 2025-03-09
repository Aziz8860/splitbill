import Link from 'next/link';
import React from 'react';

export const SectionLoginNotification = () => {
  return (
    <section className="flex flex-col text-center space-y-10 border bg-slate-100 border-slate-200 rounded-xl p-12 h-[calc(100vh-250px)] shadow-sm items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
      >
        <path
          fill="#ABABAB"
          d="M6 7.5a5.5 5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0M18 14c.69 0 1.25.56 1.25 1.25V16h-2.5v-.75c0-.69.56-1.25 1.25-1.25m3.25 2v-.75a3.25 3.25 0 0 0-6.5 0V16h-1.251v6.5h9V16zm-9.75 6H2v-2a6 6 0 0 1 6-6h3.5z"
        ></path>
      </svg>
      <p className="text-2xl font-bold text-gray-600 ">
        Masuk untuk melihat history Splitbill
      </p>
      <Link
        href={'/login'}
        className="flex items-center justify-center rounded-full text-xl bg-green-500 h-14 w-full text-white "
      >
        Masuk
      </Link>
    </section>
  );
};
