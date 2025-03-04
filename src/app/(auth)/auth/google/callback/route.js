import { google } from '@/utils/arctic';
import { prisma } from '@/utils/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function GET(request) {
  const query = request.nextUrl.searchParams;
  const code = query.get('code');

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('codeVerifier')?.value;

  const token = await google.validateAuthorizationCode(code, codeVerifier);
  const accessToken = token.accessToken();

  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await res.json();

  //get data user : email, name
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  //check if user not exist on database, then create new user and set cookies based on new user id
  if (!user) {
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
      },
    });

    const newSession = await prisma.session.create({
      data: {
        userId: newUser.id,
      },
    });

    cookieStore.set('sessionId', newSession.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  } //check if exist on database, create session based on cookies based on user id
  else {
    const newSession = await prisma.session.create({
      data: {
        userId: user.id,
      },
    });
    cookieStore.set('sessionId', newSession.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  redirect('/dashboard');
}
