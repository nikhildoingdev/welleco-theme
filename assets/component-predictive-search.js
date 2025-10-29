import { debounce } from './theme.js';

export class PredictiveSearch extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector('input[type="search"]');
    this.resultsContainer = this.querySelector('#predictive-search-results');
    this.noResultsMessage = this.querySelector('.predictive-search__no-results');
    this.resetButton = this.querySelector('.reset__button');
    this.searchTerm = this.input.value.trim();
    this.isOpen = false;
    this.abortController = new AbortController();
    
    // Store initial products HTML
    this.initialProductsHTML = this.resultsContainer.innerHTML;
    
    this.input.addEventListener('input', debounce((e) => this.onChange(e), 500));
    this.input.addEventListener('focus', (e) => this.onChange(e));
    this.handleClickOutside = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.handleClickOutside);
  }

  onChange(e) {
    const newSearchTerm = this.input.value.trim();
    this.searchTerm = newSearchTerm;

    // If search is empty, show initial featured products
    if (!this.searchTerm.length) {
      this.showInitialProducts();
      return;
    }

    this.toggleLoading(true);
    this.getSearchResults(this.searchTerm);
  }

  getSearchResults(searchTerm) {
    // Abort previous request if still pending
    this.abortController.abort();
    this.abortController = new AbortController();

    // Use the correct Shopify predictive search API endpoint
    const params = new URLSearchParams({
      q: searchTerm,
      'resources[type]': 'product',
      'resources[limit]': '8',
      'resources[options][unavailable_products]': 'last',
      'resources[options][fields]': 'title,product_type,variants.title,vendor'
    });

    fetch(`/search/suggest.json?${params.toString()}`, {
      signal: this.abortController.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Search results:', data); // Debug log
        
        // Check if we have products in the response
        if (data && data.resources && data.resources.results && data.resources.results.products) {
          this.renderProducts(data.resources.results.products);
        } else {
          this.showNoResults();
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Error fetching search results:', error);
          this.showNoResults();
        }
      });
  }

  renderProducts(products) {
    this.toggleLoading(false);
    
    if (!products || products.length === 0) {
      this.showNoResults();
      return;
    }

    this.hideNoResults();
    
    // Clear existing products
    this.resultsContainer.innerHTML = '';
    
    // Render each product
    products.forEach(product => {
      const productCard = this.createProductCard(product);
      this.resultsContainer.appendChild(productCard);
    });

    this.open();
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card-wrapper';
    
    // Get the image URL - Shopify API returns image as a string URL
    const imageUrl = product.image || product.featured_image;
    
    // Build price HTML - prices are in cents
    let priceHTML = '';
    const price = product.price / 100;
    const comparePrice = product.compare_at_price_max / 100;
    
    if (product.price_varies) {
      priceHTML = `<span class="price-item price-item--regular">From ${this.formatMoney(price)}</span>`;
    } else if (comparePrice && comparePrice > price) {
      priceHTML = `
        <span class="price-item price-item--sale">${this.formatMoney(price)}</span>
        <span class="price-item price-item--regular"><s>${this.formatMoney(comparePrice)}</s></span>
      `;
    } else {
      priceHTML = `<span class="price-item price-item--regular">${this.formatMoney(price)}</span>`;
    }
    
    card.innerHTML = `
      <a href="${product.url}" class="product-card">
        <div class="product-card__image-wrapper">
          ${imageUrl ? `
            <img 
              src="${imageUrl}" 
              alt="${product.title}"
              class="product-card__image"
              loading="lazy"
            />
          ` : '<div class="product-card__image-placeholder"></div>'}
        </div>
        <div class="product-card__info">
          ${product.vendor ? `<p class="product-card__vendor">${product.vendor}</p>` : ''}
          <h3 class="product-card__title">${product.title}</h3>
          <div class="product-card__price price">
            ${priceHTML}
          </div>
        </div>
      </a>
    `;
    
    return card;
  }

  formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  showInitialProducts() {
    // Restore the initial products HTML
    this.resultsContainer.innerHTML = this.initialProductsHTML;
    this.toggleLoading(false);
    this.hideNoResults();
  }

  showNoResults() {
    this.toggleLoading(false);
    this.resultsContainer.innerHTML = '';
    this.noResultsMessage?.classList.remove('hidden');
    this.open();
  }

  hideNoResults() {
    this.noResultsMessage?.classList.add('hidden');
  }
  
  open() {
    this.toggleLoading(false);
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  clearSearch(e) {
    e.preventDefault();
    this.input.value = '';
    this.searchTerm = '';
    this.showInitialProducts();
  }

  handleClickOutside(event) {
    // Check if the click is outside the predictive search component
    if (this.isOpen && !this.contains(event.target)) {
      this.close();
    }
  }

  disconnectedCallback() {
    // Clean up event listeners when component is removed
    document.removeEventListener('click', this.handleClickOutside);
    this.abortController.abort();
  }

  toggleLoading(show) {
    this.querySelector('.predictive-search__loading')?.classList.toggle('hidden', !show);
  }
}

if (!customElements.get('predictive-search')) {
  customElements.define('predictive-search', PredictiveSearch);
}