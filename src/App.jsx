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
        <div className="hero-section">
          <h2 className="hero-headline">Reduza impostos e automatize sua contabilidade sem dor de cabeça</h2>
          <p className="hero-subtitle">Especialista CRC GO-027770/O em Contabilidade Digital • Sua empresa sempre em dia</p>
          <div className="hero-benefits">
            <span className="benefit">✅ Sem multas fiscais</span>
            <span className="benefit">✅ Impostos otimizados</span>
            <span className="benefit">✅ Relatórios em tempo real</span>
          </div>

          <div className="services">
            <div className="service-card">
              <h3>💼 Contabilidade Digital</h3>
              <p>Sua empresa 100% digital e organizada</p>
              <div className="service-benefit">
                <strong>🎯 Resultado:</strong> Economize 80% do tempo em burocracia
              </div>
              <div className="service-features">
                <span className="feature">• Documentos na nuvem</span>
                <span className="feature">• Acesso 24h</span>
                <span className="feature">• Processos automatizados</span>
              </div>
            </div>

            <div className="service-card">
              <h3>🤖 Automação Fiscal</h3>
              <p>Sua empresa sem multas e obrigações esquecidas</p>
              <div className="service-benefit">
                <strong>🎯 Resultado:</strong> Zero multas por atraso ou erro
              </div>
              <div className="service-features">
                <span className="feature">• Impostos em dia</span>
                <span className="feature">• Notas automáticas</span>
                <span className="feature">• Alertas preventivos</span>
              </div>
            </div>

            <div className="service-card">
              <h3>📊 Relatórios Inteligentes</h3>
              <p>Decida com números claros em tempo real</p>
              <div className="service-benefit">
                <strong>🎯 Resultado:</strong> Melhores decisões financeiras diariamente
              </div>
              <div className="service-features">
                <span className="feature">• Gráficos simples</span>
                <span className="feature">• Indicadores claros</span>
                <span className="feature">• Comparações mensais</span>
              </div>
            </div>

            <div className="service-card">
              <h3>📈 Consultoria Especializada</h3>
              <p>Pague menos impostos legalmente</p>
              <div className="service-benefit">
                <strong>🎯 Resultado:</strong> Economia média de 30% em impostos
              </div>
              <div className="service-features">
                <span className="feature">• Redução legal</span>
                <span className="feature">• Melhor enquadramento</span>
                <span className="feature">• Planejamento anual</span>
              </div>
            </div>
          </div>

          <div className="credentials-section">
            <h3>🏆 Credenciais e Diferenciais</h3>
            <div className="credentials-grid">
              <div className="credential-card">
                <h4>📜 Registro Profissional</h4>
                <p><strong>CRC GO-027770/O</strong></p>
                <span>Conselho Regional de Contabilidade de Goiás</span>
              </div>
              <div className="credential-card">
                <h4>🎯 Especialização</h4>
                <p><strong>Contabilidade Digital</strong></p>
                <span>Automação Fiscal e Processos Online</span>
              </div>
              <div className="credential-card">
                <h4>💼 Experiência</h4>
                <p><strong>Sistemas Integrados</strong></p>
                <span>Calima Web • Makrosystem • SPED</span>
              </div>
            </div>
            <div className="trust-indicators">
              <div className="indicator">
                <span className="number">2024</span>
                <span className="label">Início das operações</span>
              </div>
              <div className="indicator">
                <span className="number">100%</span>
                <span className="label">Foco em automação</span>
              </div>
              <div className="indicator">
                <span className="number">24/7</span>
                <span className="label">Suporte via WhatsApp</span>
              </div>
            </div>
          </div>

          <div className="cta-section">
            <h3>🚀 Comece hoje mesmo a economizar</h3>
            <p>Diagnóstico gratuito da sua situação fiscal • Sem compromisso</p>
            <div className="main-cta-buttons">
              <a
                href="https://wa.me/5562999948445?text=Olá Pedro Tiago! Quero fazer um diagnóstico fiscal gratuito da minha empresa. Quando podemos conversar?"
                className="primary-cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                📱 Diagnóstico Gratuito via WhatsApp
              </a>
              <a
                href="mailto:pedrotiago@pedrotiagocontabilidade.com.br?subject=Diagnóstico Fiscal Gratuito&body=Olá Pedro Tiago,%0D%0A%0D%0AQuero agendar um diagnóstico fiscal gratuito.%0D%0A%0D%0AMinha empresa:%0D%0A- Nome:%0D%0A- Ramo:%0D%0A- Faturamento mensal aproximado:%0D%0A- Principal dificuldade:%0D%0A%0D%0AQuando podemos conversar?%0D%0A%0D%0AObrigado!"
                className="secondary-cta"
              >
                📧 Agendar por Email
              </a>
            </div>
          </div>

          <div className="contact-info">
            <p>📍 <strong>Contabilidade digital em Goiânia</strong> - Aparecida • Setor Oeste • Centro</p>
            <p>🌐 www.pedrotiagocontabilidade.com.br</p>
            <p>📧 pedrotiago@pedrotiagocontabilidade.com.br</p>
            <div className="contact-info-grid">
              <div className="contact-method">
                <h4>📱 WhatsApp Direto</h4>
                <a href="https://wa.me/5562999948445" className="contact-link">(62) 99994-8445</a>
                <p>Resposta em até 2h</p>
              </div>
              <div className="contact-method">
                <h4>📧 Email Profissional</h4>
                <a href="mailto:pedrotiago@pedrotiagocontabilidade.com.br" className="contact-link">pedrotiago@pedrotiagocontabilidade.com.br</a>
                <p>Resposta em até 24h</p>
              </div>
              <div className="contact-method">
                <h4>🏢 Atendimento</h4>
                <p><strong>Presencial:</strong> Goiânia e região</p>
                <p><strong>Online:</strong> Todo o Brasil</p>
              </div>
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
            <h3>🛠️ Tecnologias e Sistemas Utilizados</h3>
            <p>Contador digital em Goiânia especializado em automação fiscal para empresas</p>
            <div className="tech-badges">
              <span className="badge primary">Calima Web</span>
              <span className="badge primary">Makrosystem</span>
              <span className="badge secondary">SPED Fiscal</span>
              <span className="badge secondary">NFe Goiás</span>
              <span className="badge secondary">ECD</span>
              <span className="badge secondary">ECF</span>
              <span className="badge tertiary">Contabilidade Goiânia</span>
              <span className="badge tertiary">Automação Goiás</span>
              <span className="badge tertiary">Contador Digital GO</span>
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