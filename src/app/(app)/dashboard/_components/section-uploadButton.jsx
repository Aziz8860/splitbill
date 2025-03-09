import Link from 'next/link';

export const SectionUploadButton = () => {
  return (
    <section className="h-[50px]">
      <Link
        href="/upload"
        className="flex items-center justify-center rounded-full h-12 text-lg font-bold bg-indigo-500 text-white  hover:bg-green-500 animate-pulse"
      >
        <p>Ayo Mulai !</p>
      </Link>
    </section>
  );
};
