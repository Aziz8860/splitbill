import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';

export async function auth() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          receipts: true,
          people: true,
          //role:true jika jadi menggunakan admin
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  return session;
}
