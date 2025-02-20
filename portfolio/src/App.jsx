import { useState } from 'react'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Contact from './components/Contact'
import DiscordStatus from './components/DiscordStatus'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Hero />
        <About />
        <Projects />
        <Contact />
        <div className="fixed bottom-4 right-4">
          <DiscordStatus />
        </div>
      </div>
    </div>
  )
}

export default App
