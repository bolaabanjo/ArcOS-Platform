import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to ArcOS</h1>
      <div className="flex space-x-4">
        <Link href="/signin" className="rounded-md bg-blue-500 px-6 py-3 text-white shadow-md hover:bg-blue-600">
          Sign In
        </Link>
        <Link href="/signup" className="rounded-md bg-green-500 px-6 py-3 text-white shadow-md hover:bg-green-600">
          Sign Up
        </Link>
      </div>
    </main>
  );
}
