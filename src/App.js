import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';

import AdvisorPlanReview from './components/AdvisorPlanReview';
import AdvisorRoster from './components/AdvisorRoster';
import RequirementsProgress from './components/RequirementsProgress';
import StudentNotifications from './components/StudentNotifications';
import StudentOnboarding from './components/StudentOnboarding';
import StudentPlanner from './components/StudentPlanner';

function AppContent() {
  const location = useLocation();

  const navLinks = [
    { to: "/student-planner", icon: "dashboard", label: "Dashboard" },
    { to: "/student-planner", icon: "calendar_month", label: "Course Plan" },
    { to: "/advisor-plan-review", icon: "rate_review", label: "Advisor Reviews" },
    { to: "/requirements-progress", icon: "checklist", label: "Requirements" },
    { to: "/", icon: "settings", label: "Settings" }
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen flex">
        {/* SideNavBar */}
        <aside className="hidden md:flex flex-col h-screen w-64 bg-[#faf5ee] dark:bg-stone-900 border-r border-[#d8d0c8]/60 dark:border-stone-800 p-6 space-y-4 fixed left-0 top-0 z-50">
            <div className="mb-8">
                <span className="text-xl font-['EB_Garamond'] text-[#c2652a]">Sahara Academic</span>
            </div>
            <div className="flex items-center space-x-3 mb-10 p-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest">
                    <img className="w-full h-full object-cover" alt="Portrait of Julianne Smith" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnsR9P51fkx1BiWzVZIn-qP-Wt51x-QKbs-buV6GKrTejO3SdD8l_t-88Be9_GyVOci-sCCYNVe32zUy-0fUA8unsgplasdnE7JarJIHRO0v5WTvJEq0rx-IzQXhds_XpHmHi-KrrYqd0OlTpsw-O28k5mmSv3nr5K7vFLIt5tt9_rnE1OWlYkgHEzzyfDrEqevPq7BFjNq1JdkvJh1l796sLdqNi5K-RBXs1GvJF21h3EQuoS3O50CmOCeTCkRM8tn7sGPUxEBBSo"/>
                </div>
                <div>
                    <p className="text-sm font-bold font-['Manrope'] text-on-surface">Julianne Smith</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Computer Science, Junior</p>
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

        {/* Main Content Canvas */}
        <main className="flex-1 md:ml-64 bg-background min-h-screen pb-20 md:pb-0">
            <Routes>
                <Route path="/" element={<Navigate to="/requirements-progress" />} />
                <Route path="/advisor-plan-review" element={<AdvisorPlanReview />} />
                <Route path="/advisor-roster" element={<AdvisorRoster />} />
                <Route path="/requirements-progress" element={<RequirementsProgress />} />
                <Route path="/student-notifications" element={<StudentNotifications />} />
                <Route path="/student-onboarding" element={<StudentOnboarding />} />
                <Route path="/student-planner" element={<StudentPlanner />} />
            </Routes>

            {/* Mobile Nav Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#faf5ee] border-t border-[#d8d0c8]/60 flex justify-around py-4 px-2 z-50">
                <Link to="/student-planner" className={`flex flex-col items-center ${location.pathname === '/student-planner' ? 'text-primary font-bold' : 'text-stone-500'}`}>
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-[10px] mt-1">Home</span>
                </Link>
                <Link to="/student-planner" className={`flex flex-col items-center ${location.pathname === '/student-planner' ? 'text-primary font-bold' : 'text-stone-500'}`}>
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="text-[10px] mt-1">Plan</span>
                </Link>
                <Link to="/requirements-progress" className={`flex flex-col items-center ${location.pathname === '/requirements-progress' ? 'text-primary font-bold' : 'text-stone-500'}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
                    <span className="text-[10px] mt-1">Audit</span>
                </Link>
                <Link to="/" className="flex flex-col items-center text-stone-500">
                    <span className="material-symbols-outlined">account_circle</span>
                    <span className="text-[10px] mt-1">Profile</span>
                </Link>
            </nav>
        </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
