import React from 'react';

function StudentPlanner() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-8 py-4 bg-[#faf5ee] border-b border-[#d8d0c8]/60 shadow-[0_2px_16px_rgba(58,48,42,0.04)] z-10">
            <div className="flex items-center space-x-6">
                <span className="text-2xl font-headline italic text-[#c2652a]">Sahara Academic</span>
                <div className="hidden lg:flex items-center space-x-4">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
                        <input className="pl-10 pr-4 py-1.5 bg-surface-container-low border-outline-variant/40 rounded-full text-sm focus:ring-primary focus:border-primary w-64" placeholder="Search major requirements..." type="text" />
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-5">
                <button className="p-2 text-stone-600 hover:text-[#c2652a] transition-colors">
                    <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
                </button>
                <button className="p-2 text-stone-600 hover:text-[#c2652a] transition-colors">
                    <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
                </button>
            </div>
        </header>

        {/* Planner Canvas */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left Side: 4-Year Grid */}
            <section className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-4xl font-headline text-on-background mb-2">Degree Roadmap</h1>
                            <p className="text-stone-500 font-body">Computer Science B.S. • Class of 2026</p>
                        </div>
                        <div className="flex space-x-4">
                            <div className="bg-surface-container-high px-4 py-2 rounded-lg text-xs font-bold text-on-surface flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> 142 / 180 Units
                            </div>
                            <button className="p-2 bg-surface-container-high rounded-lg text-stone-600 hover:bg-stone-200 transition-colors">
                                <span className="material-symbols-outlined">download</span>
                            </button>
                        </div>
                    </div>

                    {/* Year Grid (Iterative Content) */}
                    <div className="space-y-12">
                        {/* Year 1 */}
                        <div>
                            <h2 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant/30 flex justify-between items-center">
                                Year 1: Freshman
                                <span className="text-sm font-normal text-stone-400">2022 - 2023</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Fall */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Fall</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">15 Units</span>
                                    </div>
                                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 shadow-sm space-y-2 border-l-4 border-l-green-500">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold">CS 101</span>
                                            <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-stone-600">Intro to Programming</p>
                                        <p className="text-[10px] text-stone-400">5 Units</p>
                                    </div>
                                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 shadow-sm space-y-2 border-l-4 border-l-green-500">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold">MATH 51</span>
                                            <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-stone-600">Linear Algebra</p>
                                        <p className="text-[10px] text-stone-400">5 Units</p>
                                    </div>
                                </div>
                                {/* Winter */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Winter</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">14 Units</span>
                                    </div>
                                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 shadow-sm space-y-2 border-l-4 border-l-green-500">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold">CS 106B</span>
                                            <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-stone-600">Data Abstractions</p>
                                        <p className="text-[10px] text-stone-400">5 Units</p>
                                    </div>
                                </div>
                                {/* Spring */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Spring</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">16 Units</span>
                                    </div>
                                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 shadow-sm space-y-2 border-l-4 border-l-green-500">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold">CS 107</span>
                                            <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-stone-600">Computer Organization</p>
                                        <p className="text-[10px] text-stone-400">5 Units</p>
                                    </div>
                                </div>
                                {/* Summer */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Summer</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">0 Units</span>
                                    </div>
                                    <div className="border-2 border-dashed border-outline-variant/40 rounded-xl h-32 flex flex-col items-center justify-center text-stone-400">
                                        <span className="material-symbols-outlined text-lg mb-1">add</span>
                                        <span className="text-[10px] font-bold">ADD COURSE</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Year 2 */}
                        <div>
                            <h2 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant/30 flex justify-between items-center">
                                Year 2: Sophomore
                                <span className="text-sm font-normal text-stone-400">2023 - 2024</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Fall */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Fall</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">12 Units</span>
                                    </div>
                                    {/* Warning State */}
                                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-error/20 shadow-sm space-y-2 border-l-4 border-l-error">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold">CS 110</span>
                                            <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-stone-600 font-bold">Prereq not met</p>
                                        <p className="text-[10px] text-stone-400">Requires CS 107</p>
                                    </div>
                                </div>
                                {/* Winter */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Winter</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">15 Units</span>
                                    </div>
                                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 shadow-sm space-y-2 border-l-4 border-l-primary">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold">CS 161</span>
                                            <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-stone-600">Design of Algorithms</p>
                                        <p className="text-[10px] text-stone-400">5 Units</p>
                                    </div>
                                </div>
                                {/* Spring */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Spring</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">13 Units</span>
                                    </div>
                                    {/* Warning State (Yellow) */}
                                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-amber-200 shadow-sm space-y-2 border-l-4 border-l-amber-500">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold">PHIL 182</span>
                                            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                        </div>
                                        <p className="text-[11px] leading-tight text-stone-600 font-bold">Not offered</p>
                                        <p className="text-[10px] text-stone-400">Spring 2024 Elective</p>
                                    </div>
                                </div>
                                {/* Summer */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Summer</span>
                                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">0 Units</span>
                                    </div>
                                    <div className="border-2 border-dashed border-outline-variant/40 rounded-xl h-32 flex flex-col items-center justify-center text-stone-400">
                                        <span className="material-symbols-outlined text-lg mb-1">add</span>
                                        <span className="text-[10px] font-bold">ADD COURSE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Right Side: Course Search Panel */}
            <aside className="w-80 bg-surface-container border-l border-outline-variant/60 p-6 overflow-y-auto hidden xl:block">
                <div className="sticky top-0 bg-surface-container pb-4 z-10">
                    <h3 className="text-lg font-headline font-semibold mb-4 text-on-surface">Course Search</h3>
                    <div className="relative mb-6">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                        <input className="w-full pl-10 pr-4 py-2.5 bg-white border-outline-variant/60 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all" placeholder="Search by name or ID..." type="text" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Popular This Quarter</p>
                        <div className="space-y-3">
                            {/* Course Item */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:border-primary/50 cursor-pointer group transition-all">
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

                            {/* Course Item */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:border-primary/50 cursor-pointer group transition-all">
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

                            {/* Course Item */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:border-primary/50 cursor-pointer group transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-primary">PWR 2</span>
                                    <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors">add_circle</span>
                                </div>
                                <p className="text-xs font-semibold text-on-surface">The Rhetoric of Code</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-[10px] text-stone-500">4 Units • Autumn</span>
                                    <span className="px-2 py-0.5 bg-surface-container rounded text-[9px] font-bold text-stone-600">Gen-Ed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                        <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">auto_awesome</span> Smart Recommendations
                        </h4>
                        <p className="text-[11px] text-stone-600 leading-relaxed mb-4">Based on your Senior-year goals, you should complete <strong>CS 107E</strong> before next Autumn.</p>
                        <button className="w-full py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-opacity">
                            Find CS 107E Sections
                        </button>
                    </div>
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
