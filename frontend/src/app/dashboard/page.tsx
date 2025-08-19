'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import Link from 'next/link';

interface Profile {
  full_name: string;
  username: string;
  role_specialization: string;
  location: string;
  bio: string;
  email?: string; // Optional, as it might be handled by auth.users
}

interface Portfolio {
  id: string;
  title: string;
  description: string;
  project_url?: string;
}

export default function Dashboard() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/signin');
      return;
    }

    const fetchData = async () => {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else if (profileError && profileError.code === 'PGRST116') { // No rows found
        alert('Please complete your profile setup.');
        router.push('/onboarding/profile-setup');
        return;
      } else if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        alert(`Error fetching profile: ${profileError.message}`);
        setLoading(false); // Stop loading even on error
        return;
      }

      // Fetch Portfolios
      const { data: portfoliosData, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('id, title, description, project_url')
        .eq('user_id', session.user.id);

      if (portfoliosData) {
        setPortfolios(portfoliosData);
      } else if (portfoliosError) {
        console.error('Error fetching portfolios:', portfoliosError.message);
        alert(`Error fetching portfolios: ${portfoliosError.message}`);
      }
      setLoading(false);
    };

    fetchData();
  }, [session, supabase, router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      alert(`Error signing out: ${error.message}`);
    } else {
      router.push('/signin');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100">Loading dashboard...</div>;
  }

  if (!profile) {
    return null; // Should ideally not happen if profile setup redirect works
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Welcome, {profile.full_name || profile.username}!</h1>
          <button
            onClick={handleSignOut}
            className="rounded-md bg-red-500 px-6 py-2 text-white shadow-md hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>

        <div className="mb-8 border-b pb-6">
          <h2 className="mb-4 text-2xl font-semibold">Your Profile</h2>
          <p className="mb-2"><strong className="font-medium">Username:</strong> {profile.username}</p>
          <p className="mb-2"><strong className="font-medium">Role:</strong> {profile.role_specialization}</p>
          <p className="mb-2"><strong className="font-medium">Location:</strong> {profile.location}</p>
          <p className="mb-4"><strong className="font-medium">Bio:</strong> {profile.bio}</p>
          <Link href="/onboarding/profile-setup" className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">
            Edit Profile
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Your Portfolios</h2>
          {portfolios.length === 0 ? (
            <p className="text-gray-600 mb-4">No portfolios added yet. Start by creating your first project!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((p) => (
                <div key={p.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="mb-2 text-lg font-semibold">{p.title}</h3>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">{p.description}</p>
                  {p.project_url && (
                    <a href={p.project_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm block mb-3">
                      View Project
                    </a>
                  )}
                  <Link href={`/portfolio/edit/${p.id}`} className="rounded-md bg-indigo-500 px-3 py-1 text-xs text-white hover:bg-indigo-600">
                    Edit Project
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Link href="/portfolio/edit/new" className="rounded-md bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600">
              Add New Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
