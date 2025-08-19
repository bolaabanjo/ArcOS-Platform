'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';

interface PortfolioEditProps {
  params: {
    id: string;
  };
}

interface Skill {
  id: string;
  name: string;
  category?: string;
}

const PortfolioEdit = ({ params }: PortfolioEditProps) => {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const projectId = params.id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedProjectSkills, setSelectedProjectSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/signin');
      return;
    }

    const fetchData = async () => {
      // Fetch all available skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, category');

      if (skillsData) {
        setAllSkills(skillsData);
      } else if (skillsError) {
        console.error('Error fetching skills:', skillsError.message);
      }

      if (projectId !== 'new') {
        setIsEditing(true);
        // Fetch portfolio data
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', session.user.id)
          .single();

        if (portfolioData) {
          setTitle(portfolioData.title || '');
          setDescription(portfolioData.description || '');
          setProjectUrl(portfolioData.project_url || '');
        } else if (portfolioError) {
          console.error('Error fetching portfolio:', portfolioError.message);
          alert(`Error fetching portfolio: ${portfolioError.message}`);
          router.push('/dashboard');
          return; // Stop further execution if portfolio not found or not owned
        }

        // Fetch project skills
        const { data: projectSkillsData, error: projectSkillsError } = await supabase
          .from('project_skills')
          .select('skill_id')
          .eq('portfolio_id', projectId);

        if (projectSkillsData) {
          setSelectedProjectSkills(projectSkillsData.map(s => s.skill_id));
        } else if (projectSkillsError) {
          console.error('Error fetching project skills:', projectSkillsError.message);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [projectId, session, supabase, router]);

  const handleSkillToggle = (skillId: string) => {
    setSelectedProjectSkills(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!session) {
      alert('You must be signed in to manage portfolios.');
      setLoading(false);
      return;
    }

    let currentProjectId = projectId;
    let portfolioError = null;

    // 1. Save/Update Portfolio Data
    const portfolioData = {
      title,
      description,
      project_url: projectUrl,
      user_id: session.user.id,
    };

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('portfolios')
        .update(portfolioData)
        .eq('id', projectId);
      portfolioError = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('portfolios')
        .insert(portfolioData)
        .select();

      portfolioError = insertError;
      if (data && data.length > 0) {
        currentProjectId = data[0].id; // Get the ID of the newly created portfolio
      }
    }

    if (portfolioError) {
      console.error('Error saving portfolio:', portfolioError.message);
      alert(`Error saving portfolio: ${portfolioError.message}`);
      setLoading(false);
      return;
    }

    // 2. Save/Update Project Skills
    if (currentProjectId) {
      // Delete existing skills for this project
      const { error: deleteSkillsError } = await supabase
        .from('project_skills')
        .delete()
        .eq('portfolio_id', currentProjectId);

      if (deleteSkillsError) {
        console.error('Error deleting old project skills:', deleteSkillsError.message);
        alert(`Error updating project skills: ${deleteSkillsError.message}`);
        setLoading(false);
        return;
      }

      // Insert new selected skills
      if (selectedProjectSkills.length > 0) {
        const newProjectSkills = selectedProjectSkills.map(skillId => ({
          portfolio_id: currentProjectId,
          skill_id: skillId,
        }));

        const { error: insertSkillsError } = await supabase
          .from('project_skills')
          .insert(newProjectSkills);

        if (insertSkillsError) {
          console.error('Error inserting new project skills:', insertSkillsError.message);
          alert(`Error saving project skills: ${insertSkillsError.message}`);
          setLoading(false);
          return;
        }
      }
    }

    alert('Portfolio saved successfully!');
    router.push('/dashboard'); // Redirect to dashboard after saving
    setLoading(false);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">{isEditing ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Project Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            ></textarea>
          </div>

          <div>
            <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-700">Project URL (Optional)</label>
            <input
              type="url"
              id="projectUrl"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., https://your-project.com"
            />
          </div>

          {/* Skills Section for Project */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Skills Used in this Project</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSkills.map(skill => (
                <div key={skill.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`project-skill-${skill.id}`}
                    checked={selectedProjectSkills.includes(skill.id)}
                    onChange={() => handleSkillToggle(skill.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`project-skill-${skill.id}`} className="ml-2 text-sm font-medium text-gray-700">{skill.name}</label>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PortfolioEdit;
