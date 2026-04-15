import React, { useState, useEffect } from 'react';
import { getMajorRequirements } from '../../services/db';

function RequirementsProgress() {
  const [majorRequirements, setMajorRequirements] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequirements() {
      setLoading(true);
      const data = await getMajorRequirements('CSCI');
      setMajorRequirements(data);
      setLoading(false);
    }
    loadRequirements();
  }, []);

  return (
    <>
            {/* Content */}
            <div className="max-w-6xl mx-auto p-8 space-y-10">
                {/* Hero Stats / Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CS Core Progress */}
                    <div className="bg-surface-container-low p-8 rounded-xl shadow-[0_2px_16px_rgba(58,48,42,0.04)] border border-outline-variant/30 flex flex-col justify-between">
                        <div>
                            <h3 className="font-headline text-3xl font-semibold mb-2">CS Core</h3>
                            <p className="font-body text-sm text-on-surface-variant mb-6">75% Planned of required units</p>
                        </div>
                        <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-3/4 rounded-full"></div>
                        </div>
                    </div>
                    
                    {/* General Ed Progress */}
                    <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_2px_16px_rgba(58,48,42,0.04)] border-2 border-primary/20 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        </div>
                        <h3 className="font-headline text-3xl font-semibold mb-2">General Ed</h3>
                        <p className="font-body text-sm text-primary font-bold flex items-center">
                            <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            100% Met
                        </p>
                        <p className="font-body text-xs text-on-surface-variant mt-4">All distribution requirements fulfilled.</p>
                    </div>

                    {/* Electives Progress */}
                    <div className="bg-surface-container-low p-8 rounded-xl shadow-[0_2px_16px_rgba(58,48,42,0.04)] border border-outline-variant/30">
                        <h3 className="font-headline text-3xl font-semibold mb-2">Electives</h3>
                        <p className="font-body text-sm text-on-surface-variant mb-4">4 courses remaining</p>
                        <div className="flex space-x-1">
                            <div className="h-2 w-full rounded-full bg-surface-dim"></div>
                            <div className="h-2 w-full rounded-full bg-surface-dim"></div>
                            <div className="h-2 w-full rounded-full bg-surface-dim"></div>
                            <div className="h-2 w-full rounded-full bg-surface-dim"></div>
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
                                            {majorRequirements.requirements.major_requirements.length} Required
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {majorRequirements.requirements.major_requirements.map((req, idx) => (
                                            req.type === 'course' && (
                                                <div key={idx} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50 flex items-center justify-between hover:shadow-md transition-shadow">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                                                            <span className="material-symbols-outlined">lock</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-body font-bold text-on-surface">{req.course_id}: {req.name}</p>
                                                            <p className="font-body text-xs text-on-surface-variant">Required</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-3 py-1 border border-outline-variant text-on-surface-variant text-[10px] font-bold rounded-full tracking-wider uppercase">Remaining</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </section>

                                {/* Electives Section */}
                                <section className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h2 className="font-headline text-2xl font-bold italic text-on-surface">Major Electives</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {majorRequirements.requirements.major_requirements.map((req, idx) => (
                                            req.type === 'elective_group' && (
                                                <div key={idx} className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between group cursor-pointer hover:bg-surface-variant transition-colors">
                                                    <div className="mb-4">
                                                        <p className="font-body font-bold text-on-surface mb-1">{req.name}</p>
                                                        <p className="font-body text-xs text-on-surface-variant leading-relaxed">{req.description}</p>
                                                        <p className="font-body text-xs font-semibold text-primary mt-2">Need to complete: {req.courses_needed} courses</p>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </section>
                                
                                {/* Core Requirements Section */}
                                <section className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h2 className="font-headline text-2xl font-bold italic text-on-surface">University Core Requirements</h2>
                                        <span className="font-body text-xs text-on-surface-variant tracking-widest uppercase">
                                            {majorRequirements.requirements.core_requirements.length} Required
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {majorRequirements.requirements.core_requirements.map((req, idx) => (
                                            <div key={idx} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50 flex items-center justify-between hover:shadow-md transition-shadow">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                                                        <span className="material-symbols-outlined">public</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-body font-bold text-on-surface">{req.name}</p>
                                                        <p className="font-body text-xs text-on-surface-variant">
                                                            {req.type === 'choose_n' ? `Choose ${req.courses_needed} from: ${req.options.join(', ')}` : req.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 border border-outline-variant text-on-surface-variant text-[10px] font-bold rounded-full tracking-wider uppercase">Remaining</span>
                                            </div>
                                        ))}
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
                                        <p className="text-4xl font-headline italic">92 <span className="text-xl opacity-50">/ 120</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-tighter text-stone-400 font-bold mb-1">GPA</p>
                                        <p className="text-2xl font-headline">3.88</p>
                                    </div>
                                </div>
                                <div className="w-full bg-stone-700 h-1 rounded-full">
                                    <div className="bg-primary h-full w-[76%] rounded-full"></div>
                                </div>
                                <p className="text-xs text-stone-300 font-body leading-relaxed">You are on track to graduate in <span className="text-primary font-bold">May 2025</span>. Maintain your current pace to secure honors.</p>
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
                                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Fall 2023</p>
                                        <p className="text-sm font-body">4 Core Courses Completed</p>
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-primary mb-1"></div>
                                        <div className="w-0.5 h-full bg-outline-variant"></div>
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Spring 2024 (Current)</p>
                                        <p className="text-sm font-body">3 Core + 1 Elective Planned</p>
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full border-2 border-outline-variant mb-1"></div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-50">Fall 2024</p>
                                        <p className="text-sm font-body opacity-50">Final Capstone &amp; 2 Electives</p>
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
                                "Julianne, consider taking the AI elective this fall—it's only offered once a year and fills up fast!"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
    </>
  );
}

export default RequirementsProgress;
