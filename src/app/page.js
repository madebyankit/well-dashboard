import { redirect } from 'next/navigation';

/** The dashboard is the application's home. */
export default function Home() {
  redirect('/dashboard');
}
