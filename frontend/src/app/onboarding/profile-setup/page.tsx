'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';

interface Profile {
  id: string;
  full_name: string;
  username: string;
  role_specialization: string;
  location: string;
  bio: string;
}

interface Skill {
  id: string;
  name: string;
  category?: string;
}

interface ProfileSkill {
  skill_id: string;
  proficiency_level: string;
  is_primary: boolean;
}

const ProfileSetup = () => {
  const { supabase, session } = useSupabase();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [roleSpecialization, setRoleSpecialization] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<{
    skill_id: string;
    proficiency_level: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (session) {
      const fetchData = async () => {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setExistingProfile(profileData);
          setFullName(profileData.full_name || '');
          setUsername(profileData.username || '');
          setRoleSpecialization(profileData.role_specialization || '');
          setLocation(profileData.location || '');
          setBio(profileData.bio || '');
        } else if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError.message);
        }

        // Fetch all available skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('id, name, category');

        if (skillsData) {
          setAllSkills(skillsData);
        } else if (skillsError) {
          console.error('Error fetching skills:', skillsError.message);
        }

        // Fetch user's existing skills
        const { data: profileSkillsData, error: profileSkillsError } = await supabase
          .from('profile_skills')
          .select('skill_id, proficiency_level')
          .eq('profile_id', session.user.id);

        if (profileSkillsData) {
          setSelectedSkills(profileSkillsData);
        } else if (profileSkillsError) {
          console.error('Error fetching profile skills:', profileSkillsError.message);
        }
        setLoading(false);
      };
      fetchData();
    } else {
      router.push('/signin');
    }
  }, [session, supabase, router]);

  const handleSkillChange = (skillId: string, level: string) => {
    setSelectedSkills(prev => {
      const existingIndex = prev.findIndex(s => s.skill_id === skillId);
      if (existingIndex > -1) {
        const newSkills = [...prev];
        if (level === '') { // Remove skill if proficiency is empty
          newSkills.splice(existingIndex, 1);
        } else {
          newSkills[existingIndex] = { ...newSkills[existingIndex], proficiency_level: level };
        }
        return newSkills;
      } else if (level !== '') {
        return [...prev, { skill_id: skillId, proficiency_level: level }];
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!session) {
      alert('You must be signed in to create a profile.');
      setLoading(false);
      return;
    }

    // 1. Save/Update Profile Data
    const profileData = {
      id: session.user.id,
      full_name: fullName,
      username,
      role_specialization: roleSpecialization,
      location,
      bio,
    };

    let profileError = null;
    if (existingProfile) {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.user.id);
      profileError = error;
    } else {
      const { error } = await supabase
        .from('profiles')
        .insert(profileData);
      profileError = error;
    }

    if (profileError) {
      console.error('Error saving profile:', profileError.message);
      alert(`Error saving profile: ${profileError.message}`);
      setLoading(false);
      return;
    }

    // 2. Save/Update Profile Skills
    const newProfileSkills = selectedSkills.map(skill => ({
      profile_id: session.user.id,
      skill_id: skill.skill_id,
      proficiency_level: skill.proficiency_level,
    }));

    // First, delete existing skills for this profile to handle removals
    const { error: deleteSkillsError } = await supabase
      .from('profile_skills')
      .delete()
      .eq('profile_id', session.user.id);

    if (deleteSkillsError) {
      console.error('Error deleting old profile skills:', deleteSkillsError.message);
      alert(`Error updating skills: ${deleteSkillsError.message}`);
      setLoading(false);
      return;
    }

    // Then, insert the new set of skills
    if (newProfileSkills.length > 0) {
      const { error: insertSkillsError } = await supabase
        .from('profile_skills')
        .insert(newProfileSkills);

      if (insertSkillsError) {
        console.error('Error inserting new profile skills:', insertSkillsError.message);
        alert(`Error saving skills: ${insertSkillsError.message}`);
        setLoading(false);
        return;
      }
    }

    alert('Profile and skills saved successfully!');
    router.push('/dashboard');
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

          {/* Skills Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Your Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allSkills.map(skill => (
                <div key={skill.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`skill-${skill.id}`}
                    checked={selectedSkills.some(s => s.skill_id === skill.id)}
                    onChange={(e) => handleSkillChange(skill.id, e.target.checked ? 'Beginner' : '')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`skill-${skill.id}`} className="text-sm font-medium text-gray-700">{skill.name}</label>
                  {selectedSkills.some(s => s.skill_id === skill.id) && (
                    <select
                      value={selectedSkills.find(s => s.skill_id === skill.id)?.proficiency_level || ''}
                      onChange={(e) => handleSkillChange(skill.id, e.target.value)}
                      className="ml-auto block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Select Proficiency</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
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
