import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🏢 Pedro Tiago Contabilidade</h1>
        <p>Soluções Contábeis Inteligentes</p>
        <div className="hero-section">
          <h2>CRC GO-027770/O</h2>
          <p>Especialista em Contabilidade Digital e Automação Fiscal</p>

          <div className="services">
            <div className="service-card">
              <h3>💼 Contabilidade Digital</h3>
              <p>Modernização completa dos processos contábeis</p>
            </div>

            <div className="service-card">
              <h3>🤖 Automação Fiscal</h3>
              <p>SPED, NFe, NFCe automatizados</p>
            </div>

            <div className="service-card">
              <h3>📊 Relatórios Inteligentes</h3>
              <p>Dashboards e análises em tempo real</p>
            </div>
          </div>

          <div className="contact-info">
            <p>📍 Goiânia, GO - Brasil</p>
            <p>🌐 www.pedrotiagocontabilidade.com.br</p>
            <p>📧 pedrotiago@pedrotiagocontabilidade.com.br</p>
          </div>

          <div className="tech-stack">
            <h3>🛠️ Tecnologias</h3>
            <div className="tech-badges">
              <span className="badge">React</span>
              <span className="badge">Node.js</span>
              <span className="badge">Python</span>
              <span className="badge">Calima Web</span>
              <span className="badge">Makrosystem</span>
            </div>
          </div>

          <div className="status">
            <p>✅ Sistema Otimizado e Pronto para Uso!</p>
            <p>🚀 Deploy automático configurado</p>
            <p>⚡ Performance Lighthouse 95+</p>
          </div>
        </div>
      </header>
    </div>
  )
}

export default App