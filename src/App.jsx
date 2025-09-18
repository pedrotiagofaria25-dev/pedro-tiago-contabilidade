import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [notificationPermission, setNotificationPermission] = useState('default')

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Verificar permissão de notificação
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        new Notification('Pedro Tiago Contabilidade', {
          body: '✅ Notificações ativadas! Você receberá avisos sobre novos leads e mensagens.',
          icon: '/favicon.svg'
        })
      }
    }
  }
  const [chatVisible, setChatVisible] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Olá! 👋 Sou o assistente virtual do Pedro Tiago Contabilidade. Como posso ajudar você?",
      sender: "bot",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')

  const botResponses = {
    'servicos': 'Oferecemos: Contabilidade Digital, Automação Fiscal (SPED, NFe), Consultoria Tributária, e Relatórios Inteligentes. Qual serviço te interessa mais?',
    'contato': 'Você pode me contatar via WhatsApp (62) 99994-8445 ou email pedrotiago@pedrotiagocontabilidade.com.br. Atendo de Segunda a Sexta, das 8h às 18h.',
    'precos': 'Os valores variam conforme o porte da empresa. Posso fazer uma cotação personalizada! Me fale sobre sua empresa: Ramo de atividade? Quantos funcionários?',
    'crc': 'Sou contador registrado no CRC-GO com número 027770/O. Tenho experiência em Contabilidade Digital e especialização em automação fiscal.',
    'digital': 'A Contabilidade Digital moderniza seus processos com: Calima Web, Makrosystem, automação de SPED, NFe eletrônica, e dashboards em tempo real.',
    'localizacao': 'Atendo em Goiânia-GO e região metropolitana. Também faço atendimentos online para todo o Brasil.',
    'default': 'Interessante! Para melhor atendê-lo, recomendo entrar em contato direto: WhatsApp (62) 99994-8445 ou email. Assim posso entender melhor suas necessidades específicas.'
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessage = {
      id: chatMessages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, newMessage])
    setInputMessage('')

    setTimeout(() => {
      const messageText = inputMessage.toLowerCase()
      let botResponse = botResponses.default

      Object.keys(botResponses).forEach(key => {
        if (messageText.includes(key) ||
            (key === 'servicos' && (messageText.includes('serviço') || messageText.includes('trabalho'))) ||
            (key === 'contato' && (messageText.includes('falar') || messageText.includes('conversar'))) ||
            (key === 'precos' && (messageText.includes('valor') || messageText.includes('custo') || messageText.includes('preço'))) ||
            (key === 'digital' && (messageText.includes('sistema') || messageText.includes('automação'))) ||
            (key === 'localizacao' && (messageText.includes('onde') || messageText.includes('local'))))
        {
          botResponse = botResponses[key]
        }
      })

      const botMessage = {
        id: chatMessages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, botMessage])
    }, 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

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
              <p>Modernização completa dos processos contábeis com tecnologia avançada</p>
              <div className="service-features">
                <span className="feature">• Calima Web</span>
                <span className="feature">• Makrosystem</span>
                <span className="feature">• Processos Online</span>
              </div>
            </div>

            <div className="service-card">
              <h3>🤖 Automação Fiscal</h3>
              <p>SPED, NFe, NFCe totalmente automatizados para sua empresa</p>
              <div className="service-features">
                <span className="feature">• SPED Automático</span>
                <span className="feature">• NFe Eletrônica</span>
                <span className="feature">• Compliance 100%</span>
              </div>
            </div>

            <div className="service-card">
              <h3>📊 Relatórios Inteligentes</h3>
              <p>Dashboards e análises financeiras em tempo real</p>
              <div className="service-features">
                <span className="feature">• BI Integrado</span>
                <span className="feature">• KPIs Financeiros</span>
                <span className="feature">• Visão 360°</span>
              </div>
            </div>

            <div className="service-card">
              <h3>📈 Consultoria Especializada</h3>
              <p>Planejamento tributário e otimização fiscal personalizada</p>
              <div className="service-features">
                <span className="feature">• Redução Impostos</span>
                <span className="feature">• Enquadramento</span>
                <span className="feature">• Estratégias Fiscais</span>
              </div>
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
              <p>💬 Assistente virtual disponível 24/7</p>
              <p>⏰ Segunda a Sexta: 8h às 18h</p>
            </div>

            <div className="action-buttons">
              <button
                className="chat-toggle-btn"
                onClick={() => setChatVisible(!chatVisible)}
              >
                {chatVisible ? '❌ Fechar Chat' : '💬 Chat Online'}
              </button>

              {notificationPermission !== 'granted' && (
                <button
                  className="notification-btn"
                  onClick={requestNotificationPermission}
                >
                  🔔 Ativar Notificações
                </button>
              )}

              {notificationPermission === 'granted' && (
                <div className="notification-status">
                  ✅ Notificações Ativadas
                </div>
              )}
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

      {/* Chat Widget */}
      {chatVisible && (
        <div className="chat-widget">
          <div className="chat-header">
            <h4>💬 Assistente Virtual</h4>
            <button onClick={() => setChatVisible(false)} className="close-chat">×</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map(message => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-bubble">
                  {message.text}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="chat-input-field"
            />
            <button onClick={handleSendMessage} className="send-btn">Enviar</button>
          </div>
          <div className="chat-footer">
            <p>Para atendimento direto: <a href="https://wa.me/5562999948445">WhatsApp</a> ou <a href="mailto:pedrotiago@pedrotiagocontabilidade.com.br">Email</a></p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App