// createGalleryView(config) — reusable gallery view factory
// config: { dataUrl, title, subtitle }
// Returns a view object { title, html, init } compatible with the SPA router.

function createGalleryView(config) {
  // Persists revealed NSFW items across gallery re-visits within the same page session.
  const revealedItems = new Set();

  const html = `
<header class="gallery-header" data-reveal>
  <a href="#" class="back-btn" data-magnetic>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 2L4 7l5 5"/>
    </svg>
    back
  </a>
  <div class="gallery-title-group">
    <h1>${config.title}</h1>
    <p>${config.subtitle}</p>
  </div>
  <button class="theme-toggle-btn" id="toggleBtn" aria-label="Toggle theme" data-magnetic>
    <img src="assets/icons/theme-dark.png" alt="theme" />
  </button>
</header>

<div class="masonry-wrap">
  <div class="masonry" id="masonry"></div>
</div>

<footer data-reveal>made by yours truly · 2026</footer>

<div class="modal-backdrop" id="modalBackdrop" role="dialog" aria-modal="true" aria-label="Image viewer">
  <div class="modal-box">
    <div class="modal-img-area" id="modalImgArea">
      <button class="modal-close" id="modalClose" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round">
          <path d="M2 2l10 10M12 2L2 12"/>
        </svg>
      </button>
      <button class="modal-nav prev" id="modalPrev" aria-label="Previous">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 2L4 7l5 5"/>
        </svg>
      </button>
      <button class="modal-nav next" id="modalNext" aria-label="Next">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 2l5 5-5 5"/>
        </svg>
      </button>
      <div class="modal-album-bar" id="modalAlbumBar">
        <div class="modal-dots" id="modalDots"></div>
        <div class="modal-album-nav">
          <button class="modal-album-arrow" id="modalAlbumPrev" aria-label="Previous image in album">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 2L4 7l5 5"/>
            </svg>
          </button>
          <span id="modalAlbumCounter" class="modal-album-counter"></span>
          <button class="modal-album-arrow" id="modalAlbumNext" aria-label="Next image in album">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 2l5 5-5 5"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <div class="modal-meta">
        <strong id="modalTitle">—</strong>
        <span id="modalArtist">—</span>
      </div>
    </div>
  </div>
</div>`;

  return {
    title: config.title + " · dru's domain",
    html,
    init() {
      let ITEMS = [];
      let masonryObs = null;
      let currentIdx = 0;
      let albumIdx = 0;

      // ── Placeholder SVG generators ──

      function makePlaceholderSVG(w, h, stops) {
        const id = 'g' + Math.random().toString(36).slice(2, 7);
        return `<svg class="placeholder-img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${stops[0]}"/>
      <stop offset="100%" stop-color="${stops[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#${id})"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,0.18)" font-size="13" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">[ placeholder ]</text>
</svg>`;
      }

      function makeModalPlaceholder(stops) {
        const id = 'mg' + Math.random().toString(36).slice(2, 7);
        return `<svg class="modal-placeholder" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${stops[0]}"/>
      <stop offset="100%" stop-color="${stops[1]}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#${id})"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,0.22)" font-size="16" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">[ placeholder — replace with real image ]</text>
</svg>`;
      }

      // ── Masonry layout (CSS grid + row-span calculation) ──

      function layoutMasonry() {
        const masonry = document.getElementById('masonry');
        if (!masonry) return;
        const rowH = 8; // matches grid-auto-rows in CSS
        const gap  = parseFloat(getComputedStyle(masonry).rowGap) || 14;
        masonry.querySelectorAll('.masonry-item').forEach(el => {
          const h = el.querySelector('.masonry-item-inner').offsetHeight;
          if (h > 0) el.style.gridRowEnd = `span ${Math.ceil((h + gap) / (rowH + gap))}`;
        });
      }

      // ── Masonry build ──

      function buildGallery() {
        const masonry = document.getElementById('masonry');
        ITEMS.forEach((item, i) => {
          const el = document.createElement('div');
          el.className = 'masonry-item';
          el.setAttribute('data-index', i);
          const imgHTML = item.src
            ? `<img src="${item.src}" alt="${item.title}" loading="lazy" />`
            : makePlaceholderSVG(400, item.ph.h, item.ph.stops);
          if (item.nsfw) el.classList.add('nsfw');
          el.innerHTML = `
<div class="masonry-item-inner">
  <div class="masonry-img-wrap">${imgHTML}${item.nsfw ? '<div class="nsfw-mask"><span>⚠ NSFW</span></div>' : ''}${item.album ? `<div class="album-badge">${item.album.length}</div>` : ''}</div>
  <div class="masonry-meta">
    <strong>${item.title}</strong>
    <span>${item.artist}</span>
  </div>
</div>`;
          masonry.appendChild(el);
          el.addEventListener('click', () => openModal(i));

          // Re-layout when real images finish loading
          el.querySelectorAll('img').forEach(img => {
            if (!img.complete) img.addEventListener('load', layoutMasonry, { once: true });
          });
        });

        // Initial layout after first paint
        requestAnimationFrame(() => requestAnimationFrame(layoutMasonry));

        // staggered reveal via IntersectionObserver
        masonryObs = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              const i = parseInt(e.target.getAttribute('data-index'));
              setTimeout(() => e.target.classList.add('visible'), (i % 6) * 80);
              masonryObs.unobserve(e.target);
            }
          });
        }, { threshold: 0.08 });
        masonry.querySelectorAll('.masonry-item').forEach(el => masonryObs.observe(el));

        // cursor hover
        masonry.querySelectorAll('.masonry-item').forEach(el => {
          el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
          el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        });

        window.addEventListener('resize', layoutMasonry);
      }

      // ── Modal ──

      const backdrop       = document.getElementById('modalBackdrop');
      const imgArea        = document.getElementById('modalImgArea');
      const titleEl        = document.getElementById('modalTitle');
      const artistEl       = document.getElementById('modalArtist');
      const closeBtn       = document.getElementById('modalClose');
      const prevBtn        = document.getElementById('modalPrev');
      const nextBtn        = document.getElementById('modalNext');
      const albumBar       = document.getElementById('modalAlbumBar');
      const dotsEl         = document.getElementById('modalDots');
      const albumPrevBtn   = document.getElementById('modalAlbumPrev');
      const albumNextBtn   = document.getElementById('modalAlbumNext');
      const albumCounterEl = document.getElementById('modalAlbumCounter');

      function openModal(idx) {
        currentIdx = idx;
        albumIdx = 0;
        renderModal();
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      function closeModal() {
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
      }

      function renderModal() {
        const item = ITEMS[currentIdx];
        const hasAlbum = !!item.album;

        const old = imgArea.querySelector('img, svg.modal-placeholder');
        if (old) old.remove();
        const oldReveal = document.getElementById('nsfwReveal');
        if (oldReveal) oldReveal.remove();

        const displaySrc = hasAlbum ? item.album[albumIdx].src : item.src;
        const displayPh  = hasAlbum ? item.album[albumIdx].ph  : item.ph;

        const imgEl = displaySrc
          ? Object.assign(document.createElement('img'), { src: displaySrc, alt: item.title })
          : (() => {
            const tmp = document.createElement('div');
            tmp.innerHTML = makeModalPlaceholder(displayPh.stops);
            return tmp.firstElementChild;
          })();

        const photoKey     = `${currentIdx}-${albumIdx}`;
        const parentIsNsfw = item.nsfw && !revealedItems.has(currentIdx);
        const photoIsNsfw  = hasAlbum && item.album[albumIdx].nsfw && !revealedItems.has(photoKey);

        if (parentIsNsfw || photoIsNsfw) {
          imgEl.classList.add('nsfw-blur');
          const reveal = document.createElement('div');
          reveal.id = 'nsfwReveal';
          reveal.className = 'nsfw-reveal';
          reveal.innerHTML = '<span>⚠ NSFW — click to reveal</span>';
          reveal.addEventListener('click', () => {
            revealedItems.add(parentIsNsfw ? currentIdx : photoKey);
            imgEl.classList.remove('nsfw-blur');
            reveal.remove();
          });
          imgArea.insertBefore(reveal, imgArea.firstChild);
        }

        imgArea.insertBefore(imgEl, imgArea.firstChild);
        titleEl.textContent  = item.title;
        artistEl.textContent = item.artist;

        // Gallery prev/next
        prevBtn.style.opacity = currentIdx === 0 ? '0.35' : '1';
        nextBtn.style.opacity = currentIdx === ITEMS.length - 1 ? '0.35' : '1';

        // Album bar (dots + mini-nav)
        albumBar.style.display = hasAlbum ? '' : 'none';
        if (hasAlbum) {
          dotsEl.innerHTML = '';
          item.album.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'modal-dot' + (i === albumIdx ? ' active' : '');
            dotsEl.appendChild(dot);
          });
          albumCounterEl.textContent = `${albumIdx + 1} / ${item.album.length}`;
          albumPrevBtn.style.opacity = albumIdx === 0 ? '0.35' : '1';
          albumNextBtn.style.opacity = albumIdx === item.album.length - 1 ? '0.35' : '1';
        }
      }

      closeBtn.addEventListener('click', closeModal);
      backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

      // Gallery navigation — resets album position
      prevBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (currentIdx > 0) { currentIdx--; albumIdx = 0; renderModal(); }
      });
      nextBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (currentIdx < ITEMS.length - 1) { currentIdx++; albumIdx = 0; renderModal(); }
      });

      // Album navigation
      albumPrevBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (albumIdx > 0) { albumIdx--; renderModal(); }
      });
      albumNextBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (albumIdx < ITEMS[currentIdx].album.length - 1) { albumIdx++; renderModal(); }
      });

      const keyHandler = e => {
        if (!backdrop.classList.contains('open')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft'  && currentIdx > 0)               { currentIdx--; albumIdx = 0; renderModal(); }
        if (e.key === 'ArrowRight' && currentIdx < ITEMS.length - 1) { currentIdx++; albumIdx = 0; renderModal(); }
      };
      document.addEventListener('keydown', keyHandler);

      // ── Fetch data ──

      fetch(config.dataUrl)
        .then(r => r.json())
        .then(data => { ITEMS = data; buildGallery(); });

      // ── Teardown ──

      return function teardown() {
        window.removeEventListener('resize', layoutMasonry);
        document.removeEventListener('keydown', keyHandler);
        if (masonryObs) { masonryObs.disconnect(); masonryObs = null; }
        document.body.style.overflow = '';
      };
    }
  };
}
