if (!customElements.get('newsletter-signup')) {
  customElements.define(
    'newsletter-signup',
    class NewsletterSignup extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        const form = this.querySelector('.newsletter-signup__form');
        if (form) {
          form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Handle SMS button click if present
        const smsButton = this.querySelector('.newsletter-signup__button--secondary');
        if (smsButton) {
          smsButton.addEventListener('click', this.handleSmsClick.bind(this));
        }
      }

      disconnectedCallback() {
        const form = this.querySelector('.newsletter-signup__form');
        if (form) {
          form.removeEventListener('submit', this.handleSubmit.bind(this));
        }

        const smsButton = this.querySelector('.newsletter-signup__button--secondary');
        if (smsButton) {
          smsButton.removeEventListener('click', this.handleSmsClick.bind(this));
        }
      }

      handleSubmit(event) {
        // Form submission is handled by Shopify's native form handling
        // This can be extended for custom validation or analytics
      }

      handleSmsClick(event) {
        event.preventDefault();
        // SMS signup functionality can be implemented here
        // This is a placeholder for future SMS integration
      }
    }
  );
}

