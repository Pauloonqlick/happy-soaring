import Slideshow from './components/Slideshow.jsx'
import FlowParagliders from './components/FlowParagliders.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

function App() {
  return (
    <div className="page">
      <header className="brand-header">
        <span className="brand-name">HAPPY SOARING</span>
      </header>

      <Slideshow />

      <main>
        <FlowParagliders />
      </main>

      <Footer />
    </div>
  )
}

export default App
