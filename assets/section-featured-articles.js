export class FeaturedArticles extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
    this.sectionId = this.getAttribute('data-section-id');

    // Store bound methods so add/removeEventListener match
    this.onSectionLoad = this.onSectionLoad.bind(this);
    this.onSectionUnload = this.onSectionUnload.bind(this);
  }

  connectedCallback() {
    this.init();
    document.addEventListener('shopify:section:load', this.onSectionLoad);
    document.addEventListener('shopify:section:unload', this.onSectionUnload);
  }

  disconnectedCallback() {
    this.destroy();
    document.removeEventListener('shopify:section:load', this.onSectionLoad);
    document.removeEventListener('shopify:section:unload', this.onSectionUnload);
  }

  init() {
    if (window.Swiper && this.sectionId) {
      const selector = `#featured-articles-${this.sectionId}`;
      const swiperEl = document.querySelector(selector);

      // Prevent duplicate swiper initialization
      if (!swiperEl || swiperEl.classList.contains('swiper-initialized')) return;

      this.swiper = new Swiper(selector, {
        slidesPerView: 1.2,
        spaceBetween: 20,
        autoHeight: false,
        navigation: {
          nextEl: `${selector} .featured-articles__swiper-next`,
          prevEl: `${selector} .featured-articles__swiper-prev`,
        },
        breakpoints: {
          750: { slidesPerView: 2, spaceBetween: 24 },
          990: { slidesPerView: 4, spaceBetween: 32 },
        },
        loop: false,
        watchOverflow: true,
      });
    }
  }

  destroy() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }

  onSectionLoad(e) {
    if (e.detail && e.detail.sectionId === this.sectionId) {
      this.destroy();
      this.init();
    }
  }

  onSectionUnload(e) {
    if (e.detail && e.detail.sectionId === this.sectionId) {
      this.destroy();
    }
  }
}

if (!customElements.get('featured-articles')) {
  customElements.define('featured-articles', FeaturedArticles);
}

