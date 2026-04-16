import React, { useState, useEffect } from 'react';
import { searchCourses, getCourseData, getMajorRequirements, getUserProfile, getUserCourses, saveUserCourse, updateUserCourse, deleteUserCourse } from '../../services/db';
import { supabase } from '../../services/supabaseClient';

const YEARS = [
  { id: 1, title: 'Year 1: Freshman' },
  { id: 2, title: 'Year 2: Sophomore' },
  { id: 3, title: 'Year 3: Junior' },
  { id: 4, title: 'Year 4: Senior' },
];
const TERMS = ['Fall', 'Winter', 'Spring', 'Summer'];
const COURSE_STATUSES = [
  { id: 'planned', label: 'Planned', icon: 'calendar_today', accent: 'border-l-primary', iconClass: 'text-primary' },
  { id: 'in_progress', label: 'In Progress', icon: 'timelapse', accent: 'border-l-amber-500', iconClass: 'text-amber-500' },
  { id: 'completed', label: 'Completed', icon: 'check_circle', accent: 'border-l-green-500', iconClass: 'text-green-500', filled: true },
];

function StudentPlanner() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userCourses, setUserCourses] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [majorRequirements, setMajorRequirements] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'requirements'

  const startingYearMatch = profile?.starting_term?.match(/\d{4}/);
  const startYear = startingYearMatch ? parseInt(startingYearMatch[0], 10) : 2024;
  const classYear = startYear + 4;

  const handleAddCourse = async (year, term) => {
    if (!user || !selectedCourse) return;
    
    // Check if course is already in this term
    const exists = userCourses.find(c => c.course_id === selectedCourse && c.year === year && c.term === term);
    if (exists) return;

    const newCourse = {
      user_id: user.id,
      course_id: selectedCourse,
      year,
      term,
      status: 'planned',
      credits: 5 // Defaulting to 5 for now
    };
    
    const saved = await saveUserCourse(newCourse);
    if (saved && saved.length > 0) {
      setUserCourses(prev => [...prev, saved[0]]);
    }
  };

  const handleRemoveCourse = async (courseRecordId) => {
    await deleteUserCourse(courseRecordId);
    setUserCourses(prev => prev.filter(c => c.id !== courseRecordId));
  };

  const handleUpdateCourseStatus = async (courseRecordId, status) => {
    const updated = await updateUserCourse(courseRecordId, { status });
    if (updated && updated.length > 0) {
      setUserCourses(prev =>
        prev.map(course => (course.id === courseRecordId ? updated[0] : course))
      );
    }
  };

  // Fetch User and Profile Data
  useEffect(() => {
    async function loadUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch custom user profile (e.g., major, name)
        const userProfile = await getUserProfile(session.user.id);
        if (userProfile) {
          setProfile(userProfile);
          // Fetch major requirements based on user's selected major
          const data = await getMajorRequirements(userProfile.major || 'CSCI');
          setMajorRequirements(data);
        } else {
          // Fallback if no profile
          const data = await getMajorRequirements('CSCI');
          setMajorRequirements(data);
        }

        // Fetch their saved 4-year plan courses
        const courses = await getUserCourses(session.user.id);
        if (courses) setUserCourses(courses);
      } else {
        // Fallback for non-logged in users
        const data = await getMajorRequirements('CSCI');
        setMajorRequirements(data);
      }
    }
    loadUserData();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setLoading(true);
        const results = await searchCourses(searchQuery);
        setSearchResults(results || []);
        setLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load selected course data
  useEffect(() => {
    async function loadData() {
      if (selectedCourse) {
        const data = await getCourseData(selectedCourse);
        setCourseData(data);
      } else {
        setCourseData(null);
      }
    }
    loadData();
  }, [selectedCourse]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Planner Canvas */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left Side: 4-Year Grid */}
            <section className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-4xl font-headline text-on-background mb-2">Degree Roadmap {profile?.full_name ? `for ${profile.full_name}` : ''}</h1>
                            <p className="text-stone-500 font-body">{profile?.major || (majorRequirements ? majorRequirements.name : 'Computer Science B.S.')} • Class of {classYear}</p>
                        </div>
                        <div className="flex space-x-4">
                            <div className="bg-surface-container-high px-4 py-2 rounded-lg text-xs font-bold text-on-surface flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> 
                                {userCourses.reduce((sum, c) => sum + (c.credits || 0), 0)} / 180 Units
                            </div>
                            <button className="p-2 bg-surface-container-high rounded-lg text-stone-600 hover:bg-stone-200 transition-colors">
                                <span className="material-symbols-outlined">download</span>
                            </button>
                        </div>
                    </div>

                    {/* Year Grid (Dynamic Content) */}
                    <div className="space-y-12">
                        {YEARS.map((yearObj) => (
                            <div key={yearObj.id}>
                                <h2 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant/30 flex justify-between items-center">
                                    {yearObj.title}
                                    <span className="text-sm font-normal text-stone-400">
                                        {startYear + yearObj.id - 1} - {startYear + yearObj.id}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {TERMS.map((term) => {
                                        const termCourses = userCourses.filter(
                                            (c) => c.year === yearObj.id && c.term === term
                                        );
                                        const totalUnits = termCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

                                        return (
                                            <div key={term} className="space-y-4">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                                                        {term}
                                                    </span>
                                                    <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                                                        {totalUnits} Units
                                                    </span>
                                                </div>

                                                {termCourses.map((course) => (
                                                    <div
                                                        key={course.id}
                                                        className={`bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 shadow-sm space-y-3 border-l-4 ${
                                                            COURSE_STATUSES.find(status => status.id === course.status)?.accent || 'border-l-primary'
                                                        } group relative`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-bold">{course.course_id}</span>
                                                            <div className="flex items-center gap-1">
                                                                {(() => {
                                                                    const statusConfig = COURSE_STATUSES.find(status => status.id === course.status) || COURSE_STATUSES[0];
                                                                    return (
                                                                        <span
                                                                            className={`material-symbols-outlined text-sm ${statusConfig.iconClass}`}
                                                                            style={statusConfig.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
                                                                            title={statusConfig.label}
                                                                        >
                                                                            {statusConfig.icon}
                                                                        </span>
                                                                    );
                                                                })()}
                                                                <button 
                                                                    onClick={() => handleRemoveCourse(course.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-error hover:text-red-700 transition-opacity"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {COURSE_STATUSES.map((status) => (
                                                                <button
                                                                    key={status.id}
                                                                    onClick={() => handleUpdateCourseStatus(course.id, status.id)}
                                                                    className={`px-2 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                                                                        course.status === status.id
                                                                            ? 'border-current bg-white text-stone-900'
                                                                            : 'border-outline-variant/50 text-stone-500 hover:text-stone-700 hover:border-stone-300'
                                                                    }`}
                                                                >
                                                                    {status.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-[11px] text-stone-400">{course.credits} Units</p>
                                                    </div>
                                                ))}

                                                {/* Add Course Slot */}
                                                <button 
                                                    onClick={() => handleAddCourse(yearObj.id, term)}
                                                    disabled={!selectedCourse}
                                                    className={`w-full border-2 border-dashed rounded-xl h-24 flex flex-col items-center justify-center transition-all ${selectedCourse ? 'border-primary/40 text-primary hover:bg-primary/5 cursor-pointer' : 'border-outline-variant/20 text-stone-300 cursor-default'}`}
                                                >
                                                    <span className="material-symbols-outlined text-lg mb-1">{selectedCourse ? 'add_circle' : 'add'}</span>
                                                    <span className="text-[10px] font-bold">
                                                        {selectedCourse ? `ADD ${selectedCourse}` : 'SELECT COURSE'}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Right Side: Course Search Panel */}
            <aside className="w-80 bg-surface-container border-l border-outline-variant/60 p-6 overflow-y-auto hidden xl:flex xl:flex-col">
                <div className="sticky top-0 bg-surface-container pb-4 z-10 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-headline font-semibold text-on-surface">Planner Tools</h3>
                    </div>
                    <div className="flex rounded-lg bg-surface-container-low p-1 border border-outline-variant/40">
                        <button 
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'search' ? 'bg-white shadow-sm text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                            onClick={() => setActiveTab('search')}
                        >
                            Search
                        </button>
                        <button 
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'requirements' ? 'bg-white shadow-sm text-primary' : 'text-stone-500 hover:text-stone-700'}`}
                            onClick={() => setActiveTab('requirements')}
                        >
                            Requirements
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {activeTab === 'search' ? (
                        <div className="space-y-6">
                            <div className="relative mb-2">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                                <input 
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/60 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all" 
                                    placeholder="Search by ID (e.g. CS106B)..." 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
                                    {searchQuery ? (loading ? 'Searching...' : 'Search Results') : 'Popular This Quarter'}
                                </p>
                                <div className="space-y-3">
                                    {searchQuery && searchResults.length === 0 && !loading && (
                                        <p className="text-xs text-stone-500">No courses found matching "{searchQuery}"</p>
                                    )}
                                    
                                    {searchResults.length > 0 ? (
                                        searchResults.map(course => (
                                            <div 
                                                key={course.id}
                                                onClick={() => setSelectedCourse(course.id)}
                                                className={`bg-white p-4 rounded-xl shadow-sm border cursor-pointer group transition-all ${selectedCourse === course.id ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:border-primary/50'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-primary">{course.id}</span>
                                                    <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors">add_circle</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (!searchQuery && (
                                        <>
                                            {/* Default Static Popular Courses */}
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:border-primary/50 cursor-pointer group transition-all" onClick={() => setSelectedCourse('CS221')}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-primary">CS 221</span>
                                                    <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors">add_circle</span>
                                                </div>
                                                <p className="text-xs font-semibold text-on-surface">Artificial Intelligence</p>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-[10px] text-stone-500">4 Units • Autumn</span>
                                                    <span className="px-2 py-0.5 bg-surface-container rounded text-[9px] font-bold text-stone-600">Core</span>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:border-primary/50 cursor-pointer group transition-all" onClick={() => setSelectedCourse('CS145')}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-primary">CS 145</span>
                                                    <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors">add_circle</span>
                                                </div>
                                                <p className="text-xs font-semibold text-on-surface">Data Management</p>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-[10px] text-stone-500">4 Units • All terms</span>
                                                    <span className="px-2 py-0.5 bg-surface-container rounded text-[9px] font-bold text-stone-600">Elective</span>
                                                </div>
                                            </div>
                                        </>
                                    ))}
                                </div>
                            </div>

                            {/* Show stats if a course is selected and data is loaded */}
                            {selectedCourse && courseData && (
                                <div className="bg-white rounded-2xl p-5 border border-primary/20 shadow-md animate-fade-in">
                                    <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-md">analytics</span> {selectedCourse} Stats
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] uppercase text-stone-400 font-bold mb-1">Difficulty</p>
                                            <div className="w-full bg-stone-100 rounded-full h-2">
                                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(courseData.difficultyTotal / courseData.difficultyCount) / 5 * 100}%` }}></div>
                                            </div>
                                            <p className="text-xs text-stone-600 mt-1">{(courseData.difficultyTotal / courseData.difficultyCount).toFixed(2)} / 5.0</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-stone-400 font-bold mb-1">Workload</p>
                                            <div className="w-full bg-stone-100 rounded-full h-2">
                                                <div className="bg-red-400 h-2 rounded-full" style={{ width: `${Math.min(courseData.workloadTotal / courseData.workloadCount / 20 * 100, 100)}%` }}></div>
                                            </div>
                                            <p className="text-xs text-stone-600 mt-1">{(courseData.workloadTotal / courseData.workloadCount).toFixed(1)} hrs/wk</p>
                                        </div>
                                        {courseData.recentTerms && courseData.recentTerms.length > 0 && (
                                            <div>
                                                <p className="text-[10px] uppercase text-stone-400 font-bold mb-1">Recent Terms</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {courseData.recentTerms.slice(0, 3).map(term => (
                                                        <span key={term} className="text-[9px] bg-stone-100 text-stone-600 px-2 py-1 rounded">{term}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {!selectedCourse && (
                                <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                                    <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span> Smart Recommendations
                                    </h4>
                                    <p className="text-[11px] text-stone-600 leading-relaxed mb-4">Based on your Senior-year goals, you should complete <strong>CS 107E</strong> before next Autumn.</p>
                                    <button className="w-full py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-opacity">
                                        Find CS 107E Sections
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {majorRequirements ? (
                                <>
                                    <div>
                                        <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[18px]">menu_book</span> Major Requirements
                                        </h4>
                                        <div className="space-y-2">
                                            {majorRequirements.requirements.major_requirements.map((req, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => req.type === 'course' && setSelectedCourse(req.course_id)}
                                                    className={`bg-white p-3 rounded-lg shadow-sm border flex items-start gap-3 cursor-pointer transition-colors ${selectedCourse === req.course_id ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:border-primary/40'}`}
                                                >
                                                    <div className="mt-0.5 text-stone-300">
                                                        <span className="material-symbols-outlined text-sm">drag_indicator</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-stone-800">
                                                            {req.type === 'course' ? req.course_id : req.name}
                                                        </p>
                                                        <p className="text-[10px] text-stone-500 mt-0.5">
                                                            {req.type === 'course' ? req.name : req.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2 mt-6">
                                            <span className="material-symbols-outlined text-primary text-[18px]">public</span> Core Requirements
                                        </h4>
                                        <div className="space-y-2">
                                            {majorRequirements.requirements.core_requirements.map((req, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => req.type === 'course' && setSelectedCourse(req.course_id)}
                                                    className={`bg-white p-3 rounded-lg shadow-sm border flex items-start gap-3 cursor-pointer transition-colors ${selectedCourse === req.course_id ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:border-primary/40'}`}
                                                >
                                                    <div className="mt-0.5 text-stone-300">
                                                        <span className="material-symbols-outlined text-sm">drag_indicator</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-stone-800">{req.name}</p>
                                                        <p className="text-[10px] text-stone-500 mt-0.5">
                                                            {req.type === 'choose_n' ? `Choose ${req.courses_needed} from: ${req.options.join(', ')}` : req.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10">
                                    <span className="material-symbols-outlined text-stone-300 text-4xl mb-2">pending</span>
                                    <p className="text-xs text-stone-500">Loading requirements...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </div>

        {/* Floating Action Button (FAB) */}
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 md:hidden">
            <span className="material-symbols-outlined">add</span>
        </button>
    </div>
  );
}

export default StudentPlanner;
