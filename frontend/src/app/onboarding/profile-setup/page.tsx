'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';

const ProfileSetup = () => {
  const { supabase, session } = useSupabase();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [roleSpecialization, setRoleSpecialization] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setExistingProfile(data);
          // Pre-fill form if profile exists
          setFullName(data.full_name || '');
          setUsername(data.username || '');
          setRoleSpecialization(data.role_specialization || '');
          setLocation(data.location || '');
          setBio(data.bio || '');
        } else if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching profile:', error.message);
        }
        setLoading(false);
      };
      fetchProfile();
    } else {
      router.push('/signin'); // Redirect to sign-in if not authenticated
    }
  }, [session, supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!session) {
      alert('You must be signed in to create a profile.');
      setLoading(false);
      return;
    }

    const profileData = {
      id: session.user.id,
      full_name: fullName,
      username,
      role_specialization: roleSpecialization,
      location,
      bio,
    };

    let error = null;
    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.user.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData);
      error = insertError;
    }

    if (error) {
      console.error('Error saving profile:', error.message);
      alert(`Error saving profile: ${error.message}`);
    } else {
      alert('Profile saved successfully!');
      router.push('/'); // Redirect to home or dashboard after setup
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">{existingProfile ? 'Edit Profile' : 'Setup Your Profile'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Pro tip: X/Twitter username is recommended for discoverability.</p>
          </div>

          <div>
            <label htmlFor="roleSpecialization" className="block text-sm font-medium text-gray-700">Role / Specialization</label>
            <input
              type="text"
              id="roleSpecialization"
              value={roleSpecialization}
              onChange={(e) => setRoleSpecialization(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (existingProfile ? 'Update Profile' : 'Create Profile')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
