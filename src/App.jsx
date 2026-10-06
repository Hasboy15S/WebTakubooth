import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage  from './pages/LandingPage'
import SessionPage  from './pages/SessionPage'
import ResultPage   from './pages/ResultPage'

/** Slide-in / slide-out page transition variants */
const PAGE = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.22 } },
}

/**
 * App — client-side state-machine router.
 * landing → session → result (→ landing or back to session for retake)
 */
export default function App() {
  const [page,    setPage]    = useState('landing')
  const [config,  setConfig]  = useState(null)
  const [photos,  setPhotos]  = useState([])

  const goSession = (cfg) => { setConfig(cfg);    setPage('session') }
  const goResult  = (pho) => { setPhotos(pho);    setPage('result')  }
  const goLanding = ()    => { setPhotos([]);     setPage('landing') }
  const goRetake  = ()    =>  setPage('session')

  return (
    <div className="min-h-dvh w-full overflow-x-hidden animated-bg">
      <AnimatePresence mode="wait">
        {page === 'landing' && (
          <motion.div key="landing" {...PAGE} className="min-h-dvh w-full">
            <LandingPage onStart={goSession} />
          </motion.div>
        )}

        {page === 'session' && (
          <motion.div key="session" {...PAGE} className="min-h-dvh w-full">
            <SessionPage
              config={config}
              onComplete={goResult}
              onCancel={goLanding}
            />
          </motion.div>
        )}

        {page === 'result' && (
          <motion.div key="result" {...PAGE} className="min-h-dvh w-full">
            <ResultPage
              photos={photos}
              config={config}
              onUpdatePhotos={setPhotos}
              onRetake={goRetake}
              onReset={goLanding}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
