import Link from 'next/link';

export const SectionUploadButton = () => {
  return (
    <section className="h-[50px]">
      <Link
        href="/upload"
        className="flex items-center justify-center rounded-full h-12 text-lg font-bold bg-primary text-white hover:bg-primary-600 transition-colors duration-300 animate-pulse"
      >
        <p>Ayo Mulai !</p>
      </Link>
    </section>
  );
};
