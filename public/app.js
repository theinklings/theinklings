document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const colonyWelcome = document.getElementById('colonyWelcome');
  const i18n = window.i18n;
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

  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
  });
});
