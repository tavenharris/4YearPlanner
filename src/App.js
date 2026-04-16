import React, { useEffect, useMemo, useState } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';

import AdvisorRoster from './components/AdvisorRoster';
import RequirementsProgress from './components/RequirementsProgress';
import StudentNotifications from './components/StudentNotifications';
import StudentOnboarding from './components/StudentOnboarding';
import StudentPlanner from './components/StudentPlanner';
import StudentSettings from './components/StudentSettings';
import AdminMajors from './components/AdminMajors';
import { getUserProfile, getAllMajorsOptions } from './services/db';
import { supabase } from './services/supabaseClient';

function AppContent() {
  const location = useLocation();
  const isSetupRoute = location.pathname === '/student-onboarding';
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [majorOptions, setMajorOptions] = useState([]);

  useEffect(() => {
    async function syncUser(session) {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      const options = await getAllMajorsOptions();
      setMajorOptions(options);

      if (!currentUser) {
        setProfile(null);
        setAuthLoaded(true);
        return;
      }

      const userProfile = await getUserProfile(currentUser.id);
      setProfile(userProfile || null);
      setAuthLoaded(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userMetadata = user?.user_metadata || {};
  const displayName = useMemo(() => {
    return (
      profile?.full_name ||
      userMetadata.full_name ||
      userMetadata.name ||
      user?.email ||
      'Student'
    );
  }, [profile?.full_name, user?.email, userMetadata.full_name, userMetadata.name]);

  const avatarUrl = profile?.avatar_url || userMetadata.avatar_url || userMetadata.picture || null;
  const subtitle = useMemo(() => {
    const details = [];
    const majorLabel = majorOptions.find(o => o.value === profile?.major)?.label || profile?.major;

    if (majorLabel) details.push(majorLabel);
    if (profile?.starting_term) details.push(profile.starting_term);

    return details.join(' • ') || 'Student';
  }, [profile?.major, profile?.starting_term, majorOptions]);

  const isAdmin = user?.email === 'tjharris@scu.edu';

  const navLinks = [
    { to: "/student-planner", icon: "calendar_month", label: "Course Plan" },
    { to: "/requirements-progress", icon: "checklist", label: "Requirements" },
    { to: "/settings", icon: "settings", label: "Settings" },
    ...(isAdmin ? [{ to: "/admin-majors", icon: "admin_panel_settings", label: "Admin: Majors" }] : [])
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen flex">
        {/* SideNavBar */}
        {!isSetupRoute && (
          <aside className="hidden md:flex flex-col h-screen w-64 bg-[#faf5ee] dark:bg-stone-900 border-r border-[#d8d0c8]/60 dark:border-stone-800 p-6 space-y-4 fixed left-0 top-0 z-50">
              <div className="mb-8">
                  <span className="text-xl font-['EB_Garamond'] text-[#c2652a]">4 Year Planner</span>
              </div>
              <div className="flex items-center space-x-3 mb-10 p-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest">
                      {avatarUrl ? (
                        <img className="w-full h-full object-cover" alt={`${displayName} profile`} src={avatarUrl} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-stone-600">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                  </div>
                  <div>
                      <p className="text-sm font-bold font-['Manrope'] text-on-surface">{displayName}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{subtitle}</p>
                  </div>
              </div>
              <nav className="flex-1 space-y-1">
                  {navLinks.map((link) => {
                      const isActive = location.pathname === link.to;
                      return isActive ? (
                          <Link key={link.label} className="flex items-center px-4 py-3 bg-[#c2652a]/10 text-[#c2652a] dark:text-orange-300 font-bold border-r-4 border-[#c2652a] transition-all duration-300 ease-in-out font-['Manrope'] text-sm" to={link.to}>
                              <span className="material-symbols-outlined mr-3" style={link.icon === 'checklist' ? { fontVariationSettings: "'FILL' 1" } : {}}>{link.icon}</span>
                              {link.label}
                          </Link>
                      ) : (
                          <Link key={link.label} className="flex items-center px-4 py-3 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-all duration-300 ease-in-out font-['Manrope'] font-medium text-sm" to={link.to}>
                              <span className="material-symbols-outlined mr-3">{link.icon}</span>
                              {link.label}
                          </Link>
                      );
                  })}
              </nav>
              <div className="pt-4 border-t border-[#d8d0c8]/60">
                  <button className="w-full bg-primary text-white py-3 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity mb-4">
                      Schedule Advisor
                  </button>
                  <Link className="flex items-center px-4 py-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-all duration-300 ease-in-out font-['Manrope'] font-medium text-sm" to="/">
                      <span className="material-symbols-outlined mr-3">help_outline</span>
                      Help Center
                  </Link>
              </div>
          </aside>
        )}

        {/* Main Content Canvas */}
        <main className={`flex-1 ${!isSetupRoute ? 'md:ml-64 pb-20 md:pb-0' : ''} bg-background min-h-screen`}>
            <Routes>
                <Route path="/" element={<Navigate to={{ pathname: "/student-onboarding", hash: location.hash, search: location.search }} replace />} />
                <Route path="/advisor-roster" element={<AdvisorRoster />} />
                <Route path="/requirements-progress" element={<RequirementsProgress />} />
                <Route path="/settings" element={<StudentSettings />} />
                <Route path="/student-notifications" element={<StudentNotifications />} />
                <Route path="/student-onboarding" element={<StudentOnboarding />} />
                <Route path="/student-planner" element={<StudentPlanner />} />
                <Route path="/admin-majors" element={!authLoaded ? null : isAdmin ? <AdminMajors /> : <Navigate to="/student-planner" replace />} />
            </Routes>

            {/* Mobile Nav Bar */}
            {!isSetupRoute && (
              <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#faf5ee] border-t border-[#d8d0c8]/60 flex justify-around py-4 px-2 z-50">
                  <Link to="/student-planner" className={`flex flex-col items-center ${location.pathname === '/student-planner' ? 'text-primary font-bold' : 'text-stone-500'}`}>
                      <span className="material-symbols-outlined">calendar_month</span>
                      <span className="text-[10px] mt-1">Plan</span>
                  </Link>
                  <Link to="/requirements-progress" className={`flex flex-col items-center ${location.pathname === '/requirements-progress' ? 'text-primary font-bold' : 'text-stone-500'}`}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
                      <span className="text-[10px] mt-1">Audit</span>
                  </Link>
                  <Link to="/settings" className={`flex flex-col items-center ${location.pathname === '/settings' ? 'text-primary font-bold' : 'text-stone-500'}`}>
                      <span className="material-symbols-outlined">account_circle</span>
                      <span className="text-[10px] mt-1">Profile</span>
                  </Link>
              </nav>
            )}
        </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
      <Analytics />
    </Router>
  );
}

export default App;
