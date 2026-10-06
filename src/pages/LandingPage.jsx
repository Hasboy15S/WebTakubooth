import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Clean Outline SVG Icons ──────────────────────────────────────────────────
function IconCamera({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function IconSparkle({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18m9-9H3m15.36-6.36L5.64 17.64m0-11.28l12.72 11.28" />
    </svg>
  )
}

function IconFilm({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
      <line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  )
}

function IconWand({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2m0 16v-2M8 9h2m10 0h-2m-2.2-4.8l-1.4 1.4M6.6 15.4l-1.4 1.4m11.6 0l-1.4-1.4M6.6 6.6L5.2 8" />
      <path d="M2 22l10-10" />
    </svg>
  )
}

function IconHand({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v7" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8a7 7 0 0 0 14 0v-3a2 2 0 0 0-2-2z" />
    </svg>
  )
}

// ── Layout & Frame Configs ──────────────────────────────────────────────────
const LAYOUT_OPTIONS = [
  { value: 2, label: '2 Foto', desc: 'Mini Duo Strip', preview: [1, 2] },
  { value: 4, label: '4 Foto', desc: 'Classic 4-Cuts', preview: [1, 2, 3, 4] },
  { value: 6, label: '6 Foto', desc: 'Grid 2x3 Strip', preview: [1, 2, 3, 4, 5, 6] },
]

const TIMER_OPTIONS = [
  { value: 3,  label: '3 Detik',  desc: 'Cepat & Spontan' },
  { value: 5,  label: '5 Detik',  desc: 'Ideal Buat Pose' },
  { value: 10, label: '10 Detik', desc: 'Santai Bareng Rombongan' },
]

const FRAME_PRESETS = [
  { id: 'cyan',     name: 'Cyan Studio',   color: '#0b162c', border: '#22d3ee', text: '#38bdf8' },
  { id: 'pastel',   name: 'Pastel Dream',  color: '#f0f9ff', border: '#7dd3fc', text: '#0284c7' },
  { id: 'film',     name: 'Film Noir',     color: '#0f172a', border: '#334155', text: '#f8fafc' },
  { id: 'minimal',  name: 'Minimal White', color: '#ffffff', border: '#e2e8f0', text: '#0f172a' },
  { id: 'polaroid', name: 'Polaroid Warm', color: '#fffdf7', border: '#fef08a', text: '#854d0e' },
  { id: 'neon',     name: 'Neon Cyber',    color: '#080d1a', border: '#06b6d4', text: '#22d3ee' },
]

export default function LandingPage({ onStart }) {
  const [showConfig, setShowConfig] = useState(false)
  const [layout,     setLayout]     = useState(4)
  const [timer,      setTimer]      = useState(3)
  const [activeFrame, setActiveFrame] = useState(FRAME_PRESETS[0])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="relative min-h-dvh flex flex-col w-full overflow-hidden bg-[#070b14] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Diffused Cyan & Deep Navy Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-cyan-500/12 via-blue-600/6 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-0 w-[500px] h-[450px] bg-gradient-to-l from-blue-600/8 via-cyan-500/4 to-transparent blur-[130px] pointer-events-none" />

      {/* ── 1. Clean Minimalist Header ───────────────────────────────────── */}
      <header className="relative z-50 w-full border-b border-cyan-500/10 bg-[#070b14]/80 backdrop-blur-xl sticky top-0">
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 h-20 md:h-24 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shadow-md shadow-cyan-500/15">
              <IconCamera className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight text-white font-body">
                takubooth<span className="text-cyan-400">.studio</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#fitur" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Fitur</a>
            <a href="#showcase" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Showcase</a>
            <a href="#cara-pakai" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Cara Pakai</a>
          </nav>

          {/* Desktop CTA & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowConfig(true)}
              className="hidden sm:block px-6 py-2.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-sm font-semibold text-cyan-300 hover:text-white transition-all cursor-pointer"
            >
              Mulai Sesi
            </button>
            
            {/* Mobile Hamburger Button */}
            <button 
              className="md:hidden p-2 text-slate-300 hover:text-cyan-400 focus:outline-none cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden absolute top-full left-0 w-full bg-[#070b14]/95 backdrop-blur-xl border-b border-cyan-500/10 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="flex flex-col px-6 py-6 gap-5">
                <a href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Fitur</a>
                <a href="#showcase" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Showcase</a>
                <a href="#cara-pakai" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Cara Pakai</a>
                <div className="h-px w-full bg-cyan-500/10 my-1" />
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowConfig(true);
                  }}
                  className="w-full px-6 py-3.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-base font-semibold text-cyan-300 transition-all cursor-pointer text-center"
                >
                  Mulai Sesi Sekarang
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── 2. Spacious Hero Section (Inspired by fotokita.space) ─────────── */}
      <section className="relative z-20 px-4 md:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32 max-w-[1200px] mx-auto w-full flex flex-col justify-center min-h-[85vh]">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full">
          {/* LEFT: Text & CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Top Centered Pill Badge */}
            <motion.div
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-xs sm:text-sm font-semibold text-cyan-300 mb-6 sm:mb-8 shadow-sm"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-base">📸</span>
              <span>virtual photobox studio — v2.0</span>
              <span className="text-base">✨</span>
            </motion.div>

            {/* Big Bold Headline with Slanted Cyan Highlight Capsule */}
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white leading-tight flex flex-col items-center lg:items-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <span>bikin photo strip</span>
              <span className="inline-block my-4 px-6 sm:px-8 py-2 sm:py-3 rounded-[2rem] bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 font-black shadow-2xl shadow-cyan-500/35 transition-transform lg:-ml-2">
                lucu & aesthetic
              </span>
              <span>di mana aja.</span>
            </motion.h1>

            {/* Sub-headline Text with Generous Margin */}
            <motion.p
              className="mt-6 mb-8 max-w-lg mx-auto lg:mx-0 text-lg sm:text-xl text-slate-300 leading-relaxed font-normal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Tanpa antri atau install aplikasi. Cukup angkat pose peace berdua, 4 kali cekrek otomatis, langsung pilih bingkai &amp; simpan!
            </motion.p>

            {/* Big Primary Pill Button */}
            <motion.div
              className="flex flex-col items-center lg:items-start gap-5 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <button
                onClick={() => setShowConfig(true)}
                className="px-10 sm:px-12 py-5 sm:py-6 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-lg sm:text-xl tracking-wide shadow-2xl shadow-cyan-500/35 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-slate-950/25 flex items-center justify-center text-sm text-slate-950 group-hover:scale-110 transition-transform font-black">
                  ▶
                </span>
                <span>Mulai Sesi Foto Now</span>
                <span className="text-2xl">📸</span>
                <span className="text-slate-950 font-black group-hover:translate-x-1.5 transition-transform text-xl">
                  →
                </span>
              </button>

              {/* Trust Social Proof Pill */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-sm text-slate-400 font-medium mt-2">
                <span className="text-amber-400 text-lg">🔥</span>
                <span>100% Client-Side &amp; Gratis · Privat Tanpa Upload Server</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Mockup Visual */}
          <motion.div 
            className="flex justify-center lg:justify-end relative mt-12 lg:mt-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="relative group perspective-1000">
              {/* Cyan Glow Effect */}
              <div className="absolute inset-0 bg-cyan-500/20 blur-[70px] rounded-full scale-110 group-hover:bg-cyan-400/30 transition-all duration-500" />
              
              {/* Photostrip Mockup Card */}
              <div className="relative z-10 w-[240px] sm:w-[280px] rounded-2xl p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] bg-[#ffffff] border-4 border-[#e2e8f0] rotate-3 group-hover:rotate-1 hover:scale-[1.02] transition-all duration-500 ease-out">
                {/* Washi Tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-cyan-200/50 backdrop-blur-sm border-x-2 border-dashed border-white/60 rounded-xs shadow-sm z-10 -rotate-2" />
                
                {/* Header */}
                <div className="flex items-center justify-between px-1.5 pt-1 pb-2">
                  <span className="text-[10px] font-black tracking-widest uppercase font-mono text-[#0f172a]">TAKUSTUDIO</span>
                  <span className="text-[9px] font-mono opacity-80 text-[#0f172a]">2026.10.06</span>
                </div>
                
                {/* Image */}
                <div className="rounded-xl overflow-hidden border border-black/15 bg-slate-950 shadow-inner">
                  <img src="/sample-strip-2.jpg" alt="Photobooth Preview" className="w-full object-cover" />
                </div>
                
                {/* Footer */}
                <div className="pt-2 pb-1 text-center">
                  <p className="font-serif italic font-bold text-sm tracking-wide text-[#0f172a]">Best Friends Forever ✨</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── 3. Four Clean Feature Preview Pills (Like fotokita.space bottom) ── */}
        <motion.div
          id="fitur"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full max-w-6xl mx-auto mt-20 pt-12 border-t border-cyan-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { icon: <IconCamera className="w-6 h-6 text-cyan-400" />, title: '4-Cuts & Duo', desc: 'Layout 2, 4, atau 6 foto' },
            { icon: <IconFilm className="w-6 h-6 text-blue-400" />,   title: '6 Bingkai Estetik', desc: 'Cyan, Pastel, Film Noir' },
            { icon: <IconWand className="w-6 h-6 text-sky-400" />,   title: 'AI Background', desc: 'Ganti latar otomatis' },
            { icon: <IconHand className="w-6 h-6 text-teal-400" />,  title: 'Gesture Snap', desc: 'Pose peace ✌️ jepret' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-cyan-500/30 transition-all text-center flex flex-col items-center justify-between"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-6 shadow-inner">
                {item.icon}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </section>

      {/* ── 4. Showcase Section (Realistic Photostrip Mockup) ─────────────── */}
      <section id="showcase" className="relative z-20 px-4 md:px-6 lg:px-8 py-20 md:py-28 max-w-[1200px] mx-auto w-full border-t border-cyan-500/10">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <span className="block mb-3 text-sm font-mono uppercase tracking-widest text-cyan-400 font-bold">
            HASIL PHOTOSTRIP REALISTIS
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mt-4 mb-6 leading-tight">
            Kualitas Studio Nyata di Setiap Jepretan.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Pilih warna bingkai favoritmu dan lihat bagaimana photostrip kamu terlihat siap cetak maupun disimpan sebagai GIF animasi.
          </p>
        </div>

        {/* Centerpiece Showcase Container */}
        <div className="flex flex-col items-center">
          
          {/* Main Photostrip Card */}
          <div
            className="relative w-[260px] sm:w-[290px] rounded-2xl p-3.5 shadow-2xl transition-all duration-300"
            style={{
              backgroundColor: activeFrame.color,
              border: `4px solid ${activeFrame.border}`,
              boxShadow: `0 25px 60px -15px rgba(0,0,0,0.85), 0 0 35px -5px ${activeFrame.border}40`,
            }}
          >
            {/* Washi Tape Header */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-cyan-200/50 backdrop-blur-sm border-x-2 border-dashed border-white/60 rounded-xs shadow-sm z-10 -rotate-1" />

            {/* Strip Top Header */}
            <div className="flex items-center justify-between px-1.5 pt-1 pb-2">
              <span className="text-[10px] font-black tracking-widest uppercase font-mono" style={{ color: activeFrame.text }}>
                TAKUSTUDIO
              </span>
              <span className="text-[9px] font-mono opacity-80" style={{ color: activeFrame.text }}>
                2026.10.06
              </span>
            </div>

            {/* Photos Container */}
            <div className="rounded-xl overflow-hidden border border-black/15 bg-slate-950 shadow-inner">
              <img
                src="/sample-strip-2.jpg"
                alt="Aesthetic Photostrip Sample"
                className="w-full object-cover"
              />
            </div>

            {/* Strip Footer */}
            <div className="pt-3 pb-1 text-center">
              <p className="font-serif italic font-bold text-sm tracking-wide" style={{ color: activeFrame.text }}>
                Best Friends Forever ✨
              </p>
              <p className="text-[8px] font-mono tracking-widest uppercase opacity-75 mt-0.5" style={{ color: activeFrame.text }}>
                KOREAN PHOTO STUDIO
              </p>
            </div>
          </div>

          {/* Interactive Frame Selector Pills */}
          <div className="mt-14 flex flex-col items-center gap-4">
            <span className="text-sm text-slate-400 font-semibold">Pilih Vibe Bingkai:</span>
            <div className="flex items-center gap-3 flex-wrap justify-center p-2 rounded-full bg-slate-900/90 border border-slate-800">
              {FRAME_PRESETS.map(frame => (
                <button
                  key={frame.id}
                  onClick={() => setActiveFrame(frame)}
                  className={`text-sm px-5 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                    activeFrame.id === frame.id
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 scale-105'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {frame.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. How It Works (3 Steps Spacious Section) ────────────────────── */}
      <section id="cara-pakai" className="relative z-20 px-4 md:px-6 lg:px-8 py-20 md:py-28 max-w-[1200px] mx-auto w-full border-t border-cyan-500/10">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <span className="block mb-3 text-sm font-mono uppercase tracking-widest text-cyan-400 font-bold">
            CARA PAKAI MUDAH
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mt-4 mb-6 leading-tight">
            Cuma 3 Langkah Gampang.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Nggak perlu ribet setting. Siapkan gayamu dan langsung jepret.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl mx-auto">
          {[
            {
              num: '01',
              title: 'Atur Strip & Timer',
              desc: 'Pilih jumlah foto (2, 4, atau 6 cuts) dan tentukan durasi countdown jeda pose (3s, 5s, atau 10s).',
              badge: 'Setup Cepat',
            },
            {
              num: '02',
              title: 'Pose & Jepret Hands-Free',
              desc: 'Ganti background sesuai seleramu, lalu cukup pose dua jari (peace ✌️) ke kamera untuk jepret otomatis!',
              badge: 'Gesture ✌️',
            },
            {
              num: '03',
              title: 'Hias & Simpan Hasil',
              desc: 'Ganti tema warna frame, tempel stiker lucu, lalu download sebagai PNG kualitas tinggi atau GIF animasi.',
              badge: 'Export HD',
            },
          ].map(st => (
            <div
              key={st.num}
              className="px-6 py-8 md:px-10 md:py-12 rounded-[2rem] bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col items-center text-center justify-between"
            >
              <div>
                <div className="flex flex-col items-center gap-4 mb-8">
                  <span className="text-5xl font-black font-mono text-cyan-400">{st.num}</span>
                  <span className="text-xs font-mono px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {st.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{st.title}</h3>
                <p className="text-base text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Final Call To Action ───────────────────────────────────────── */}
      <section className="relative z-20 px-4 md:px-6 lg:px-8 py-20 md:py-28 text-center max-w-[1200px] mx-auto w-full">
        <div className="px-6 py-12 sm:px-12 sm:py-20 rounded-[3rem] bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/25 relative overflow-hidden shadow-2xl flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />
          
          <span className="text-6xl mb-8 inline-block">📸</span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mt-4 mb-6 leading-tight">
            Yuk, Bikin Kenangan Seru Bareng!
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed">
            Gratis 100%, tanpa antre, dan tanpa server pengumpul data. Langsung buka browsermu sekarang.
          </p>
          
          <button
            onClick={() => setShowConfig(true)}
            className="px-12 py-5 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-lg tracking-wide shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3 cursor-pointer"
          >
            <span>Mulai Sesi Foto Sekarang</span>
            <span className="text-xl">→</span>
          </button>
        </div>
      </section>

      {/* ── 7. Clean Minimalist Footer ────────────────────────────────────── */}
      <footer className="relative z-20 border-t border-cyan-500/10 bg-[#060911] py-12 px-6 text-sm text-slate-500">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="font-bold text-slate-300">takubooth.studio</span>
            <span className="hidden sm:inline">— Virtual Photobox Studio · 100% Client-Side</span>
          </div>
          <span className="sm:hidden">— Virtual Photobox Studio · 100% Client-Side</span>
          <p>© 2026 TakuBooth. Privat &amp; Aman.</p>
        </div>
      </footer>

      {/* ── 8. Configuration Setup Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfig(false)}
            />

            {/* Modal Dialog */}
            <motion.div
              className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 z-10 max-h-[90dvh] overflow-y-auto bg-[#0b1326] border border-cyan-500/30 shadow-2xl"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            >
              {/* Close Button */}
              <button
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center text-sm font-bold"
                onClick={() => setShowConfig(false)}
              >
                ✕
              </button>

              <div className="mb-6">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                  STUDIO SETUP
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Atur Sesi Photobox</h3>
                <p className="text-xs text-slate-400 mt-1">Pilih layout strip dan durasi jeda pose kamera.</p>
              </div>

              {/* 1. Layout Selector */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  1. Pilih Layout Strip
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {LAYOUT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setLayout(opt.value)}
                      className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                        layout === opt.value
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-lg shadow-cyan-500/15'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-8 mx-auto mb-2 p-1 rounded bg-black/40 border border-slate-700 flex flex-col gap-0.5">
                        {opt.preview.map(n => (
                          <div
                            key={n}
                            className={`w-full h-2 rounded-xs transition-colors ${
                              layout === opt.value ? 'bg-cyan-400' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <div className={`text-xs font-bold ${layout === opt.value ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {opt.label}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Timer Selector */}
              <div className="mb-7">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  2. Countdown Timer Antar Foto
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {TIMER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTimer(opt.value)}
                      className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        timer === opt.value
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-lg shadow-cyan-500/15'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`text-base font-extrabold ${timer === opt.value ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {opt.label}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                className="w-full py-4 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-extrabold text-sm tracking-wide shadow-xl shadow-cyan-500/30 transition-all cursor-pointer"
                onClick={() => onStart({ layout, timer })}
              >
                Lanjut ke Studio Kamera →
              </button>

              <p className="text-center text-[11px] text-slate-500 mt-3.5">
                Kamera akan meminta izin akses browser di langkah berikutnya.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
