// Main JavaScript file for Rise for Hope website
// Handles all interactive functionality with error handling and performance optimizations

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        modalAnimationDuration: 400,
        scrollOffset: 80,
        formSubmitEndpoint: '/api/submit',
        performanceTracking: true
    };

    // Utility functions
    const utils = {
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        sanitizeInput: function(input) {
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        },

        logError: function(error, context = '') {
            console.error(`Error in ${context}:`, error);
            // In production, send to error tracking service
        },

        trackPerformance: function(name, value) {
            if (CONFIG.performanceTracking && window.performance && window.performance.mark) {
                window.performance.mark(`${name}-${value}`);
            }
        }
    };

    // Modal functionality
    const modal = {
        element: null,
        titleElement: null,
        isOpen: false,
        lastFocusedElement: null,

        init: function() {
            this.element = document.getElementById('modalOverlay');
            this.titleElement = document.getElementById('modalTitle');
            this.bindEvents();
        },

        bindEvents: function() {
            // Close modal when clicking outside
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });

            // Handle escape key
            document.addEventListener('keydown', (e) => {
                if (this.isOpen && e.key === 'Escape') {
                    this.close();
                }
            });
        },

        open: function(title) {
            try {
                this.lastFocusedElement = document.activeElement;
                this.titleElement.textContent = title;
                this.element.classList.add('active');
                this.element.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                this.isOpen = true;

                // Focus management
                const closeButton = this.element.querySelector('.close-modal');
                if (closeButton) {
                    closeButton.focus();
                }

                utils.trackPerformance('modal', 'open');
            } catch (error) {
                utils.logError(error, 'modal.open');
            }
        },

        close: function() {
            try {
                this.element.classList.remove('active');
                this.element.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = 'auto';
                this.isOpen = false;

                // Restore focus
                if (this.lastFocusedElement) {
                    this.lastFocusedElement.focus();
                }

                utils.trackPerformance('modal', 'close');
            } catch (error) {
                utils.logError(error, 'modal.close');
            }
        }
    };

    // Form handling
    const formHandler = {
        init: function() {
            const form = document.querySelector('.modal-form');
            if (form) {
                form.addEventListener('submit', this.handleSubmit.bind(this));
                this.addValidation();
            }
        },

        addValidation: function() {
            const inputs = document.querySelectorAll('.modal-form input, .modal-form textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', this.validateField.bind(this));
                input.addEventListener('input', this.clearErrors.bind(this));
            });
        },

        validateField: function(event) {
            const field = event.target;
            const value = field.value.trim();
            let isValid = true;
            let errorMessage = '';

            // Required field validation
            if (field.hasAttribute('required') && !value) {
                isValid = false;
                errorMessage = 'This field is required';
            }

            // Email validation
            if (field.type === 'email' && value && !utils.isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }

            this.showFieldError(field, isValid, errorMessage);
            return isValid;
        },

        showFieldError: function(field, isValid, message) {
            // Remove existing error
            const existingError = field.parentNode.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }

            if (!isValid) {
                field.setAttribute('aria-invalid', 'true');
                const error = document.createElement('div');
                error.className = 'error-message';
                error.textContent = message;
                error.style.cssText = `
                    color: #d32f2f;
                    font-size: 0.8rem;
                    margin-top: 5px;
                    position: absolute;
                `;
                field.parentNode.style.position = 'relative';
                field.parentNode.appendChild(error);
            } else {
                field.setAttribute('aria-invalid', 'false');
            }
        },

        clearErrors: function(event) {
            const field = event.target;
            field.setAttribute('aria-invalid', 'false');
            const error = field.parentNode.querySelector('.error-message');
            if (error) {
                error.remove();
            }
        },

        handleSubmit: function(event) {
            event.preventDefault();

            try {
                const form = event.target;
                const formData = new FormData(form);
                const data = {};

                // Validate all fields
                let isFormValid = true;
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    if (!this.validateField({ target: input })) {
                        isFormValid = false;
                    }
                    data[input.name] = utils.sanitizeInput(input.value);
                });

                if (!isFormValid) {
                    this.showFormError('Please correct the errors above');
                    return;
                }

                this.submitForm(data);
            } catch (error) {
                utils.logError(error, 'formHandler.handleSubmit');
                this.showFormError('An error occurred. Please try again.');
            }
        },

        submitForm: function(data) {
            // Show loading state
            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                try {
                    console.log('Form submitted:', data);

                    // Show success message
                    this.showSuccessMessage();

                    // Reset form
                    document.querySelector('.modal-form').reset();
                    modal.close();

                    utils.trackPerformance('form', 'submit');
                } catch (error) {
                    utils.logError(error, 'formHandler.submitForm');
                    this.showFormError('Submission failed. Please try again.');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            }, 1000);
        },

        showSuccessMessage: function() {
            const message = document.createElement('div');
            message.className = 'success-message';
            message.textContent = 'Thank you! We will get back to you within 24 hours.';
            message.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4caf50;
                color: white;
                padding: 15px 20px;
                border-radius: 4px;
                z-index: 3000;
                animation: slideIn 0.3s ease;
            `;

            document.body.appendChild(message);

            setTimeout(() => {
                message.remove();
            }, 5000);
        },

        showFormError: function(message) {
            const error = document.createElement('div');
            error.className = 'form-error';
            error.textContent = message;
            error.style.cssText = `
                background: #f44336;
                color: white;
                padding: 10px;
                margin-top: 10px;
                border-radius: 4px;
                text-align: center;
            `;

            const form = document.querySelector('.modal-form');
            form.appendChild(error);

            setTimeout(() => {
                error.remove();
            }, 5000);
        }
    };

    // Scroll handling
    const scrollHandler = {
        init: function() {
            this.bindEvents();
            this.setupScrollIndicator();
        },

        bindEvents: function() {
            // Smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', this.handleSmoothScroll.bind(this));
            });

            // Scroll-based animations
            if ('IntersectionObserver' in window) {
                this.setupScrollAnimations();
            }

            // Throttled scroll events
            window.addEventListener('scroll', utils.throttle(this.handleScroll.bind(this), 16));
        },

        handleSmoothScroll: function(event) {
            event.preventDefault();
            const targetId = event.target.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const offsetTop = targetElement.offsetTop - CONFIG.scrollOffset;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        },

        setupScrollAnimations: function() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            document.querySelectorAll('.action-card').forEach(card => {
                observer.observe(card);
            });
        },

        setupScrollIndicator: function() {
            const indicator = document.querySelector('.scroll-indicator');
            if (indicator) {
                indicator.addEventListener('click', () => {
                    const pathwaysSection = document.querySelector('.pathways-section');
                    if (pathwaysSection) {
                        pathwaysSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            }
        },

        handleScroll: function() {
            // Add scroll-based behaviors here if needed
            const scrollTop = window.pageYOffset;
            const header = document.querySelector('header');

            if (header) {
                if (scrollTop > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
        }
    };

    // Performance monitoring
    const performance = {
        init: function() {
            if ('performance' in window) {
                this.measurePageLoad();
                this.setupErrorTracking();
            }
        },

        measurePageLoad: function() {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                    console.log('Page load time:', loadTime, 'ms');

                    // Track Core Web Vitals if available
                    this.trackWebVitals();
                }, 0);
            });
        },

        trackWebVitals: function() {
            // CLS (Cumulative Layout Shift)
            let clsValue = 0;
            let clsEntries = [];

            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsEntries.push(entry);
                        clsValue += entry.value;
                    }
                }
            });

            observer.observe({ entryTypes: ['layout-shift'] });

            // LCP (Largest Contentful Paint)
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            });

            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        },

        setupErrorTracking: function() {
            window.addEventListener('error', (event) => {
                console.error('JavaScript error:', event.error);
                // In production, send to error tracking service
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                // In production, send to error tracking service
            });
        }
    };

    // Accessibility enhancements
    const accessibility = {
        init: function() {
            this.setupKeyboardNavigation();
            this.setupFocusManagement();
            this.setupReducedMotion();
            this.setupHighContrast();
        },

        setupKeyboardNavigation: function() {
            // Tab navigation enhancement
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Tab') {
                    document.body.classList.add('keyboard-navigation');
                }
            });

            document.addEventListener('mousedown', () => {
                document.body.classList.remove('keyboard-navigation');
            });
        },

        setupFocusManagement: function() {
            // Ensure focus is visible
            const style = document.createElement('style');
            style.textContent = `
                .keyboard-navigation *:focus {
                    outline: 2px solid #30d4ef !important;
                    outline-offset: 2px !important;
                }
            `;
            document.head.appendChild(style);
        },

        setupReducedMotion: function() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                document.documentElement.style.setProperty('--animation-duration', '0.01ms');
            }
        },

        setupHighContrast: function() {
            if (window.matchMedia('(prefers-contrast: high)').matches) {
                document.body.classList.add('high-contrast');
            }
        }
    };

    // Initialize everything when DOM is ready
    const app = {
        init: function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', this.start.bind(this));
            } else {
                this.start();
            }
        },

        start: function() {
            try {
                // Initialize all modules
                modal.init();
                formHandler.init();
                scrollHandler.init();
                performance.init();
                accessibility.init();

                // Add loading animation
                this.setupLoadingAnimation();

                console.log('Rise for Hope website initialized successfully');
            } catch (error) {
                utils.logError(error, 'app.start');
            }
        },

        setupLoadingAnimation: function() {
            // Remove loading class after animations complete
            setTimeout(() => {
                document.querySelectorAll('.loading').forEach(element => {
                    element.classList.remove('loading');
                });
            }, 100);
        }
    };

    // Start the application
    app.init();

    // Global functions for HTML onclick handlers
    window.openModal = function(title) {
        modal.open(title);
    };

    window.closeModal = function(event) {
        modal.close();
    };

    window.handleFormSubmit = function(event) {
        formHandler.handleSubmit(event);
    };

})();