import './FlowParagliders.css'

const FLOW_URL = 'https://www.flowparagliders.com.au/'

function FlowParagliders() {
  return (
    <section className="flow-section">
      <div className="flow-content">
        <span className="flow-badge">Dealer Oficial</span>
        <h2>Somos dealers da Flow Paragliders</h2>
        <p>
          A Happy Soaring é representante oficial da Flow Paragliders,
          uma marca de referência internacional em equipamento de parapente,
          reconhecida pela qualidade, segurança e desempenho.
        </p>
        <a
          className="flow-button"
          href={FLOW_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visitar Flow Paragliders
        </a>
      </div>
    </section>
  )
}

export default FlowParagliders
