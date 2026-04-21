import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { saveUserProfile, getUserProfile, getAllMajorsOptions, getAllMinorsOptions } from '../../services/db';
import { normalizeMajor, normalizeMinor } from '../../constants/academic';

function StudentOnboarding() {
  const [step, setStep] = useState(1);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();

  // For step 2 form
  const [major, setMajor] = useState('');
  const [minor, setMinor] = useState('None');
  const [term, setTerm] = useState('Fall 2024');
  const [majorOptions, setMajorOptions] = useState([]);
  const [minorOptions, setMinorOptions] = useState([]);

  useEffect(() => {
    async function checkUser(session) {
      console.log("Checking user session:", session);
      const options = await getAllMajorsOptions();
      setMajorOptions(options);
      if (options.length > 0) setMajor(options[0].value);

      const mOptions = await getAllMinorsOptions();
      const minorOptionsWithNone = [{ value: 'None', label: 'None' }, ...mOptions];
      setMinorOptions(minorOptionsWithNone);

      if (!session?.user) {
        setStep(1);
        setIsCheckingSession(false);
        return;
      }

      const profile = await getUserProfile(session.user.id);
      console.log("Found profile:", profile);

      if (profile && profile.starting_term) {
         navigate('/student-planner', { replace: true });
         return;
      }

      setStep(2);
      setIsCheckingSession(false);
    }

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[28px] border border-[#d8d0c8]/60 bg-[#fffaf4] p-10 text-center shadow-[0_2px_16px_rgba(58,48,42,0.04)]">
          <div className="inline-flex items-center space-x-2 mb-6">
            <span className="w-12 h-[1px] bg-outline-variant"></span>
            <span className="text-primary font-['EB_Garamond'] italic text-2xl tracking-tight">4 Year Planner</span>
            <span className="w-12 h-[1px] bg-outline-variant"></span>
          </div>
          <h1 className="text-4xl font-['EB_Garamond'] text-on-surface mb-3">Preparing your workspace.</h1>
          <p className="text-on-surface-variant font-['Manrope']">Checking your profile and routing you to the right next step.</p>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/student-onboarding'
      }
    });
    if (error) console.error("Error logging in:", error.message);
  };

  const handleSaveProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userMetadata = session.user.user_metadata || {};

      await saveUserProfile(session.user.id, {
        full_name: userMetadata.full_name || userMetadata.name || session.user.email,
        major: normalizeMajor(major, majorOptions),
        minor: normalizeMinor(minor, minorOptions),
        starting_term: term
      });
      navigate('/student-planner');
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
            <header className="text-center mb-16 max-w-2xl">
                <div className="inline-flex items-center space-x-2 mb-6">
                    <span className="w-12 h-[1px] bg-outline-variant"></span>
                    <span className="text-primary font-['EB_Garamond'] italic text-2xl tracking-tight">4 Year Planner</span>
                    <span className="w-12 h-[1px] bg-outline-variant"></span>
                </div>
                <h1 className="text-5xl md:text-6xl font-['EB_Garamond'] text-on-surface leading-tight mb-4">Welcome to your future.</h1>
                <p className="text-on-surface-variant text-lg font-['Manrope'] max-w-md mx-auto">Sign in or create an account to start designing your four-year academic path.</p>
            </header>
            <button onClick={handleGoogleLogin} className="flex items-center space-x-3 bg-white text-stone-700 px-8 py-4 rounded-xl font-['Manrope'] font-bold text-lg shadow-sm border border-stone-200 hover:shadow-md transition-all active:scale-95">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" className="w-6 h-6" />
                <span>Continue with Google</span>
            </button>
        </main>
        
        {/* Simple Onboarding Footer */}
        <footer className="py-12 border-t border-outline-variant/20">
            <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-on-surface-variant text-sm font-['Manrope']">
                <div className="flex items-center space-x-6 mb-4 md:mb-0">
                    <a className="hover:text-primary transition-colors" href="#privacy">Privacy Policy</a>
                    <a className="hover:text-primary transition-colors" href="#terms">Academic Terms</a>
                    <a className="hover:text-primary transition-colors" href="#support">Support</a>
                </div>
                <p>© {new Date().getFullYear()} 4 Year Planner. All rights reserved.</p>            </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
        {/* Suppressed Shell: No Nav Bar for Onboarding focused journey */}
        <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
            
            {/* Onboarding Header */}
            <header className="text-center mb-16 max-w-2xl">
                <div className="inline-flex items-center space-x-2 mb-6">
                    <span className="w-12 h-[1px] bg-outline-variant"></span>
                    <span className="text-primary font-['EB_Garamond'] italic text-2xl tracking-tight">4 Year Planner</span>
                    <span className="w-12 h-[1px] bg-outline-variant"></span>
                </div>
                <h1 className="text-5xl md:text-6xl font-['EB_Garamond'] text-on-surface leading-tight mb-4">Designing your path.</h1>
                <p className="text-on-surface-variant text-lg font-['Manrope'] max-w-md mx-auto">Let's configure your academic environment to match your goals and prior achievements.</p>
            </header>

            {/* Progress Stepper */}
            <div className="w-full max-w-3xl mb-12 px-4">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant -z-10"></div>
                    <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center ring-8 ring-background font-bold">1</div>
                    <div className="bg-surface-container-highest text-on-surface-variant w-10 h-10 rounded-full flex items-center justify-center ring-8 ring-background font-bold">2</div>
                    <div className="bg-surface-container-highest text-on-surface-variant w-10 h-10 rounded-full flex items-center justify-center ring-8 ring-background font-bold">3</div>
                </div>
            </div>

            {/* Wizard Canvas */}
            <section className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                
                {/* Left: Form Content */}
                <div className="md:col-span-7 bg-surface-container-low rounded-xl p-8 md:p-12 shadow-[0_2px_16px_rgba(58,48,42,0.04)] border border-outline-variant/30">
                    <div className="space-y-10">
                        
                        {/* Section: Academic Focus */}
                        <div className="space-y-6">
                            <h2 className="text-3xl font-['EB_Garamond'] text-on-surface">Academic Focus</h2>
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-sm font-['Manrope'] font-bold text-on-secondary-fixed-variant mb-2 ml-1">Major</label>
                                    <div className="relative">
                                        <select 
                                            value={major}
                                            onChange={(e) => setMajor(e.target.value)}
                                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-4 px-4 focus:ring-primary focus:border-primary appearance-none text-on-surface cursor-pointer transition-all"
                                        >
                                            {majorOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-sm font-['Manrope'] font-bold text-on-secondary-fixed-variant mb-2 ml-1">Minor</label>
                                    <div className="relative">
                                        <select 
                                            value={minor}
                                            onChange={(e) => setMinor(e.target.value)}
                                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-4 px-4 focus:ring-primary focus:border-primary appearance-none text-on-surface cursor-pointer transition-all"
                                        >
                                            {minorOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Timeline */}
                        <div className="space-y-6">
                            <h2 className="text-3xl font-['EB_Garamond'] text-on-surface">Starting Term</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setTerm('Fall 2024')}
                                    className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all shadow-sm ${term === 'Fall 2024' ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary/50'}`}
                                >
                                    <span className="material-symbols-outlined mb-2">energy_savings_leaf</span>
                                    <span className="font-['Manrope'] font-bold">Fall 2024</span>
                                </button>
                                <button 
                                    onClick={() => setTerm('Spring 2025')}
                                    className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all shadow-sm ${term === 'Spring 2025' ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary/50'}`}
                                >
                                    <span className="material-symbols-outlined mb-2">ac_unit</span>
                                    <span className="font-['Manrope'] font-bold">Spring 2025</span>
                                </button>
                            </div>
                        </div>

                        {/* Section: Completed Credits */}
                        <div className="space-y-6">
                            <h2 className="text-3xl font-['EB_Garamond'] text-on-surface">Prior Achievement</h2>
                            <p className="text-sm text-on-surface-variant -mt-4">Select any AP or transfer credits you've already completed.</p>
                            
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center space-x-2 bg-primary/10 border border-primary/20 text-[#8a4518] px-4 py-2 rounded-full">
                                    <span className="text-sm font-medium">AP Computer Science A</span>
                                    <button className="hover:text-primary"><span className="material-symbols-outlined text-sm">close</span></button>
                                </div>
                                <div className="flex items-center space-x-2 bg-primary/10 border border-primary/20 text-[#8a4518] px-4 py-2 rounded-full">
                                    <span className="text-sm font-medium">AP Calculus BC</span>
                                    <button className="hover:text-primary"><span className="material-symbols-outlined text-sm">close</span></button>
                                </div>
                                <button className="flex items-center space-x-2 border border-dashed border-outline text-on-surface-variant px-4 py-2 rounded-full hover:bg-surface-container-highest transition-colors">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    <span className="text-sm font-medium">Add Course</span>
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Navigation Actions */}
                    <div className="mt-16 flex items-center justify-between border-t border-outline-variant/40 pt-8">
                        <button onClick={() => setStep(1)} className="text-on-surface-variant hover:text-primary font-['Manrope'] font-medium transition-colors flex items-center">
                            <span className="material-symbols-outlined mr-2">arrow_back</span>
                            Back
                        </button>
                        <button onClick={handleSaveProfile} className="bg-primary text-white px-10 py-4 rounded-lg font-['Manrope'] font-bold text-lg hover:shadow-lg transition-all active:opacity-80">
                            Continue to Requirements
                        </button>
                    </div>
                </div>

                {/* Right: Visual Context / Bento Sidebar */}
                <div className="md:col-span-5 flex flex-col space-y-6">
                    
                    {/* Visual Card 1 */}
                    <div className="relative h-64 rounded-xl overflow-hidden shadow-[0_2px_16px_rgba(58,48,42,0.04)]">
                        <img className="w-full h-full object-cover" alt="Modern minimalist university study lounge" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsqK09YX53mAPxHN2gbY4zIUt35p-APSPqHUSd1k-Nj8zz103JMSfjWXnZtanm8C53BRNxMgZcwtf6xeM_oqdoILX2H5ktVxBRckyfMjUOf7sn4GODdFeHoHOKH2m27LBqnZIytGNFCj9Y5xgM5QQH0rHGyihIiX9DlWX9w-cdMKcwowCANX5ZF6zgvm22fk6xEPoZ_CJ9PlIdHPJoq_Hnair0j7VLV0IsHgsNQJID_qNsM-dr_9oMSxOhVCtTA_IX32jXueBrDVvI" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#3a302a]/80 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                            <h3 className="text-2xl italic font-['EB_Garamond']">The Academic Journey</h3>
                            <p className="text-sm font-light opacity-90">Curating your four-year horizon.</p>
                        </div>
                    </div>

                    {/* Context Card 2: Status */}
                    <div className="bg-surface-container rounded-xl p-8 flex-grow border border-outline-variant/30 flex flex-col justify-between">
                        <div>
                            <h4 className="font-['Manrope'] font-bold text-xs uppercase tracking-widest text-[#504840] mb-6">Current Snapshot</h4>
                            <ul className="space-y-6">
                                <li className="flex items-start space-x-4">
                                    <div className="bg-[#fbe8d8] p-2 rounded-lg">
                                        <span className="material-symbols-outlined text-[#401a08]">school</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-on-surface-variant uppercase font-bold">Primary Focus</p>
                                        <p className="text-on-surface font-medium">B.S. {major}</p>
                                    </div>
                                </li>
                                <li className="flex items-start space-x-4 opacity-50">
                                    <div className="bg-surface-container-highest p-2 rounded-lg">
                                        <span className="material-symbols-outlined text-on-surface-variant">history_edu</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-on-surface-variant uppercase font-bold">Planned Credits</p>
                                        <p className="text-on-surface font-medium">8 Credits Transferred</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 mt-8">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-on-surface-variant">Setup Progress</span>
                                <span className="text-xs font-bold text-primary">33%</span>
                            </div>
                            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                                <div className="bg-primary h-full w-1/3"></div>
                            </div>
                        </div>
                    </div>

                </div>

            </section>

        </main>

        {/* Simple Onboarding Footer */}
        <footer className="py-12 border-t border-outline-variant/20">
            <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-on-surface-variant text-sm font-['Manrope']">
                <div className="flex items-center space-x-6 mb-4 md:mb-0">
                    <a className="hover:text-primary transition-colors" href="#privacy">Privacy Policy</a>
                    <a className="hover:text-primary transition-colors" href="#terms">Academic Terms</a>
                    <a className="hover:text-primary transition-colors" href="#support">Support</a>
                </div>
                <p>© {new Date().getFullYear()} 4 Year Planner. All rights reserved.</p>
            </div>
        </footer>
    </div>
  );
}

export default StudentOnboarding;
