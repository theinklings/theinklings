document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const colonyWelcome = document.getElementById('colonyWelcome');
  const i18n = window.i18n || { t: (k) => k, setLang: () => {}, getLang: () => 'en', applyTranslations: () => {} };
  const t = i18n.t;

  // --- 1. Custom Interactive Cursor ---
  const cursor = document.getElementById('customCursor');
  function initCursorEvents() {
    if (!cursor) return;
    const hoverables = document.querySelectorAll(
      'a, button, input, select, textarea, .pillar-card, .vote-btn, .user-profile, .mobile-menu-btn, .user-dropdown-item, .action-btn'
    );
    hoverables.forEach(item => {
      item.removeEventListener('mouseenter', onMouseEnterCursor);
      item.removeEventListener('mouseleave', onMouseLeaveCursor);

      item.addEventListener('mouseenter', onMouseEnterCursor);
      item.addEventListener('mouseleave', onMouseLeaveCursor);
    });
  }

  function onMouseEnterCursor() {
    if (cursor) {
      cursor.style.transform = 'translate(-50%, -50%) scale(2.5)';
      cursor.style.backgroundColor = 'var(--text-color)';
    }
  }

  function onMouseLeaveCursor() {
    if (cursor) {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.backgroundColor = 'var(--accent-color)';
    }
  }

  if (cursor) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    initCursorEvents();
  }

  // --- 2. Typewriter Effect (Hero) ---
  let heroTypingTimeout;
  let typingSpan = null;
  let heroWords = [];
  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let typingSpeed = 150;

  function type() {
    if (!typingSpan) return;
    const currentWord = heroWords[wordIdx];

    if (isDeleting) {
      typingSpan.textContent = currentWord.substring(0, charIdx - 1);
      charIdx--;
      typingSpeed = 75;
    } else {
      typingSpan.textContent = currentWord.substring(0, charIdx + 1);
      charIdx++;
      typingSpeed = 150;
    }

    if (!isDeleting && charIdx === currentWord.length) {
      typingSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % heroWords.length;
      typingSpeed = 500;
    }

    heroTypingTimeout = setTimeout(type, typingSpeed);
  }

  function resetHeroTypewriter() {
    if (heroTypingTimeout) clearTimeout(heroTypingTimeout);
    typingSpan = document.getElementById('heroTyping');
    heroWords = t('heroWords');
    wordIdx = 0;
    charIdx = 0;
    isDeleting = false;
    typingSpeed = 150;
    if (typingSpan) {
      typingSpan.textContent = '';
      setTimeout(type, 1200);
    }
  }

  resetHeroTypewriter();

  // Type-then-delete helper for the colony welcome message
  function typeThenDelete(element, text, typeSpeed = 35, pause = 1200, deleteSpeed = 20) {
    return new Promise((resolve) => {
      if (!element) {
        resolve();
        return;
      }

      element.classList.add('typing');
      element.textContent = '';

      let charIdx = 0;

      function typeChar() {
        if (charIdx < text.length) {
          element.textContent += text.charAt(charIdx);
          charIdx++;
          setTimeout(typeChar, typeSpeed);
        } else {
          element.classList.remove('typing');
          element.classList.add('deleting');
          setTimeout(deleteChar, pause);
        }
      }

      function deleteChar() {
        if (element.textContent.length > 0) {
          element.textContent = element.textContent.slice(0, -1);
          setTimeout(deleteChar, deleteSpeed);
        } else {
          element.classList.remove('deleting');
          resolve();
        }
      }

      typeChar();
    });
  }

  // --- 3. Theme Toggle ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleIcon = document.getElementById('themeToggleIcon');

  const sunPath = `<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
  const moonPath = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggleIcon) {
      themeToggleIcon.innerHTML = theme === 'dark' ? sunPath : moonPath;
    }
  }

  // Default to dark mode; respect saved preference if user has toggled it
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }

  // --- 4. Scroll Reveal ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- 5. Scroll-spy Navigation ---
  const navLinks = document.querySelectorAll('.nav-link');
  const logoLink = document.getElementById('navLogoLink');

  function setActiveNav(sectionId) {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
    });
    if (logoLink) {
      logoLink.classList.toggle('active', sectionId === 'home');
    }
  }

  const sections = document.querySelectorAll('section[id]');
  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) {
        setActiveNav(visible[0].target.id);
      }
    }, {
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    });

    sections.forEach(section => navObserver.observe(section));
  }

  // --- 6. Mobile Menu ---
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = document.body.classList.toggle('nav-open');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Language Switcher ---
  const langBtn = document.getElementById('langBtn');
  const langDropdown = document.getElementById('langDropdown');

  function toggleLangDropdown(force) {
    if (!langBtn || !langDropdown) return;
    const shouldOpen = typeof force === 'boolean' ? force : !langDropdown.classList.contains('open');
    langDropdown.classList.toggle('open', shouldOpen);
    langBtn.setAttribute('aria-expanded', String(shouldOpen));
  }

  if (langBtn && langDropdown) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLangDropdown();
    });

    langDropdown.querySelectorAll('[data-lang]').forEach(item => {
      item.addEventListener('click', () => {
        const lang = item.dataset.lang;
        i18n.setLang(lang);
        toggleLangDropdown(false);
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const lang = item.dataset.lang;
          i18n.setLang(lang);
          toggleLangDropdown(false);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!langDropdown.contains(e.target) && e.target !== langBtn) {
        toggleLangDropdown(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleLangDropdown(false);
    });
  }

  window.addEventListener('languagechanged', () => {
    resetHeroTypewriter();
    // Re-render events cabinet so i18n strings refresh
    initFileCabinet();
  });

  // ─────────────────────────────────────────────────────────────────────
  // EVENTS — PC-style empty-state error dialog
  // ─────────────────────────────────────────────────────────────────────

  function createModal(title, message, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active file-error-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', title);

    overlay.innerHTML = `
      <div class="modal-content file-error-modal">
        <div class="modal-inner">
          <div class="file-error-modal-body">
            <div class="file-error-icon-box">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="file-error-modal-content">
              <h3 class="file-error-heading">${title}</h3>
              <p class="file-error-desc">${message}</p>
              <button class="file-error-ok file-error-modal-ok" type="button">OK</button>
            </div>
          </div>
        </div>
      </div>`;

    const close = () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      if (typeof onClose === 'function') onClose();
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('.file-error-modal-ok').addEventListener('click', close);

    document.body.appendChild(overlay);
    // Trigger reflow so the transition plays
    requestAnimationFrame(() => overlay.classList.add('active'));
  }

  const EVENTS_DATA = [];

  // ─────────────────────────────────────────────────────────────────────
  // WINNERS — event winners showcase data
  // ─────────────────────────────────────────────────────────────────────
  const WINNERS_DATA = [
    {
      id: 'quote-winner-1',
      eventName: 'Quote Writing Event',
      eventTheme: 'A Secret Worth Writing',
      winner: 'jumpolphat',
      quote: 'Cherish tomorrow\'s dawn with gratitude, and take pride in having outlasted yesterday\'s trials.',
      description: 'Context of this is to be grateful for having a tomorrow and make it past yesterday. Even though life\'s hard sometimes. But it is normal as it should be. We\'ll never know what could happen in the future or rewrite the past. The thing that we can do is to make today\'s the best and be thankful for making it till today.'
    }
  ];

  function renderWinnersBox() {
    if (WINNERS_DATA.length === 0) return '';
    const entriesHtml = WINNERS_DATA.map((w, i) => `
      <div class="winner-entry${i > 0 ? ' winner-entry--divider' : ''}" aria-label="Winner: ${w.winner}">
        <div class="winner-event-tag">
          <span class="winner-event-name">${w.eventName}</span>
          <span class="winner-event-theme">&ldquo;${w.eventTheme}&rdquo;</span>
        </div>
        <div class="winner-profile">
          <div class="winner-trophy" aria-hidden="true">🏆</div>
          <div class="winner-info">
            <span class="winner-label">Winner</span>
            <span class="winner-name">${w.winner}</span>
          </div>
        </div>
        <blockquote class="winner-quote">&ldquo;${w.quote}&rdquo;</blockquote>
        <p class="winner-desc">${w.description}</p>
      </div>
    `).join('');

    return `
      <div class="winner-window" role="article" aria-label="Event Winners">
        <div class="winner-titlebar">
          <div class="winner-dots"><span></span><span></span><span></span></div>
          <span class="winner-title">event-winners.win</span>
          <div class="winner-winbtns" aria-hidden="true"><span>_</span><span>□</span><span>×</span></div>
        </div>
        <div class="winner-menu">
          <span>Archive</span><span>Share</span><span>View</span>
        </div>
        <div class="winner-body">
          <div class="winner-header">
            <span class="winner-header-label">✦ Hall of Fame ✦</span>
            <h3 class="winner-header-heading">Event Winners</h3>
          </div>
          ${entriesHtml}
        </div>
        <div class="winner-statusbar">
          <span>${WINNERS_DATA.length} winner(s)</span>
          <span>Status: ARCHIVED</span>
          <span>UTF-8</span>
        </div>
      </div>`;
  }

  function renderEventWindow(ev) {
    const guidelinesHtml = ev.guidelines
      ? `<ul class="event-window-list">${ev.guidelines.map((g) => `<li>${g}</li>`).join('')}</ul>`
      : '';
    const whyHtml = ev.why ? `<p class="event-window-note"><strong>Why participate?</strong> ${ev.why}</p>` : '';
    const submitHtml = ev.submitTo ? `<p class="event-window-note"><strong>How to submit:</strong> ${ev.submitTo}</p>` : '';
    const exampleHtml = ev.example
      ? `<div class="event-window-example">
           <span class="event-window-example-label">Example quote:</span>
           <blockquote>"${ev.example}"</blockquote>
         </div>`
      : '';

    return `
      <div class="event-window" role="article" aria-labelledby="event-title-${ev.id}">
        <div class="event-window-titlebar">
          <div class="event-window-dots"><span></span><span></span><span></span></div>
          <span class="event-window-title">${ev.filename}</span>
          <div class="event-window-winbtns" aria-hidden="true">
            <span>_</span><span>□</span><span>×</span>
          </div>
        </div>
        <div class="event-window-menu">
          <span>File</span><span>Edit</span><span>View</span><span>Help</span>
        </div>
        <div class="event-window-body">
          <div class="event-window-meta">
            <span>${ev.type}</span>
            <span>${ev.dateLabel}</span>
          </div>
          <h3 class="event-window-heading" id="event-title-${ev.id}">${ev.title}</h3>
          <p class="event-window-desc">${ev.description}</p>
          ${guidelinesHtml}
          ${whyHtml}
          ${submitHtml}
          ${exampleHtml}
        </div>
        <div class="event-window-statusbar">
          <span>1 object(s)</span>
          <span>Status: OPEN</span>
          <span>UTF-8</span>
        </div>
      </div>`;
  }

  function initFileCabinet() {
    const container = document.getElementById('eventsTimeline');
    if (!container) return;

    const eventsHtml = EVENTS_DATA.length === 0
      ? `<div class="file-error-dialog" role="alert" aria-live="polite">
          <div class="file-error-titlebar">
            <div class="file-error-dots"><span></span><span></span><span></span></div>
            <span class="file-error-title">events.exe — System Error</span>
            <div class="file-error-winbtns" aria-hidden="true">
              <span>_</span><span>□</span><span>×</span>
            </div>
          </div>
          <div class="file-error-body">
            <div class="file-error-icon-box">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="file-error-content">
              <p class="file-error-code">ERROR 0x4E4F4556: EVENTS_NOT_FOUND</p>
              <h3 class="file-error-heading">Whoops, no events yet!</h3>
              <p class="file-error-desc">Check back soon &mdash; we&rsquo;re putting together our next creative gathering.</p>
              <div class="file-error-actions">
                <button class="file-error-ok" type="button">OK</button>
                <button class="file-error-ok file-error-secondary" type="button">Why the hell not??</button>
              </div>
            </div>
          </div>
          <div class="file-error-terminal">
            <pre><span class="file-error-prompt">C:\\INKLINGS&gt;</span>dir /events\n<span class="file-error-line">File Not Found</span>\n\n<span class="file-error-prompt">C:\\INKLINGS&gt;</span><span class="file-error-cursor"></span></pre>
          </div>
        </div>`
      : EVENTS_DATA.map(renderEventWindow).join('');

    const winnersHtml = renderWinnersBox();

    // Render both boxes in a two-column dual-box wrapper
    container.innerHTML = `<div class="events-dual">${eventsHtml}${winnersHtml}</div>`;

    // Wire up buttons if in no-events state
    const okBtn = container.querySelector('.file-error-ok:not(.file-error-secondary)');
    if (okBtn) {
      okBtn.addEventListener('click', () => {
        createModal(
          'Nice try.',
          'Did you really think clicking OK would fix anything? Events still don\'t exist. Chill for a bit.'
        );
      });
    }
    const whyBtn = container.querySelector('.file-error-secondary');
    if (whyBtn) {
      whyBtn.addEventListener('click', () => {
        createModal(
          'Patience, friend.',
          'Look dude events take time to make so just wait K?'
        );
      });
    }
  }

  initFileCabinet();

  // ─────────────────────────────────────────────────────────────────────
  // SECTORS GATE — teasing modal before showing the sectors section
  // ─────────────────────────────────────────────────────────────────────

  const coloniesSection = document.getElementById('colonies');
  const coloniesObserverOptions = {
    root: null,
    rootMargin: '-30% 0px -30% 0px',
    threshold: 0,
  };

  function revealColonies() {
    if (!coloniesSection) return;
    coloniesSection.removeAttribute('data-gated');
    coloniesSection.classList.add('revealed');
  }

  function showSectorGate() {
    createSectorModal(
      'Hold up.',
      'Are you sure you wanna see something cool??',
      [
        { label: 'Yeah!', style: 'primary', action: () => revealColonies() },
        { label: 'Nah', style: 'secondary', action: () => showForcedChoice() },
      ]
    );
  }

  function showForcedChoice() {
    createSectorModal(
      'Tough luck.',
      'Sorry dude you dont really have a choice',
      [
        { label: 'OK', style: 'primary', action: () => revealColonies() },
      ]
    );
  }

  function createSectorModal(title, message, buttons) {
    const existing = document.querySelector('.sector-gate-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active sector-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', title);

    const buttonsHtml = buttons
      .map(
        (btn, idx) =>
          `<button class="file-error-ok ${btn.style === 'secondary' ? 'file-error-secondary' : ''}" type="button" data-idx="${idx}">${btn.label}</button>`
      )
      .join('');

    overlay.innerHTML = `
      <div class="modal-content file-error-modal">
        <div class="modal-inner">
          <div class="file-error-modal-body">
            <div class="file-error-icon-box">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="file-error-modal-content">
              <h3 class="file-error-heading">${title}</h3>
              <p class="file-error-desc">${message}</p>
              <div class="file-error-actions">${buttonsHtml}</div>
            </div>
          </div>
        </div>
      </div>`;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) return; // force a button click
    });

    overlay.querySelectorAll('button[data-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        overlay.classList.remove('active');
        setTimeout(() => {
          overlay.remove();
          if (buttons[idx] && typeof buttons[idx].action === 'function') {
            buttons[idx].action();
          }
        }, 300);
      });
    });

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));
  }

  if (coloniesSection) {
    // Disable scroll-reveal on the section until the gate is passed
    coloniesSection.classList.remove('reveal');

    let gateShown = false;
    const coloniesObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !gateShown) {
          gateShown = true;
          showSectorGate();
        }
      });
    }, coloniesObserverOptions);

    coloniesObserver.observe(coloniesSection);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SECTOR TABS — retro .exe tab switcher
  // ─────────────────────────────────────────────────────────────────────

  const sectorTabs = document.querySelectorAll('.sector-tab');
  const sectorPanels = document.querySelectorAll('.sector-panel');

  function switchSector(index) {
    sectorTabs.forEach((tab) => {
      const isTarget = tab.dataset.sector === String(index);
      tab.classList.toggle('is-active', isTarget);
      tab.setAttribute('aria-selected', String(isTarget));
    });

    sectorPanels.forEach((panel) => {
      const isTarget = panel.dataset.sector === String(index);
      panel.classList.toggle('is-active', isTarget);
      panel.hidden = !isTarget;
    });
  }

  sectorTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      switchSector(Number(tab.dataset.sector));
    });

    tab.addEventListener('keydown', (e) => {
      const current = Number(tab.dataset.sector);
      let next = current;

      if (e.key === 'ArrowRight') {
        next = (current + 1) % sectorTabs.length;
      } else if (e.key === 'ArrowLeft') {
        next = (current - 1 + sectorTabs.length) % sectorTabs.length;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = sectorTabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      sectorTabs[next].focus();
      switchSector(next);
    });
  });
});
