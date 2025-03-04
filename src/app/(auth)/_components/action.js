'use server';
import { google } from '@/utils/arctic';
import * as arctic from 'arctic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function continueWithGoogleAction() {
  const cookieStore = await cookies();
  const state = arctic.generateState();
  const codeVerifier = arctic.generateCodeVerifier();
  const scopes = ['openid', 'profile', 'email'];
  cookieStore.set('codeVerifier', codeVerifier, { httpOnly: true });
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);
  redirect(url);
}
