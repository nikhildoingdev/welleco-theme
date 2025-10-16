export class ProductInfo extends HTMLElement {
  abortController = undefined;

  constructor() {
    super();
  }

  setupEventListeners() {
    this.variantSelector?.addEventListener('change', this.onVariantChange.bind(this));
    this.quantitySelector.addEventListener('change', this.onQuantitySelectorEvent.bind(this));
    this.quantitySelector.querySelector('button[name="plus"]').addEventListener('click', this.onQuantitySelectorEvent.bind(this));
    this.quantitySelector.querySelector('button[name="minus"]').addEventListener('click', this.onQuantitySelectorEvent.bind(this));
    document.getElementById('swiper-script').addEventListener('load', this.initSwiper.bind(this));
  }

  connectedCallback() {
    this.setupEventListeners();
    if (typeof Swiper !== 'undefined') {
      this.initSwiper();
    }
  }

  initSwiper() {
    this.swiper = new Swiper('.swiper', {
      autoHeight: true,
      direction: 'horizontal',
      pagination: {
        el: '.swiper-pagination',
      },
      navigation: {
        prevEl: '.swiper-button-prev',
        nextEl: '.swiper-button-next',
      },
    });
  }

  get variantSelector() {
    return this.querySelector('variant-selector');
  }

  get quantitySelector() {
    return this.querySelector('quantity-selector');
  }

  get selectedOptionValues() {
    if (this.variantSelector.dataset.pickerType === 'dropdown') {
      const list = Array.from(this.variantSelector.querySelectorAll('select')).map(
        (select) => select.options[select.selectedIndex].dataset.optionValueId
      );
      return list;
    } else {
      const list = Array.from(this.variantSelector.querySelectorAll('fieldset input:checked')).map(
        ({ dataset }) => dataset.optionValueId
      );
      return list;
    }
  }

  getSelectedVariant(html) {
    const selectedVariant = html.querySelector('[data-selected-variant]')?.innerHTML;
    return !!selectedVariant ? JSON.parse(selectedVariant) : null;
  }

  onVariantChange(e) {
    const hasDifferentProductUrl = e.target?.dataset?.productUrl ? (e.target?.dataset?.productUrl !== this.dataset.url) : false;
    const productUrl = e.target?.dataset?.productUrl || this.dataset.url;
    this.renderSection(hasDifferentProductUrl, productUrl);
  }

  onQuantitySelectorEvent(e) {
    const quantityInput = this.quantitySelector.querySelector('input[type="number"]');
    let currentValue = parseInt(quantityInput.value);
    const minValue = parseInt(quantityInput.getAttribute('min')) || 0;
    const maxValue = parseInt(quantityInput.getAttribute('max')) || Infinity;

    if (e.target.name === 'minus' && currentValue > minValue) {
      quantityInput.value = currentValue - 1;
    } else if (e.target.name === 'plus' && currentValue < maxValue) {
      quantityInput.value = currentValue + 1;
    } else if (e.type === 'change') {
      if (currentValue < minValue) {
        quantityInput.value = minValue;
      } else if (currentValue > maxValue) {
        quantityInput.value = maxValue;
      }
    }
  }

  updateMedia(variantFeaturedMediaId) {
    if (!variantFeaturedMediaId) return;
    var index = this.querySelector(`.swiper-slide[data-media-id="${variantFeaturedMediaId}"]`).dataset.mediaIndex;
    this.swiper?.slideTo(index);
  }

  updateURL(variantId) {
    // this.querySelector('share-button')?.updateUrl(
    //   `${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ''}`
    // );
    if (!window.location.pathname.includes('/products/')) return;
    window.history.replaceState({}, '', `${this.dataset.url}${variantId ? `?variant=${variantId}` : ''}`);
  }

  updateSourceFromDestination = (html, id) => {
    const source = html.getElementById(`${id}`);
    const destination = this.querySelector(`#${id}`);
    if (source && destination) {
      destination.innerHTML = source.innerHTML;
    }
  };

  updateVariantInputs(variantId) {
    this.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`).forEach(
      (productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = variantId ?? '';
      }
    );
  }

  renderSection(hasDifferentProductUrl, productUrl) {
    this.abortController?.abort();
    this.abortController = new AbortController();

    fetch(`${productUrl}?option_values=${this.selectedOptionValues}&section_id=${this.dataset.section}`, {
      signal: this.abortController.signal,
    })
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const variant = this.getSelectedVariant(html);
        if (hasDifferentProductUrl) {
          const productInfo = html.querySelector('product-info');
          this.replaceWith(productInfo);
          productInfo.updateURL(variant?.id);
        } else {
          this.updateMedia(variant?.featured_media?.id);
          this.updateURL(variant?.id);
          this.updateVariantInputs(variant?.id);
          this.updateSourceFromDestination(html, `add-to-cart-container-${this.dataset.section}`);
          this.updateSourceFromDestination(html, `variant-selector-${this.dataset.section}`);
          this.updateSourceFromDestination(html, `price-${this.dataset.section}`);
          this.updateSourceFromDestination(html, `sku-${this.dataset.section}`);
          this.updateSourceFromDestination(html, `inventory-${this.dataset.section}`);
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted by user');
        } else {
          console.error(error);
        }
      });
  }
}

if (!customElements.get('product-info')) {
  customElements.define('product-info', ProductInfo);
}