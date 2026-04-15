import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, saveUserProfile } from '../../services/db';
import { supabase } from '../../services/supabaseClient';

const MAJOR_OPTIONS = [
  { value: 'CSCI', label: 'Computer Science' },
  { value: 'MATH', label: 'Mathematics' },
  { value: 'PHYS', label: 'Physics' },
  { value: 'ARCH', label: 'Architecture' },
];

const MINOR_OPTIONS = ['None', 'Math', 'Philosophy', 'Business'];
const TERM_OPTIONS = [
  { value: 'Fall 2024', icon: 'energy_savings_leaf' },
  { value: 'Spring 2025', icon: 'ac_unit' },
];

function StudentSettings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    major: 'CSCI',
    minor: 'None',
    starting_term: 'Fall 2024',
    avatar_url: '',
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/student-onboarding');
        return;
      }

      const profile = await getUserProfile(session.user.id);
      const userMetadata = session.user.user_metadata || {};

      setUserId(session.user.id);
      setForm({
        full_name: profile?.full_name || userMetadata.full_name || userMetadata.name || '',
        major: profile?.major || 'CSCI',
        minor: profile?.minor || 'None',
        starting_term: profile?.starting_term || 'Fall 2024',
        avatar_url: profile?.avatar_url || userMetadata.avatar_url || userMetadata.picture || '',
      });
      setLoading(false);
    }

    loadProfile();
  }, [navigate]);

  const initials = useMemo(() => {
    const trimmed = form.full_name.trim();

    if (!trimmed) return 'S';

    return trimmed
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }, [form.full_name]);

  const handleChange = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
  };

  const handleTermChange = (term) => {
    setForm((currentForm) => ({
      ...currentForm,
      starting_term: term,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const trimmedName = form.full_name.trim();
    const profilePayload = {
      full_name: trimmedName,
      major: form.major,
      minor: form.minor,
      starting_term: form.starting_term,
      avatar_url: form.avatar_url || null,
    };

    const savedProfile = await saveUserProfile(userId, profilePayload);

    if (!savedProfile) {
      setError('We could not save your settings. Please try again.');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
      },
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setMessage('Settings saved.');
    setSaving(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setError('');

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setLoggingOut(false);
      return;
    }

    navigate('/student-onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-12 md:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse rounded-[28px] border border-[#d8d0c8]/60 bg-[#fffaf4] p-8 shadow-[0_2px_16px_rgba(58,48,42,0.04)]">
            <div className="mb-8 h-8 w-56 rounded bg-[#eadfce]" />
            <div className="space-y-4">
              <div className="h-16 rounded-xl bg-[#f2e7d8]" />
              <div className="h-16 rounded-xl bg-[#f2e7d8]" />
              <div className="h-16 rounded-xl bg-[#f2e7d8]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-[#d8d0c8]/60 bg-[#fffaf4] p-8 shadow-[0_2px_16px_rgba(58,48,42,0.04)] md:p-10">
          <div className="mb-10">
            <p className="mb-3 font-['Manrope'] text-xs font-bold uppercase tracking-[0.28em] text-[#8c3c3c]">
              Account Settings
            </p>
            <h1 className="font-['EB_Garamond'] text-5xl leading-tight text-on-surface">
              Fine-tune your academic profile.
            </h1>
            <p className="mt-4 max-w-2xl font-['Manrope'] text-base text-stone-600">
              Update the details that shape your planner, then save them without leaving your workspace.
            </p>
          </div>

          <form className="space-y-10" onSubmit={handleSave}>
            <div className="grid gap-6 md:grid-cols-[120px_1fr] md:items-center">
              <div className="flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full border border-[#d8d0c8]/60 bg-[#f3e7d8] text-3xl font-bold text-[#7a4a2a]">
                {form.avatar_url ? (
                  <img alt={`${form.full_name || 'Student'} profile`} className="h-full w-full object-cover" src={form.avatar_url} />
                ) : (
                  initials
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 ml-1 block font-['Manrope'] text-sm font-bold text-[#504840]">
                    Full Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#d8d0c8] bg-white px-4 py-4 font-['Manrope'] text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={handleChange('full_name')}
                    placeholder="Your name"
                    value={form.full_name}
                  />
                </div>
                <div>
                  <label className="mb-2 ml-1 block font-['Manrope'] text-sm font-bold text-[#504840]">
                    Avatar URL
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#d8d0c8] bg-white px-4 py-4 font-['Manrope'] text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={handleChange('avatar_url')}
                    placeholder="https://..."
                    value={form.avatar_url}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="ml-1 block font-['Manrope'] text-sm font-bold text-[#504840]">
                  Major
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-[#d8d0c8] bg-white px-4 py-4 font-['Manrope'] text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={handleChange('major')}
                    value={form.major}
                  >
                    {MAJOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 block font-['Manrope'] text-sm font-bold text-[#504840]">
                  Minor
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-xl border border-[#d8d0c8] bg-white px-4 py-4 font-['Manrope'] text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={handleChange('minor')}
                    value={form.minor}
                  >
                    {MINOR_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-['EB_Garamond'] text-3xl text-on-surface">Starting Term</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {TERM_OPTIONS.map((option) => {
                  const isSelected = form.starting_term === option.value;

                  return (
                    <button
                      key={option.value}
                      className={`rounded-2xl border px-6 py-6 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-md'
                          : 'border-[#d8d0c8] bg-white text-stone-700 hover:border-primary/40'
                      }`}
                      onClick={() => handleTermChange(option.value)}
                      type="button"
                    >
                      <span className="material-symbols-outlined mb-3 block">{option.icon}</span>
                      <span className="font-['Manrope'] text-sm font-bold uppercase tracking-[0.18em]">
                        Entry Window
                      </span>
                      <span className="mt-2 block font-['EB_Garamond'] text-2xl">{option.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {(message || error) && (
              <div className={`rounded-2xl border px-4 py-3 font-['Manrope'] text-sm ${
                error
                  ? 'border-[#d18b8b] bg-[#fff1f1] text-[#8c3c3c]'
                  : 'border-[#d5c4a7] bg-[#fff7eb] text-[#7a4a2a]'
              }`}>
                {error || message}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                className="rounded-xl bg-primary px-6 py-4 font-['Manrope'] text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="rounded-xl border border-[#d8d0c8] px-6 py-4 font-['Manrope'] text-sm font-bold text-stone-700 transition-colors hover:bg-[#f6ede2] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loggingOut}
                onClick={handleLogout}
                type="button"
              >
                {loggingOut ? 'Signing Out...' : 'Log Out'}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-[#d8d0c8]/60 bg-[#f6ede2] p-8 shadow-[0_2px_16px_rgba(58,48,42,0.04)]">
            <p className="mb-3 font-['Manrope'] text-xs font-bold uppercase tracking-[0.28em] text-[#8c3c3c]">
              Planner Identity
            </p>
            <h2 className="font-['EB_Garamond'] text-4xl leading-tight text-on-surface">
              The details here shape your recommendations.
            </h2>
            <p className="mt-4 font-['Manrope'] text-sm leading-7 text-stone-600">
              Your major, minor, and start term drive which requirements and planning views appear across the app.
            </p>
          </section>

          <section className="rounded-[28px] border border-[#d8d0c8]/60 bg-white/70 p-8 shadow-[0_2px_16px_rgba(58,48,42,0.04)]">
            <p className="mb-4 font-['Manrope'] text-xs font-bold uppercase tracking-[0.28em] text-[#8c3c3c]">
              Current Snapshot
            </p>
            <div className="space-y-5 font-['Manrope'] text-sm text-stone-700">
              <div className="flex items-start justify-between gap-4 border-b border-[#d8d0c8]/60 pb-4">
                <span className="text-stone-500">Full Name</span>
                <span className="text-right font-semibold text-on-surface">{form.full_name || 'Not set'}</span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-[#d8d0c8]/60 pb-4">
                <span className="text-stone-500">Major</span>
                <span className="text-right font-semibold text-on-surface">
                  {MAJOR_OPTIONS.find((option) => option.value === form.major)?.label || form.major}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-[#d8d0c8]/60 pb-4">
                <span className="text-stone-500">Minor</span>
                <span className="text-right font-semibold text-on-surface">{form.minor}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-stone-500">Starting Term</span>
                <span className="text-right font-semibold text-on-surface">{form.starting_term}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default StudentSettings;
