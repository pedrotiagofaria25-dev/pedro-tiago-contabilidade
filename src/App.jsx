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
            <div className="contact-buttons">
              <a
                href="https://wa.me/5562999948445?text=Olá! Sou o Pedro Tiago, encontrei seu site e gostaria de conhecer melhor seus serviços de contabilidade. Pode me ajudar?"
                className="whatsapp-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 WhatsApp (62) 99994-8445
              </a>
              <a
                href="mailto:pedrotiago@pedrotiagocontabilidade.com.br?subject=Interesse em Serviços Contábeis&body=Olá Pedro Tiago,%0D%0A%0D%0AGostaria de saber mais sobre seus serviços de contabilidade.%0D%0A%0D%0AMinha empresa/situação:%0D%0A- Ramo de atividade:%0D%0A- Porte da empresa:%0D%0A- Principais necessidades:%0D%0A%0D%0AAguardo seu retorno!%0D%0A%0D%0AAtenciosamente"
                className="email-btn"
              >
                📧 Email Profissional
              </a>
            </div>
            <div className="communication-note">
              <p>💼 <strong>Atendimento 100% personalizado</strong></p>
              <p>📱 Resposta rápida via WhatsApp e Email</p>
              <p>⏰ Segunda a Sexta: 8h às 18h</p>
            </div>
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