'use server';

import { auth } from '@/libs/auth';
import { prisma } from '@/utils/prisma';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  await prisma.session.deleteMany({
    where: {
      userId: session.userId,
    },
  });
  redirect('/login');
}
