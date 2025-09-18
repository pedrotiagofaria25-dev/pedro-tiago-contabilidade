// Pedro Tiago Contabilidade - Enhanced Interactive Features
document.addEventListener('DOMContentLoaded', function() {

    // ========== NAVIGATION & SMOOTH SCROLLING ==========

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header background on scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });

    // ========== CONTACT FORM HANDLING ==========

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;

            // Get form data
            const formData = new FormData(this);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Validate required fields
            const requiredFields = ['nome', 'email', 'telefone', 'servico'];
            let isValid = true;

            requiredFields.forEach(field => {
                const input = this.querySelector(`[name="${field}"]`);
                if (!data[field] || data[field].trim() === '') {
                    input.style.borderColor = '#e74c3c';
                    isValid = false;
                } else {
                    input.style.borderColor = '#25D366';
                }
            });

            if (!isValid) {
                showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            // Create WhatsApp message
            const message = `🏢 *Nova Solicitação do Site*

👤 *Nome:* ${data.nome}
📧 *Email:* ${data.email}
📱 *Telefone:* ${data.telefone}
⚙️ *Serviço:* ${getServiceName(data.servico)}
💬 *Mensagem:* ${data.mensagem || 'Não informado'}

_Solicitação enviada através do site pedrotiagocontabilidade.com.br_`;

            // Track the conversion
            trackConversion('form_submission', data.servico);

            // Redirect to WhatsApp
            setTimeout(() => {
                const whatsappUrl = `https://wa.me/5562999948445?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');

                // Reset form
                this.reset();
                showNotification('Redirecionando para WhatsApp...', 'success');

                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1000);
        });
    }

    // ========== UTILITY FUNCTIONS ==========

    function getServiceName(serviceValue) {
        const services = {
            'pessoa-fisica': 'Contabilidade Pessoa Física',
            'pessoa-juridica': 'Contabilidade Pessoa Jurídica',
            'consultoria': 'Consultoria Contábil',
            'outros': 'Outros Serviços'
        };
        return services[serviceValue] || serviceValue;
    }

    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: ${type === 'success' ? '#25D366' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            min-width: 300px;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });
    }

    // ========== ANALYTICS & TRACKING ==========

    function trackConversion(action, label = '') {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: 'engagement',
                event_label: label,
                value: 1
            });
        }

        // Facebook Pixel (if needed)
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_name: label
            });
        }

        console.log('Conversion tracked:', action, label);
    }

    // Track WhatsApp clicks
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.addEventListener('click', function() {
            trackConversion('whatsapp_click', this.textContent.trim());
        });
    });

    // Track email clicks
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', function() {
            trackConversion('email_click', this.href);
        });
    });

    // Track service card interactions
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            const serviceName = this.querySelector('h3').textContent;
            trackConversion('service_interest', serviceName);
        });
    });

    // ========== ANIMATIONS & INTERACTIONS ==========

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.service-card, .contact-item, .credential').forEach(el => {
        observer.observe(el);
    });

    // ========== MOBILE MENU (if needed in future) ==========

    // Mobile menu toggle functionality
    function createMobileMenu() {
        const nav = document.querySelector('.navbar .container');
        const navMenu = document.querySelector('.nav-menu');

        if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-toggle')) {
            // Create mobile toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'mobile-menu-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
            toggleBtn.style.cssText = `
                display: block;
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #2c3e50;
                cursor: pointer;
            `;

            // Insert before nav-contact
            const navContact = document.querySelector('.nav-contact');
            navContact.parentNode.insertBefore(toggleBtn, navContact);

            // Toggle functionality
            toggleBtn.addEventListener('click', function() {
                navMenu.classList.toggle('mobile-active');
            });
        }
    }

    // Call on load and resize
    createMobileMenu();
    window.addEventListener('resize', createMobileMenu);

    // ========== PERFORMANCE MONITORING ==========

    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                    console.log('LCP:', entry.startTime);
                }
            }
        }).observe({entryTypes: ['largest-contentful-paint']});

        // First Input Delay
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                console.log('FID:', entry.processingStart - entry.startTime);
            }
        }).observe({entryTypes: ['first-input']});
    }

    // ========== SECURITY ENHANCEMENTS ==========

    // Prevent right-click on sensitive elements (optional)
    // document.querySelectorAll('.credential, .contact-info').forEach(el => {
    //     el.addEventListener('contextmenu', e => e.preventDefault());
    // });

    // Input sanitization for form fields
    document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(input => {
        input.addEventListener('blur', function() {
            // Basic sanitization - remove script tags
            this.value = this.value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        });
    });

    // ========== ACCESSIBILITY ENHANCEMENTS ==========

    // Add keyboard navigation for cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Could trigger a service inquiry modal or WhatsApp link
                const serviceName = this.querySelector('h3').textContent;
                const message = `Olá! Tenho interesse no serviço: ${serviceName}. Gostaria de mais informações.`;
                const whatsappUrl = `https://wa.me/5562999948445?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            }
        });
    });

    // ========== FLOATING WHATSAPP ENHANCEMENTS ==========

    const whatsappFloat = document.querySelector('.whatsapp-float');
    if (whatsappFloat) {
        // Add pulse animation
        whatsappFloat.style.animation = 'pulse 2s infinite';

        // Add CSS for pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        // Hide on scroll down, show on scroll up
        let lastScrollTop = 0;
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > 300) {
                whatsappFloat.style.transform = 'translateY(100px)';
            } else {
                whatsappFloat.style.transform = 'translateY(0)';
            }
            lastScrollTop = scrollTop;
        });
    }

    // ========== INITIALIZATION COMPLETE ==========

    console.log('Pedro Tiago Contabilidade - Site initialized successfully!');

    // Fire a custom event when everything is ready
    window.dispatchEvent(new CustomEvent('siteReady', {
        detail: { timestamp: Date.now() }
    }));
});

// ========== GLOBAL UTILITY FUNCTIONS ==========

// Quick WhatsApp contact function
window.contactWhatsApp = function(message = 'Olá! Gostaria de falar sobre serviços contábeis.') {
    const url = `https://wa.me/5562999948445?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

// Quick email contact function
window.contactEmail = function(subject = 'Solicitação de Orçamento', body = 'Olá Pedro Tiago, gostaria de solicitar um orçamento para serviços contábeis.') {
    const url = `mailto:pedrotiago@pedrotiagocontabilidade.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
};

// Service-specific contact functions
window.contactForService = function(serviceName) {
    const messages = {
        'pessoa-fisica': 'Olá! Preciso de serviços contábeis para pessoa física. Gostaria de um orçamento.',
        'pessoa-juridica': 'Olá! Preciso de serviços contábeis para pessoa jurídica. Gostaria de um orçamento.',
        'consultoria': 'Olá! Preciso de consultoria contábil. Gostaria de mais informações.',
        'ir': 'Olá! Preciso de ajuda com Declaração de Imposto de Renda. Pode me ajudar?'
    };

    const message = messages[serviceName] || 'Olá! Gostaria de informações sobre serviços contábeis.';
    contactWhatsApp(message);
};