import { useEffect, useState } from 'react'
import './Slideshow.css'

// Edit this array to change slide images/texts.
// Replace the images in /public/images/ with real photos (same file names, or update paths here).
const slides = [
  {
    id: 'slide-1',
    image: '/images/slide-1.jpg',
    title: 'Happy Soaring',
    subtitle: 'Voa mais alto. Voa mais feliz.',
  },
  {
    id: 'slide-2',
    image: '/images/slide-2.svg',
    title: 'Paixão pelo Parapente',
    subtitle: 'Equipamento e experiência para o teu voo.',
  },
  {
    id: 'slide-3',
    image: '/images/slide-3.svg',
    title: 'Dealers Oficiais Flow Paragliders',
    subtitle: 'Qualidade e segurança em cada voo.',
  },
  {
    id: 'slide-4',
    image: '/images/slide-4.jpg',
    noOverlay: true,
  },
]

const AUTOPLAY_MS = 5000

function Slideshow() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="slideshow" aria-label="Destaques Happy Soaring">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`slide ${index === active ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          {!slide.noOverlay && (
            <div className="slide-overlay">
              <h1>{slide.title}</h1>
              <p>{slide.subtitle}</p>
            </div>
          )}
        </div>
      ))}

      <div className="slide-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`slide-dot ${index === active ? 'is-active' : ''}`}
            aria-label={`Ir para o slide ${index + 1}`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  )
}

export default Slideshow
