import { useEffect, useState } from 'react'
import './Slideshow.css'

// Edit this array to change slide images/texts.
// Replace the images in /public/images/ with real photos (same file names, or update paths here).
// Slides without an `image` (desktop) field only appear on mobile.
const slides = [
  {
    id: 'slide-1',
    image: '/images/slide-1.svg',
    imageMobile: '/images/slide-1-mobile.svg',
    title: 'Happy Soaring',
    subtitle: 'Voa mais alto. Voa mais feliz.',
  },
  {
    id: 'slide-2',
    image: '/images/slide-2.svg',
    imageMobile: '/images/slide-2-mobile.svg',
    title: 'Paixão pelo Parapente',
    subtitle: 'Equipamento e experiência para o teu voo.',
  },
  {
    id: 'slide-3',
    image: '/images/slide-3.svg',
    imageMobile: '/images/slide-3-mobile.svg',
    title: 'Dealers Oficiais Flow Paragliders',
    subtitle: 'Qualidade e segurança em cada voo.',
  },
  {
    id: 'slide-4',
    // TODO: substituir por uma imagem landscape (1600x1000) quando existir; por agora reutiliza a imagem mobile em desktop.
    image: '/images/slide-4-mobile.jpg',
    imageMobile: '/images/slide-4-mobile.jpg',
    noOverlay: true,
  },
]

const AUTOPLAY_MS = 5000
const MOBILE_QUERY = '(max-width: 767px)'

function Slideshow() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  )
  const [active, setActive] = useState(0)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const visibleSlides = isMobile ? slides : slides.filter((slide) => slide.image)

  useEffect(() => {
    setActive(0)
  }, [isMobile])

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % visibleSlides.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [visibleSlides.length])

  return (
    <section className="slideshow" aria-label="Destaques Happy Soaring">
      {visibleSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`slide ${index === active ? 'is-active' : ''}`}
          style={{
            '--bg-desktop': slide.image ? `url(${slide.image})` : undefined,
            '--bg-mobile': `url(${slide.imageMobile})`,
          }}
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
        {visibleSlides.map((slide, index) => (
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
