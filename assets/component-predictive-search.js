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

    // Save initial featured products HTML
    this.initialProductsHTML = this.resultsContainer.innerHTML;

    // Event listeners
    this.input.addEventListener('input', debounce((e) => this.onChange(e), 400));
    this.input.addEventListener('focus', (e) => this.onChange(e));
    this.handleClickOutside = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.handleClickOutside);
  }

  // 🔹 When input changes
  onChange() {
    const newSearchTerm = this.input.value.trim();
    this.searchTerm = newSearchTerm;

    if (!this.searchTerm.length) {
      this.showInitialProducts();
      return;
    }

    this.toggleLoading(true);
    this.getSearchResults(this.searchTerm);
  }

  // 🔹 Fetch rendered predictive search section (HTML)
  getSearchResults(searchTerm) {
    // Cancel any ongoing fetch
    this.abortController.abort();
    this.abortController = new AbortController();

    const url = `/search/suggest?q=${encodeURIComponent(searchTerm)}&section_id=predictive-results`;

    fetch(url, { signal: this.abortController.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return response.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newContent = doc.querySelector('#predictive-search-results');

        if (newContent && newContent.innerHTML.trim().length > 0) {
          this.renderResultsHTML(newContent.innerHTML);
        } else {
          this.showNoResults();
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Predictive search error:', error);
          this.showNoResults();
        }
      });
  }

  // 🔹 Replace results area with new HTML
  renderResultsHTML(html) {
    this.toggleLoading(false);
    this.hideNoResults();
    this.resultsContainer.innerHTML = html;
    this.open();
  }

  // 🔹 Restore featured products when input is empty
  showInitialProducts() {
    this.resultsContainer.innerHTML = this.initialProductsHTML;
    this.toggleLoading(false);
    this.hideNoResults();
  }

  // 🔹 Show “no results” message
  showNoResults() {
    this.toggleLoading(false);
    this.resultsContainer.innerHTML = '';
    this.noResultsMessage?.classList.remove('hidden');
    this.open();
  }

  hideNoResults() {
    this.noResultsMessage?.classList.add('hidden');
  }

  // 🔹 Utility methods
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
    if (this.isOpen && !this.contains(event.target)) {
      this.close();
    }
  }

  disconnectedCallback() {
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
