import { redirect } from 'next/navigation';

export default async function ConfirmPage() {
  // Email confirmation page - Supabase handles the verification
  redirect('/auth/login');
}
