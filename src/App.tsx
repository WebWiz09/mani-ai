import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { 
  Send, 
  RefreshCw, 
  Copy, 
  Check, 
  Rocket, 
  FileText, 
  Award, 
  User, 
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Share2,
  Download,
  Zap,
  Terminal,
  MessageSquare,
  Sun,
  Moon,
  Heart
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getNextQuestion, generateOutput, InterviewState } from './services/gemini';

type AppState = 'landing' | 'interviewing' | 'generating' | 'result';

const OUTPUT_TYPES = [
  { id: 'Startup Pitch', icon: Rocket, description: 'Tell your story to investors with confidence.', color: 'bg-mani-yellow' },
  { id: 'Proposal', icon: FileText, description: 'Win over clients with a clear, professional plan.', color: 'bg-mani-yellow' },
  { id: 'Grant', icon: Award, description: 'Secure funding by highlighting your impact.', color: 'bg-mani-yellow' },
  { id: 'Professional Bio', icon: User, description: 'A personal brand that opens new doors.', color: 'bg-mani-yellow' },
];

const PixelMascot = ({ className = "w-12 h-12", isIdle = true, isSmiling = false }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <motion.div
      animate={isIdle ? {
        y: [0, -6, 0],
        rotate: [0, -1, 1, 0],
      } : {
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`${className} relative`}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cuboid Body - Front Face */}
        <rect x="4" y="7" width="14" height="13" fill="currentColor" />
        {/* Top Face (3D effect) */}
        <path d="M4 7L7 4H21L18 7H4Z" fill="currentColor" fillOpacity="0.7" />
        {/* Right Face (3D effect) */}
        <path d="M18 7L21 4V17L18 20V7Z" fill="currentColor" fillOpacity="0.4" />
        
        {/* Eyes */}
        {!isBlinking ? (
          <>
            <rect x="7" y="12" width="2" height="2" fill="black" />
            <rect x="13" y="12" width="2" height="2" fill="black" />
          </>
        ) : (
          <>
            <rect x="7" y="13" width="2" height="1" fill="black" />
            <rect x="13" y="13" width="2" height="1" fill="black" />
          </>
        )}
        
        {/* Mouth */}
        <AnimatePresence mode="wait">
          {isSmiling ? (
            <motion.path 
              key="smile"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              d="M9 16H13V17H9V16ZM8 15H9V16H8V15ZM13 15H14V16H13V15Z" 
              fill="black" 
            />
          ) : (
            <motion.path 
              key="neutral"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              d="M9 16H13V17H9V16Z" 
              fill="black" 
            />
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mani-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });
  const [landingStep, setLandingStep] = useState(0);
  const [showCards, setShowCards] = useState(false);
  const [interview, setInterview] = useState<InterviewState>({
    type: '',
    answers: [],
    currentQuestion: '',
    isComplete: false,
  });
  const [userInput, setUserInput] = useState('');
  const [finalResult, setFinalResult] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMascotSmiling, setIsMascotSmiling] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('mani-theme', theme);
  }, [theme]);

  // Slider auto-cycle
  useEffect(() => {
    if (appState === 'landing' && !showCards) {
      const interval = setInterval(() => {
        setLandingStep(prev => (prev + 1) % LANDING_SLIDES.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [appState, showCards]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [interview.answers, interview.currentQuestion, isTyping]);

  // Mascot smile logic
  useEffect(() => {
    if (appState === 'landing') {
      const interval = setInterval(() => {
        setIsMascotSmiling(prev => !prev);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [appState]);

  const LANDING_SLIDES = [
    {
      title: "Craft Winning Proposals",
      description: "Stop staring at a blank page. Mani interviews you to understand your project and writes a tailored proposal that wins.",
      ui: (
        <motion.div 
          whileHover={{ y: -5, rotate: 1 }}
          className="bg-mani-dark p-8 rounded-[2.5rem] border border-mani-border shadow-2xl space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-mani-yellow/20" />
          <div className="flex gap-4">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 bg-mani-yellow rounded-xl flex-shrink-0 shadow-lg shadow-mani-yellow/20" 
            />
            <div className="space-y-2 flex-1 pt-2">
              <div className="h-4 bg-mani-text/10 rounded-full w-3/4" />
              <div className="h-3 bg-mani-text/5 rounded-full w-1/2" />
            </div>
          </div>
          <div className="space-y-3 pl-14">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1, delay: 0.5 }} className="h-2 bg-mani-text/5 rounded-full" />
            <motion.div initial={{ width: 0 }} animate={{ width: '90%' }} transition={{ duration: 1, delay: 0.7 }} className="h-2 bg-mani-text/5 rounded-full" />
            <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} transition={{ duration: 1, delay: 0.9 }} className="h-2 bg-mani-text/5 rounded-full" />
          </div>
          <div className="flex justify-end pt-4">
            <div className="bg-mani-yellow/10 border border-mani-yellow/20 px-4 py-2 rounded-xl text-[8px] font-pixel text-mani-yellow">Proposal Ready</div>
          </div>
        </motion.div>
      )
    },
    {
      title: "Perfect Your Bio",
      description: "Your personal brand matters. Mani helps you highlight your strengths and experience in a bio that opens doors.",
      ui: (
        <motion.div 
          whileHover={{ y: -5, rotate: -1 }}
          className="bg-mani-dark p-8 rounded-[2.5rem] border border-mani-border shadow-2xl space-y-8 relative overflow-hidden"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 bg-mani-text/5 rounded-3xl border-2 border-mani-yellow/30 flex items-center justify-center"
            >
              <User className="w-10 h-10 text-mani-yellow" />
            </motion.div>
            <div className="space-y-2">
              <div className="h-5 bg-mani-text rounded-full w-32 mx-auto" />
              <div className="h-3 bg-mani-yellow/40 rounded-full w-20 mx-auto" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-2 bg-mani-text/5 rounded-full w-full" />
            <div className="h-2 bg-mani-text/5 rounded-full w-full" />
            <div className="h-2 bg-mani-text/5 rounded-full w-4/5 mx-auto" />
          </div>
        </motion.div>
      )
    },
    {
      title: "Pitch with Confidence",
      description: "Whether it's for an investor or a new client, Mani crafts a compelling pitch that tells your story perfectly.",
      ui: (
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          className="bg-mani-dark p-10 rounded-[2.5rem] border border-mani-border shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-mani-yellow rounded-2xl">
              <Rocket className="text-black w-6 h-6" />
            </div>
            <div className="h-5 bg-mani-yellow/20 rounded-full w-40" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-24 bg-mani-text/5 rounded-[1.5rem] border border-mani-border" 
            />
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="h-24 bg-mani-text/5 rounded-[1.5rem] border border-mani-border" 
            />
          </div>
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="mt-8 h-1 bg-mani-yellow/20 rounded-full overflow-hidden"
          >
            <div className="h-full w-1/3 bg-mani-yellow" />
          </motion.div>
        </motion.div>
      )
    }
  ];

  const startInterview = async (type: string) => {
    setAppState('interviewing');
    setInterview({ type, answers: [], currentQuestion: '', isComplete: false });
    setIsTyping(true);
    
    const firstQuestion = await getNextQuestion({ type, answers: [], currentQuestion: '', isComplete: false });
    setInterview(prev => ({ ...prev, currentQuestion: firstQuestion }));
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!userInput.trim() || isTyping) return;

    const currentAnswer = userInput;
    const currentQuestion = interview.currentQuestion;
    setUserInput('');

    const updatedAnswers = [...interview.answers, { question: currentQuestion, answer: currentAnswer }];
    setInterview(prev => ({ ...prev, answers: updatedAnswers, currentQuestion: '' }));
    
    if (updatedAnswers.length >= 8) {
      handleGenerate(updatedAnswers);
      return;
    }

    setIsTyping(true);
    const next = await getNextQuestion({ ...interview, answers: updatedAnswers });
    
    if (next === 'COMPLETE') {
      handleGenerate(updatedAnswers);
    } else {
      setInterview(prev => ({ ...prev, currentQuestion: next }));
      setIsTyping(false);
    }
  };

  const handleGenerate = async (answers: { question: string; answer: string }[]) => {
    setAppState('generating');
    const result = await generateOutput({ ...interview, answers });
    setFinalResult(result);
    setAppState('result');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setAppState('landing');
    setShowCards(false);
    setLandingStep(0);
    setInterview({ type: '', answers: [], currentQuestion: '', isComplete: false });
    setFinalResult('');
    setUserInput('');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-mani-yellow selection:text-black flex flex-col">
      {/* Mani Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-dark z-50">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
            <PixelMascot className="w-8 h-8 text-mani-yellow" isSmiling={isMascotSmiling} />
            <span className="font-pixel text-sm md:text-lg tracking-widest text-mani-yellow uppercase">Mani</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors text-mani-yellow"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {appState !== 'landing' && (
              <button 
                onClick={reset}
                className="text-[8px] md:text-[10px] font-pixel text-mani-yellow hover:underline flex items-center gap-2 uppercase tracking-widest"
              >
                <ArrowLeft className="w-3 h-3" /> <span className="hidden sm:inline">Back to Start</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24 pb-20 px-6 max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {appState === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-24 py-12"
            >
              <div className="text-center space-y-10 max-w-4xl mx-auto">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-3 px-4 py-2 bg-mani-yellow/5 rounded-full border border-mani-yellow/10 mb-4"
                >
                  <Sparkles className="w-4 h-4 text-mani-yellow" />
                  <span className="text-[10px] font-pixel uppercase tracking-[0.2em] text-mani-yellow">Your Story, Perfectly Told</span>
                </motion.div>
                
                <h1 className="text-[40px] md:text-[84px] font-pixel leading-[1.1] uppercase tracking-tighter">
                  Win more clients <br />
                  <span className="text-mani-yellow text-[32px] md:text-[64px]">with MANI.</span>
                </h1>
                
                <p className="text-[16px] md:text-[20px] opacity-70 font-medium leading-relaxed max-w-2xl mx-auto">
                  Mani is an AI assistant that helps freelancers craft winning proposals, bios, and pitches in seconds.
                </p>

                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <PixelMascot className="w-24 h-24 text-mani-yellow" isSmiling={isMascotSmiling} />
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/40 blur-md rounded-full -z-10"
                    />
                  </div>
                  
                  {!showCards && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCards(true)}
                      className="px-10 py-5 bg-mani-yellow text-black rounded-2xl font-pixel text-[12px] uppercase tracking-widest shadow-2xl shadow-mani-yellow/20"
                    >
                      Talk to Mani
                    </motion.button>
                  )}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!showCards ? (
                  <motion.div 
                    key="slider"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-20 max-w-5xl mx-auto"
                  >
                    {/* Slider Section */}
                    <div className="flex flex-col gap-12">
                      <div className="relative h-[300px] md:h-[450px] flex items-center justify-center bg-mani-dark/30 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={landingStep}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1, y: -20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 120 }}
                            className="w-full max-w-lg px-6"
                          >
                            {LANDING_SLIDES[landingStep].ui}
                          </motion.div>
                        </AnimatePresence>
                        
                        {/* Background Glow */}
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.05, 0.1, 0.05]
                          }}
                          transition={{ duration: 8, repeat: Infinity }}
                          className="absolute inset-0 bg-mani-yellow blur-[120px] -z-10" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {LANDING_SLIDES.map((slide, i) => (
                          <button
                            key={i}
                            onClick={() => setLandingStep(i)}
                            className={`relative p-8 rounded-3xl transition-all duration-500 text-left group ${landingStep === i ? 'bg-mani-dark border-mani-border' : 'hover:bg-mani-dark/50 border-transparent'} border`}
                          >
                            <div className="space-y-4">
                              <div className={`font-pixel text-[10px] ${landingStep === i ? 'text-mani-yellow' : 'text-mani-text/30'}`}>
                                0{i + 1}
                              </div>
                              <h3 className={`text-[14px] md:text-[18px] font-pixel uppercase tracking-widest transition-colors ${landingStep === i ? 'text-mani-text' : 'text-mani-text/40 group-hover:text-mani-text/60'}`}>
                                {slide.title.split(' ')[0]} <br />
                                <span className={landingStep === i ? 'text-mani-yellow' : ''}>{slide.title.split(' ').slice(1).join(' ')}</span>
                              </h3>
                              {landingStep === i && (
                                <motion.div
                                  layoutId="active-bar"
                                  className="absolute bottom-0 left-8 right-8 h-1 bg-mani-yellow rounded-full"
                                />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scroll Indicator */}
                    <motion.div 
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex flex-col items-center gap-4 pt-12"
                    >
                      <div className="text-[10px] font-pixel text-mani-text/30 uppercase tracking-[0.2em]">Scroll to learn more</div>
                      <div className="w-px h-12 bg-mani-yellow/20" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="cards"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -20 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {OUTPUT_TYPES.map((type, i) => (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -8, borderColor: 'rgba(255, 214, 0, 0.4)' }}
                        onClick={() => startInterview(type.id)}
                        className="group relative p-8 bg-mani-dark rounded-3xl border border-white/5 transition-all text-left overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <type.icon className="w-24 h-24 text-mani-yellow" />
                        </div>
                        <div className="w-12 h-12 bg-mani-yellow rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-mani-yellow/10">
                          <type.icon className="text-black w-6 h-6" />
                        </div>
                        <h3 className="text-[16px] font-pixel mb-3 uppercase tracking-widest">{type.id}</h3>
                        <p className="text-[14px] opacity-70 leading-relaxed font-medium relative z-10">
                          {type.description}
                        </p>
                        <div className="mt-8 flex items-center text-[10px] font-pixel text-mani-yellow opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                          Start Writing <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* How it works */}
              <div className="pt-20 border-t border-mani-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="space-y-4">
                    <div className="text-[10px] font-pixel text-mani-yellow uppercase tracking-widest">Step 01</div>
                    <h4 className="text-[18px] font-pixel uppercase tracking-widest text-mani-text">Choose a Goal</h4>
                    <p className="text-mani-text/50 text-[14px] leading-relaxed">Pick what you want to write—from a startup pitch to a professional bio.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-pixel text-mani-yellow uppercase tracking-widest">Step 02</div>
                    <h4 className="text-[18px] font-pixel uppercase tracking-widest text-mani-text">Chat with Mani</h4>
                    <p className="text-mani-text/50 text-[14px] leading-relaxed">Answer a few simple questions about your project or yourself.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-pixel text-mani-yellow uppercase tracking-widest">Step 03</div>
                    <h4 className="text-[18px] font-pixel uppercase tracking-widest text-mani-text">Get Your Result</h4>
                    <p className="text-mani-text/50 text-[14px] leading-relaxed">Mani generates a polished, professional document ready to share.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {appState === 'interviewing' && (
            <motion.div 
              key="interview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-[calc(100vh-16rem)] max-w-4xl mx-auto"
            >
              <div className="flex-1 overflow-y-auto space-y-10 pr-4 hide-scrollbar">
                {interview.answers.map((item, i) => (
                  <React.Fragment key={i}>
                    <div className="flex justify-start">
                      <div className="flex gap-4 max-w-[90%]">
                        <div className="mt-1">
                          <PixelMascot className="w-8 h-8 text-mani-yellow" isIdle={false} />
                        </div>
                      <div className="bg-mani-dark p-6 rounded-3xl rounded-tl-none border border-mani-border">
                        <p className="text-[10px] font-pixel text-mani-yellow uppercase tracking-widest mb-3">Mani</p>
                        <p className="text-[17px] leading-relaxed font-medium text-mani-text">{item.question}</p>
                      </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-mani-yellow text-black p-6 rounded-3xl rounded-tr-none max-w-[90%] shadow-xl shadow-mani-yellow/20">
                        <p className="text-[10px] font-pixel opacity-50 uppercase tracking-widest mb-3">You</p>
                        <p className="text-[17px] leading-relaxed font-bold">{item.answer}</p>
                      </div>
                    </div>
                  </React.Fragment>
                ))}

                {interview.currentQuestion && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-4 max-w-[90%]">
                      <div className="mt-1">
                        <PixelMascot className="w-8 h-8 text-mani-yellow" isIdle={true} />
                      </div>
                      <div className="bg-mani-dark p-6 rounded-3xl rounded-tl-none border border-mani-border">
                        <p className="text-[10px] font-pixel text-mani-yellow uppercase tracking-widest mb-3">Mani</p>
                        <p className="text-[17px] leading-relaxed font-medium text-mani-text">{interview.currentQuestion}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isTyping && (
                  <div className="flex justify-start pl-12">
                <div className="bg-mani-dark px-4 py-3 rounded-2xl border border-mani-border flex gap-2">
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-2 bg-mani-yellow rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2 h-2 bg-mani-yellow rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2 h-2 bg-mani-yellow rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-10 relative">
                <div className="absolute -top-8 left-0 text-[10px] font-pixel text-mani-text/50 uppercase tracking-widest">
                  {interview.answers.length} of 8 Questions
                </div>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your answer here..."
                  className="w-full bg-mani-dark border border-mani-border rounded-3xl py-5 pl-8 pr-20 focus:outline-none focus:border-mani-yellow focus:ring-4 focus:ring-mani-yellow/5 transition-all text-[17px] text-mani-text placeholder:text-mani-text/30 shadow-2xl"
                />
                <button
                  onClick={handleSend}
                  disabled={!userInput.trim() || isTyping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-mani-yellow text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {appState === 'generating' && (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 space-y-12"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-24 h-24 border-4 border-mani-border border-t-mani-yellow rounded-full"
                />
                <PixelMascot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-mani-yellow" isSmiling={true} />
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-[20px] font-pixel text-mani-text uppercase tracking-[0.3em]">Writing your story</h2>
                <p className="text-[12px] font-pixel text-mani-text/50 uppercase tracking-widest">Polishing every word for perfection...</p>
              </div>
            </motion.div>
          )}
  {appState === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 max-w-5xl mx-auto"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-mani-yellow text-black font-pixel text-[10px] uppercase tracking-widest rounded-full">
                    <Check className="w-3 h-3" /> Ready for use
                  </div>
                  <h2 className="text-[32px] md:text-[48px] font-pixel tracking-tighter uppercase text-mani-text">{interview.type}</h2>
                  <p className="text-[14px] opacity-50 font-medium uppercase tracking-widest text-mani-text">Crafted by Mani</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-3 px-8 py-4 bg-mani-yellow text-black rounded-2xl hover:bg-white transition-all font-pixel text-[12px] uppercase tracking-widest shadow-xl"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                  <button
                    onClick={reset}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl hover:bg-mani-yellow transition-all font-pixel text-[12px] uppercase tracking-widest shadow-xl"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Project
                  </button>
                </div>
              </div>
 
              {/* Paper-like document editor */}
              <div
                id="mani-output"
                style={{
                  background: '#FFFDF7',
                  borderRadius: '4px',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="p-8 md:p-16"
              >
                {/* Paper top strip */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#E8A020' }} />
 
                {/* Paper holes */}
                <div style={{ position: 'absolute', top: '32px', left: '28px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F0EDE0', border: '1px solid #E0DDD0' }} />
                  ))}
                </div>
 
                {/* Document content */}
                <div style={{ paddingLeft: '24px' }}>
                  {/* Document header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #E8E4D8' }}>
                    <div>
                      <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#B0A990', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'monospace' }}>MANI — AI Document</div>
                      <div style={{ fontSize: '22px', fontWeight: '600', color: '#1A1A1A', letterSpacing: '-0.3px' }}>{interview.type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#B0A990', fontFamily: 'monospace' }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <div style={{ width: '40px', height: '2px', background: '#E8A020', marginTop: '8px', marginLeft: 'auto' }} />
                    </div>
                  </div>
 
                  {/* Document body */}
                  <div style={{ fontFamily: 'Georgia, serif' }}>
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px', marginTop: '32px', letterSpacing: '-0.2px' }} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '12px', marginTop: '28px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'sans-serif' }} {...props} />,
                        p: ({node, ...props}) => <p style={{ fontSize: '16px', lineHeight: '1.9', color: '#2C2C2C', marginBottom: '20px' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ fontSize: '15px', lineHeight: '1.8', color: '#2C2C2C', marginBottom: '8px' }} {...props} />,
                        strong: ({node, ...props}) => <strong style={{ color: '#1A1A1A', fontWeight: '700' }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ paddingLeft: '20px', marginBottom: '20px' }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ paddingLeft: '20px', marginBottom: '20px' }} {...props} />,
                      }}
                    >
                      {finalResult}
                    </ReactMarkdown>
                  </div>
 
                  {/* Document footer */}
                  <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #E8E4D8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#C0BB9E', fontFamily: 'monospace', letterSpacing: '0.1em' }}>Generated by MANI · maniai.vercel.app</div>
                    <div style={{ width: '24px', height: '24px', background: '#0B2B5C', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#E8A020', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>M</span>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Action buttons */}
              <div className="flex flex-wrap gap-6 justify-center">
                <button
                  onClick={async () => {
                    const { default: jsPDF } = await import('jspdf');
                    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
                    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                    
                    doc.setFillColor(255, 253, 247);
                    doc.rect(0, 0, 210, 297, 'F');
                    doc.setFillColor(232, 160, 32);
                    doc.rect(0, 0, 210, 3, 'F');
                    
                    doc.setFontSize(8);
                    doc.setTextColor(176, 169, 144);
                    doc.text('MANI — AI DOCUMENT', 20, 15);
                    doc.setFontSize(16);
                    doc.setTextColor(26, 26, 26);
                    doc.setFont('helvetica', 'bold');
                    doc.text(interview.type.toUpperCase(), 20, 25);
                    doc.setFontSize(8);
                    doc.setTextColor(176, 169, 144);
                    doc.setFont('helvetica', 'normal');
                    doc.text(today, 160, 25);
                    doc.setDrawColor(232, 228, 216);
                    doc.line(20, 30, 190, 30);
                    
                    const clean = finalResult.replace(/[#*`]/g, '').replace(/\n{3,}/g, '\n\n');
                    doc.setFontSize(11);
                    doc.setTextColor(44, 44, 44);
                    const lines = doc.splitTextToSize(clean, 165);
                    doc.text(lines, 20, 42);
                    
                    doc.setFontSize(8);
                    doc.setTextColor(176, 169, 144);
                    doc.text('Generated by MANI · maniai.vercel.app', 20, 285);
                    
                    doc.save(`${interview.type.replace(/\s+/g, '-')}-mani.pdf`);
                  }}
                  className="flex items-center gap-2 text-[10px] md:text-[11px] font-pixel text-mani-text/50 hover:text-mani-yellow transition-colors uppercase tracking-widest"
                >
                  <Download className="w-4 h-4" /> Save as PDF
                </button>
                <button
                  onClick={() => {
                    const encoded = btoa(encodeURIComponent(finalResult));
                    const shareUrl = `${window.location.origin}?result=${encoded}&type=${encodeURIComponent(interview.type)}`;
                    if (navigator.share) {
                      navigator.share({ title: `My ${interview.type} — MANI`, text: `Check out my ${interview.type} created with MANI`, url: shareUrl });
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      alert('Share link copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-2 text-[10px] md:text-[11px] font-pixel text-mani-text/50 hover:text-mani-yellow transition-colors uppercase tracking-widest"
                >
                  <Share2 className="w-4 h-4" /> Share Link
                </button>
              </div>
            </motion.div>
          )}
 
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-mani-border">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-pixel text-mani-text/50 uppercase tracking-widest">
            <span>© {new Date().getFullYear()} MANI</span>
            <span className="mx-2">•</span>
            <span>Made with</span>
            <Heart className="w-3 h-3 text-mani-yellow fill-mani-yellow" />
            <span>by Henry</span>
          </div>
          <div className="text-[8px] font-pixel text-mani-text/20 uppercase tracking-[0.3em]">
            Your AI Freelance Partner
          </div>
        </div>
      </footer>
    </div>
  );
}
