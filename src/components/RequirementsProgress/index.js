import React from 'react';
import { Link } from 'react-router-dom';

function RequirementsProgress() {
  return (
    <>
            <header className="flex justify-between items-center w-full px-8 py-4 bg-[#faf5ee] dark:bg-stone-900 border-b border-[#d8d0c8]/60 dark:border-stone-800 shadow-[0_2px_16px_rgba(58,48,42,0.04)] sticky top-0 z-40">
                <div className="flex items-center">
                    <h1 className="text-2xl font-['EB_Garamond'] font-semibold text-on-surface">Major Progress</h1>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="hidden lg:flex items-center space-x-8">
                        <Link className="text-stone-600 dark:text-stone-400 hover:text-[#c2652a] transition-colors duration-200 font-['EB_Garamond'] font-semibold" to="#">Overview</Link>
                        <Link className="text-[#c2652a] dark:text-orange-400 border-b-2 border-[#c2652a] font-['EB_Garamond'] font-semibold" to="#">Degree Audit</Link>
                        <Link className="text-stone-600 dark:text-stone-400 hover:text-[#c2652a] transition-colors duration-200 font-['EB_Garamond'] font-semibold" to="#">Transfer Credits</Link>
                    </div>
                    <div className="flex items-center space-x-4 border-l border-[#d8d0c8]/60 pl-6">
                        <button className="text-stone-600 hover:text-primary"><span className="material-symbols-outlined">notifications</span></button>
                        <button className="text-stone-600 hover:text-primary"><span className="material-symbols-outlined">account_circle</span></button>
                    </div>
                </div>
            </header>

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
                        {/* Core CS Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="font-headline text-2xl font-bold italic text-on-surface">Computer Science Core</h2>
                                <span className="font-body text-xs text-on-surface-variant tracking-widest uppercase">9 of 12 Credits</span>
                            </div>
                            
                            <div className="space-y-3">
                                {/* Course Item: Met */}
                                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                        </div>
                                        <div>
                                            <p className="font-body font-bold text-on-surface">CS 101: Data Structures</p>
                                            <p className="font-body text-xs text-on-surface-variant">Completed Fall 2023 • Grade: A</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-surface-container text-on-secondary-fixed-variant text-[10px] font-bold rounded-full tracking-wider uppercase">Met</span>
                                </div>

                                {/* Course Item: Planned */}
                                <div className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-l-primary border border-outline-variant/50 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">schedule</span>
                                        </div>
                                        <div>
                                            <p className="font-body font-bold text-on-surface">CS 305: Operating Systems</p>
                                            <p className="font-body text-xs text-on-surface-variant">Planned for Spring 2024</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full tracking-wider uppercase">Planned</span>
                                </div>

                                {/* Course Item: Planned */}
                                <div className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-l-primary border border-outline-variant/50 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">schedule</span>
                                        </div>
                                        <div>
                                            <p className="font-body font-bold text-on-surface">CS 410: Database Systems</p>
                                            <p className="font-body text-xs text-on-surface-variant">Planned for Fall 2024</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full tracking-wider uppercase">Planned</span>
                                </div>

                                {/* Course Item: Remaining */}
                                <div className="bg-surface-container-lowest/50 p-5 rounded-xl border border-dashed border-outline-variant flex items-center justify-between opacity-70">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                                            <span className="material-symbols-outlined">lock</span>
                                        </div>
                                        <div>
                                            <p className="font-body font-bold text-on-surface">CS 490: Senior Capstone</p>
                                            <p className="font-body text-xs text-on-surface-variant">Prerequisite: 100+ Credits</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 border border-outline-variant text-on-surface-variant text-[10px] font-bold rounded-full tracking-wider uppercase">Remaining</span>
                                </div>
                            </div>
                        </section>

                        {/* Electives Section */}
                        <section className="space-y-4 pt-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="font-headline text-2xl font-bold italic text-on-surface">Upper-Level Electives</h2>
                                <span className="font-body text-xs text-on-surface-variant tracking-widest uppercase">Select 4 courses</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Elective Card */}
                                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between group cursor-pointer hover:bg-surface-variant transition-colors">
                                    <div className="mb-4">
                                        <p className="font-body font-bold text-on-surface mb-1">AI &amp; Machine Learning</p>
                                        <p className="font-body text-xs text-on-surface-variant leading-relaxed">Introduction to neural networks, deep learning, and supervised models.</p>
                                    </div>
                                    <button className="text-xs font-bold text-primary flex items-center group-hover:translate-x-1 transition-transform">
                                        View Syllabus <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                                    </button>
                                </div>

                                {/* Elective Card */}
                                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between group cursor-pointer hover:bg-surface-variant transition-colors">
                                    <div className="mb-4">
                                        <p className="font-body font-bold text-on-surface mb-1">Cybersecurity Fundamentals</p>
                                        <p className="font-body text-xs text-on-surface-variant leading-relaxed">Network security, cryptography, and defense mechanisms.</p>
                                    </div>
                                    <button className="text-xs font-bold text-primary flex items-center group-hover:translate-x-1 transition-transform">
                                        View Syllabus <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </section>
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
