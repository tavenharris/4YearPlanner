import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { getMajorRequirements, getMinorRequirements, getUserProfile, getUserCourses } from '../../services/db';

function RequirementsProgress() {
  const [profile, setProfile] = useState(null);
  const [userCourses, setUserCourses] = useState([]);
  const [majorRequirements, setMajorRequirements] = useState(null);
  const [minorRequirements, setMinorRequirements] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userProfile = await getUserProfile(session.user.id);
        if (userProfile) setProfile(userProfile);
        
        const data = await getMajorRequirements(userProfile?.major || 'CSCI');
        setMajorRequirements(data);
        
        if (userProfile?.minor && userProfile.minor !== 'None') {
          const minorData = await getMinorRequirements(userProfile.minor);
          setMinorRequirements(minorData);
        }
        
        const courses = await getUserCourses(session.user.id);
        if (courses) setUserCourses(courses);
      } else {
        const data = await getMajorRequirements('CSCI');
        setMajorRequirements(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const getCourseStatus = (courseId) => {
    const course = userCourses.find(c => c.course_id === courseId);
    return course ? course.status : 'remaining';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return { text: 'Completed', color: 'bg-green-500/10 text-green-700 border-green-200' };
      case 'in_progress': return { text: 'In Progress', color: 'bg-amber-500/10 text-amber-700 border-amber-200' };
      case 'planned': return { text: 'Planned', color: 'bg-primary/10 text-primary border-primary/20' };
      default: return { text: 'Remaining', color: 'border-outline-variant text-on-surface-variant' };
    }
  };

  const creditsEarned = userCourses
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + (c.credits || 0), 0);
  const totalCreditsRequired = 180; // Changed to 180 to match StudentPlanner max
  const creditsPercentage = Math.min((creditsEarned / totalCreditsRequired) * 100, 100);

  const coreRequirements = majorRequirements?.requirements?.major_requirements?.filter(r => r.type === 'course') || [];
  const coreTotal = coreRequirements.length;
  const coreCompletedOrPlanned = coreRequirements.filter(r => getCourseStatus(r.course_id) !== 'remaining').length;
  const corePercentage = coreTotal > 0 ? (coreCompletedOrPlanned / coreTotal) * 100 : 0;

  const genEdRequirements = majorRequirements?.requirements?.core_requirements || [];
  const genEdTotal = genEdRequirements.length;
  const genEdCompletedOrPlanned = genEdRequirements.filter(req => {
     if (req.type === 'choose_n' && req.options) {
        const metCount = req.options.filter(opt => getCourseStatus(opt) !== 'remaining').length;
        return metCount >= req.courses_needed;
     }
     return false;
  }).length;
  const genEdPercentage = genEdTotal > 0 ? (genEdCompletedOrPlanned / genEdTotal) * 100 : 0;
  const genEdMet = genEdPercentage === 100;

  const minorReqs = minorRequirements?.requirements?.minor_requirements || [];
  const minorTotal = minorReqs.length;
  const minorCompletedOrPlanned = minorReqs.filter(req => {
     if (req.type === 'choose_n' && req.options) {
        const metCount = req.options.filter(opt => getCourseStatus(opt) !== 'remaining').length;
        return metCount >= req.courses_needed;
     } else if (req.type === 'course') {
        return getCourseStatus(req.course_id) !== 'remaining';
     }
     return false;
  }).length;
  const minorPercentage = minorTotal > 0 ? (minorCompletedOrPlanned / minorTotal) * 100 : 0;
  const minorMet = minorTotal > 0 && minorPercentage === 100;

  const electiveGroups = majorRequirements?.requirements?.major_requirements?.filter(r => r.type === 'elective_group') || [];
  const electivesNeeded = electiveGroups.reduce((sum, g) => sum + (g.courses_needed || 0), 0);
  const coreIds = coreRequirements.map(r => r.course_id);
  const genEdIds = genEdRequirements.flatMap(r => r.options || []);
  const electivesTaken = userCourses.filter(c => c.status !== 'remaining' && !coreIds.includes(c.course_id) && !genEdIds.includes(c.course_id)).length;
  const electivesRemaining = Math.max(0, electivesNeeded - electivesTaken);

  const startingYearMatch = profile?.starting_term?.match(/\d{4}/);
  const startYear = startingYearMatch ? parseInt(startingYearMatch[0], 10) : new Date().getFullYear();
  const gradYear = startYear + 4;
  const gradMonth = 'May';

  const studentFirstName = profile?.full_name?.split(' ')[0] || "Student";

  return (
    <>
            {/* Content */}
            <div className="max-w-6xl mx-auto p-8 space-y-10">
                {/* Hero Stats / Summary Section */}
                <div className={`grid grid-cols-1 md:grid-cols-3 ${minorRequirements ? 'lg:grid-cols-4' : ''} gap-6`}>
                    {/* CS Core Progress */}
                    <div className="bg-surface-container-low p-8 rounded-xl shadow-[0_2px_16px_rgba(58,48,42,0.04)] border border-outline-variant/30 flex flex-col justify-between">
                        <div>
                            <h3 className="font-headline text-3xl font-semibold mb-2">{majorRequirements?.name || 'Major'} Core</h3>
                            <p className="font-body text-sm text-on-surface-variant mb-6">{Math.round(corePercentage)}% Planned/Completed of required courses</p>
                        </div>
                        <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${corePercentage}%` }}></div>
                        </div>
                    </div>
                    
                    {/* Minor Progress */}
                    {minorRequirements && (
                        <div className={`p-8 rounded-xl shadow-[0_2px_16px_rgba(58,48,42,0.04)] relative overflow-hidden ${minorMet ? 'bg-surface-container-lowest border-2 border-primary/20' : 'bg-surface-container-low border border-outline-variant/30'}`}>
                            {minorMet && (
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                </div>
                            )}
                            <h3 className="font-headline text-3xl font-semibold mb-2">{minorRequirements.name}</h3>
                            <p className={`font-body text-sm font-bold flex items-center ${minorMet ? 'text-primary' : 'text-on-surface-variant'}`}>
                                {minorMet && <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                                {Math.round(minorPercentage)}% Met
                            </p>
                            <p className="font-body text-xs text-on-surface-variant mt-4">
                                {minorMet ? 'Minor requirements fulfilled.' : `${minorTotal - minorCompletedOrPlanned} requirements remaining.`}
                            </p>
                            {!minorMet && (
                                <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden mt-4">
                                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${minorPercentage}%` }}></div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* General Ed Progress */}
                    <div className={`p-8 rounded-xl shadow-[0_2px_16px_rgba(58,48,42,0.04)] relative overflow-hidden ${genEdMet ? 'bg-surface-container-lowest border-2 border-primary/20' : 'bg-surface-container-low border border-outline-variant/30'}`}>
                        {genEdMet && (
                            <div className="absolute -right-4 -top-4 opacity-10">
                                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            </div>
                        )}
                        <h3 className="font-headline text-3xl font-semibold mb-2">General Ed</h3>
                        <p className={`font-body text-sm font-bold flex items-center ${genEdMet ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {genEdMet && <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                            {Math.round(genEdPercentage)}% Met
                        </p>
                        <p className="font-body text-xs text-on-surface-variant mt-4">
                            {genEdMet ? 'All distribution requirements fulfilled.' : `${genEdTotal - genEdCompletedOrPlanned} requirements remaining.`}
                        </p>
                        {!genEdMet && (
                            <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden mt-4">
                                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${genEdPercentage}%` }}></div>
                            </div>
                        )}
                    </div>

                    {/* Electives Progress */}
                    <div className="bg-surface-container-low p-8 rounded-xl shadow-[0_2px_16px_rgba(58,48,42,0.04)] border border-outline-variant/30">
                        <h3 className="font-headline text-3xl font-semibold mb-2">Electives</h3>
                        <p className="font-body text-sm text-on-surface-variant mb-4">{electivesRemaining} courses remaining</p>
                        <div className="flex space-x-1">
                            {Array.from({ length: electivesNeeded }).map((_, i) => (
                                <div key={i} className={`h-2 w-full rounded-full ${i < electivesTaken ? 'bg-primary' : 'bg-surface-dim'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bento Grid Requirements Checklist */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Requirements Tree (Left/Wide) */}
                    <div className="lg:col-span-8 space-y-6">
                        {loading ? (
                            <div className="text-center py-10">
                                <span className="material-symbols-outlined text-stone-300 text-4xl mb-2 animate-spin">refresh</span>
                                <p className="text-sm text-stone-500">Loading requirements from database...</p>
                            </div>
                        ) : majorRequirements ? (
                            <>
                                {/* Core CS Section */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h2 className="font-headline text-2xl font-bold italic text-on-surface">{majorRequirements.name} Core</h2>
                                        <span className="font-body text-xs text-on-surface-variant tracking-widest uppercase">
                                            {coreTotal} Required
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {coreRequirements.map((req, idx) => {
                                            const status = getCourseStatus(req.course_id);
                                            const statusLabel = getStatusLabel(status);
                                            return (
                                                <div key={idx} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50 flex items-center justify-between hover:shadow-md transition-shadow">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-surface-container-highest text-outline'}`}>
                                                            <span className="material-symbols-outlined">{status === 'completed' ? 'check_circle' : 'lock'}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-body font-bold text-on-surface">{req.course_id}: {req.name}</p>
                                                            <p className="font-body text-xs text-on-surface-variant">Required</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 border text-[10px] font-bold rounded-full tracking-wider uppercase ${statusLabel.color}`}>{statusLabel.text}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Electives Section */}
                                <section className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h2 className="font-headline text-2xl font-bold italic text-on-surface">Major Electives</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {electiveGroups.map((req, idx) => {
                                            return (
                                                <div key={idx} className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between group cursor-pointer hover:bg-surface-variant transition-colors">
                                                    <div className="mb-4">
                                                        <p className="font-body font-bold text-on-surface mb-1">{req.name}</p>
                                                        <p className="font-body text-xs text-on-surface-variant leading-relaxed">{req.description}</p>
                                                        <p className="font-body text-xs font-semibold text-primary mt-2">Need to complete: {req.courses_needed} courses</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                                
                                {/* Minor Requirements Section */}
                                {minorRequirements && minorReqs.length > 0 && (
                                <section className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h2 className="font-headline text-2xl font-bold italic text-on-surface">{minorRequirements.name} Minor</h2>
                                        <span className="font-body text-xs text-on-surface-variant tracking-widest uppercase">
                                            {minorTotal} Required
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {minorReqs.map((req, idx) => {
                                            let isMet = false;
                                            let statusLabel = { text: 'Remaining', color: 'border-outline-variant text-on-surface-variant' };
                                            
                                            if (req.type === 'choose_n' && req.options) {
                                                const metCount = req.options.filter(opt => getCourseStatus(opt) !== 'remaining').length;
                                                isMet = metCount >= req.courses_needed;
                                            } else if (req.type === 'course') {
                                                const status = getCourseStatus(req.course_id);
                                                isMet = status !== 'remaining';
                                                statusLabel = getStatusLabel(status);
                                            }

                                            return (
                                                <div key={`minor-${idx}`} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50 flex items-center justify-between hover:shadow-md transition-shadow">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMet ? 'bg-green-50 text-green-600' : 'bg-surface-container-highest text-outline'}`}>
                                                            <span className="material-symbols-outlined">{isMet ? 'check_circle' : 'lock'}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-body font-bold text-on-surface">{req.name || req.course_id}</p>
                                                            <p className="font-body text-xs text-on-surface-variant">
                                                                {req.type === 'choose_n' ? `Choose ${req.courses_needed} from: ${req.options.join(', ')}` : req.description || 'Required Course'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {req.type === 'course' ? (
                                                        <span className={`px-3 py-1 border text-[10px] font-bold rounded-full tracking-wider uppercase ${statusLabel.color}`}>{statusLabel.text}</span>
                                                    ) : (
                                                        <span className={`px-3 py-1 border text-[10px] font-bold rounded-full tracking-wider uppercase ${isMet ? 'bg-green-500/10 text-green-700 border-green-200' : 'border-outline-variant text-on-surface-variant'}`}>{isMet ? 'Met' : 'Remaining'}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                                )}

                                {/* Core Requirements Section */}
                                <section className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h2 className="font-headline text-2xl font-bold italic text-on-surface">University Core Requirements</h2>
                                        <span className="font-body text-xs text-on-surface-variant tracking-widest uppercase">
                                            {genEdTotal} Required
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {genEdRequirements.map((req, idx) => {
                                            // Determine if this gen ed is met
                                            let metCount = 0;
                                            if (req.type === 'choose_n' && req.options) {
                                                metCount = req.options.filter(opt => getCourseStatus(opt) !== 'remaining').length;
                                            }
                                            const isMet = metCount >= req.courses_needed;
                                            
                                            return (
                                                <div key={idx} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50 flex items-center justify-between hover:shadow-md transition-shadow">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMet ? 'bg-green-50 text-green-600' : 'bg-surface-container-highest text-outline'}`}>
                                                            <span className="material-symbols-outlined">{isMet ? 'public' : 'public'}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-body font-bold text-on-surface">{req.name}</p>
                                                            <p className="font-body text-xs text-on-surface-variant">
                                                                {req.type === 'choose_n' ? `Choose ${req.courses_needed} from: ${req.options.join(', ')}` : req.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 border text-[10px] font-bold rounded-full tracking-wider uppercase ${isMet ? 'bg-green-500/10 text-green-700 border-green-200' : 'border-outline-variant text-on-surface-variant'}`}>{isMet ? 'Met' : 'Remaining'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </>
                        ) : (
                            <div className="text-center py-10 text-red-500">
                                <p>Failed to load major requirements data.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar / Supplemental (Narrow) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Progress Card */}
                        <div className="bg-[#3a302a] text-[#faf5ee] p-8 rounded-xl relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mb-16 blur-3xl"></div>
                            <h4 className="font-headline text-xl italic mb-6">Graduation Path</h4>
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-tighter text-stone-400 font-bold mb-1">Credits Earned</p>
                                        <p className="text-4xl font-headline italic">{creditsEarned} <span className="text-xl opacity-50">/ {totalCreditsRequired}</span></p>
                                    </div>
                                </div>
                                <div className="w-full bg-stone-700 h-1 rounded-full">
                                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${creditsPercentage}%` }}></div>
                                </div>
                                <p className="text-xs text-stone-300 font-body leading-relaxed">You are on track to graduate in <span className="text-primary font-bold">{gradMonth} {gradYear}</span>. Maintain your current pace to graduate on time.</p>
                            </div>
                        </div>

                        {/* Visual Connection to Plan */}
                        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6">
                            <h4 className="font-headline text-lg font-bold mb-4">Semester Mapping</h4>
                            <div className="space-y-4">
                                <div className="flex space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-primary mb-1"></div>
                                        <div className="w-0.5 h-full bg-outline-variant"></div>
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Past Terms</p>
                                        <p className="text-sm font-body">{userCourses.filter(c => c.status === 'completed').length} Courses Completed</p>
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 mb-1"></div>
                                        <div className="w-0.5 h-full bg-outline-variant"></div>
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Current Term</p>
                                        <p className="text-sm font-body">{userCourses.filter(c => c.status === 'in_progress').length} Courses In Progress</p>
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full border-2 border-outline-variant mb-1"></div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-50">Future Terms</p>
                                        <p className="text-sm font-body opacity-50">{userCourses.filter(c => c.status === 'planned').length} Courses Planned</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advisor Tip */}
                        <div className="bg-tertiary-container/10 border border-tertiary/20 p-6 rounded-xl">
                            <div className="flex items-center space-x-3 mb-3">
                                <span className="material-symbols-outlined text-tertiary">tips_and_updates</span>
                                <p className="font-headline font-bold text-tertiary italic">Advisor Tip</p>
                            </div>
                            <p className="text-xs text-on-tertiary-container font-body leading-relaxed">
                                "{studentFirstName}, make sure to balance your core computer science classes with your remaining general education requirements to keep your workload manageable."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
    </>
  );
}

export default RequirementsProgress;
