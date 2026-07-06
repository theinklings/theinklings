document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT & LOCAL STORAGE PERSISTENCE ---
  let currentFilter = 'all';
  let editingCreationId = null;
  let deletionTargetId = null;

  // One-time reset of previously stored showcase projects.
  // Future submissions will persist normally.
  const CREATIONS_VERSION = '1';
  if (localStorage.getItem('inklingsCreationsVersion') !== CREATIONS_VERSION) {
    localStorage.setItem('inklingsCreations', '[]');
    localStorage.setItem('inklingsCreationsVersion', CREATIONS_VERSION);
  }

  // Load submissions from localStorage or default to empty
  let creations = [];
  try {
    const savedCreations = localStorage.getItem('inklingsCreations');
    if (savedCreations) {
      const parsed = JSON.parse(savedCreations);
      if (Array.isArray(parsed)) {
        creations = parsed.map(c => ({
          ...c,
          comments: undefined
        }));
      }
    }
  } catch (err) {
    console.error('Failed to load creations:', err);
  }

  // --- UI Elements ---
  const openSubmitModalBtn = document.getElementById('openSubmitModalBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const colonyWelcome = document.getElementById('colonyWelcome');
  const submitModalHeading = document.querySelector('#submitModalOverlay .modal-content h3');
  const deleteConfirmModalOverlay = document.getElementById('deleteConfirmModalOverlay');
  const closeDeleteConfirmBtn = document.getElementById('closeDeleteConfirmBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteConfirmText = document.getElementById('deleteConfirmText');
  const i18n = window.i18n;
  const t = i18n.t;
  const getLang = i18n.getLang;


  // Save creations helper
  function persistCreations() {
    localStorage.setItem('inklingsCreations', JSON.stringify(creations));
  }

  // --- 1. Custom Interactive Cursor ---
  const cursor = document.getElementById('customCursor');
  function initCursorEvents() {
    if (!cursor) return;
    const hoverables = document.querySelectorAll(
      'a, button, input, select, textarea, .pillar-card, .showcase-item, .event-card, .vote-btn, .user-profile, .mobile-menu-btn, .user-dropdown-item, .action-btn'
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

  // --- 3. Theme Toggle (inside user dropdown) ---
  const dropdownThemeToggle = document.getElementById('dropdownThemeToggle');
  const dropdownThemeIcon = document.getElementById('dropdownThemeIcon');

  const sunPath = `<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
  const moonPath = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      if (dropdownThemeIcon) dropdownThemeIcon.innerHTML = sunPath;
    } else {
      if (dropdownThemeIcon) dropdownThemeIcon.innerHTML = moonPath;
    }
  }

  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setTheme(savedTheme);

  if (dropdownThemeToggle) {
    dropdownThemeToggle.addEventListener('click', () => {
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

  // (User dropdown removed — login system removed)

  // --- 8. User Settings Modal ---
  // Settings modal kept for display-name customisation (username shown on cards)
  const userSettingsModalOverlay = document.getElementById('userSettingsModalOverlay');
  const closeUserSettingsModalBtn = document.getElementById('closeUserSettingsModalBtn');
  const userSettingsForm = document.getElementById('userSettingsForm');
  const settingsDisplayName = document.getElementById('settingsDisplayName');
  const clearDataBtn = document.getElementById('clearDataBtn');

  function openUserSettingsModal() {
    if (!userSettingsModalOverlay || !settingsDisplayName) return;
    settingsDisplayName.value = localStorage.getItem('username') || '';
    userSettingsModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeUserSettingsModal() {
    if (!userSettingsModalOverlay) return;
    userSettingsModalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  if (closeUserSettingsModalBtn) {
    closeUserSettingsModalBtn.addEventListener('click', closeUserSettingsModal);
  }

  if (userSettingsModalOverlay) {
    userSettingsModalOverlay.addEventListener('click', (e) => {
      if (e.target === userSettingsModalOverlay) closeUserSettingsModal();
    });
  }

  if (userSettingsForm) {
    userSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = settingsDisplayName.value.trim();
      if (!newName) return;

      const oldName = localStorage.getItem('username');
      if (oldName) {
        creations.forEach(c => {
          if (c.submittedBy === oldName) {
            c.submittedBy = newName;
          }
        });
      }

      localStorage.setItem('username', newName);
      persistCreations();
      renderCreations();
      closeUserSettingsModal();
    });
  }

  // Old logout button removed from settings modal; logout now lives in the user dropdown.

  // --- Delete Confirmation Modal ---
  function openDeleteConfirmModal() {
    if (!deleteConfirmModalOverlay) return;
    deleteConfirmModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDeleteConfirmModal() {
    if (!deleteConfirmModalOverlay) return;
    deleteConfirmModalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    deletionTargetId = null;
  }

  if (closeDeleteConfirmBtn) {
    closeDeleteConfirmBtn.addEventListener('click', closeDeleteConfirmModal);
  }

  if (deleteConfirmModalOverlay) {
    deleteConfirmModalOverlay.addEventListener('click', (e) => {
      if (e.target === deleteConfirmModalOverlay) closeDeleteConfirmModal();
    });
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (!deletionTargetId) return;
      creations = creations.filter(c => c.id !== deletionTargetId);
      persistCreations();
      renderCreations();
      closeDeleteConfirmModal();
    });
  }

  // --- 9. Creations System ---
  const showcaseGrid = document.getElementById('showcaseGrid');
  const emptyShowcase = document.getElementById('emptyShowcase');

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(getLang(), {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function renderCreations() {
    if (!showcaseGrid) return;

    const items = showcaseGrid.querySelectorAll('.showcase-item');
    items.forEach(it => it.remove());

    if (creations.length === 0) {
      if (emptyShowcase) emptyShowcase.style.display = 'flex';
      return;
    }

    if (emptyShowcase) emptyShowcase.style.display = 'none';

    let listToRender = [...creations];

    if (currentFilter === 'best') {
      listToRender.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
    }

    if (listToRender.length === 0) {
      const noFilterMatch = document.createElement('div');
      noFilterMatch.className = 'empty-showcase';
      noFilterMatch.style.gridColumn = 'span 12';
      noFilterMatch.innerHTML = `<h3>${t('noFilterMatchTitle')}</h3><p>${t('noFilterMatchText')}</p>`;
      showcaseGrid.appendChild(noFilterMatch);
      return;
    }

    listToRender.forEach(c => {
      const card = document.createElement('div');
      card.className = 'showcase-item';

      const likeActive = c.voted === 'like' ? 'active' : '';
      const dislikeActive = c.voted === 'dislike' ? 'active' : '';
      const currentUsername = localStorage.getItem('username');
      const isOwner = currentUsername && c.submittedBy === currentUsername;

      const mediaHtml = c.imageUrl
        ? `<img src="${escapeHtml(c.imageUrl)}" alt="${t('submitImagePreviewAlt')}">`
        : '';

      const actionsHtml = isOwner
        ? `
          <div class="showcase-actions">
            <button class="action-btn edit-btn" data-id="${c.id}" aria-label="${t('editProjectBtn')}">${t('editProjectBtn')}</button>
            <button class="action-btn delete-btn" data-id="${c.id}" aria-label="${t('deleteProjectBtn')}">${t('deleteProjectBtn')}</button>
          </div>
        `
        : '';

      card.innerHTML = `
        ${actionsHtml}
        <div class="showcase-media ${c.imageUrl ? 'has-image' : ''}">
          ${mediaHtml}
        </div>
        <div class="showcase-content">
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.desc)}</p>

          <div class="showcase-votes">
            <button class="vote-btn like-btn ${likeActive}" data-id="${c.id}" aria-label="${t('likeAria')}">
              <svg viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>${t('likeBtn')}</span>
              <span class="vote-count">(${c.likes})</span>
            </button>

            <button class="vote-btn dislike-btn ${dislikeActive}" data-id="${c.id}" aria-label="${t('dislikeAria')}">
              <svg viewBox="0 0 24 24">
                <path d="M10 15v4a3 3 0 0 0 6 0v-4h3a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6c-.1 0-.2-.1-.3-.2l-2.4-3.3A2 2 0 0 0 6.7 3H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6zm4-12v4a3 3 0 0 1-6 0V3H3v8h7l2.4 3.3a2 2 0 0 0 1.6.7H19V3h-5z" transform="rotate(180 12 11)" />
              </svg>
              <span>${t('dislikeBtn')}</span>
              <span class="vote-count">(${c.dislikes})</span>
            </button>
          </div>
        </div>
      `;

      showcaseGrid.appendChild(card);
    });

    initVotingEvents();
    initCreationActionEvents();
    initCursorEvents();
  }

  function initVotingEvents() {
    const likeButtons = document.querySelectorAll('.like-btn');
    const dislikeButtons = document.querySelectorAll('.dislike-btn');

    likeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        const creation = creations.find(c => c.id === id);
        if (!creation) return;

        if (creation.voted === 'like') {
          creation.likes--;
          creation.voted = null;
        } else {
          if (creation.voted === 'dislike') {
            creation.dislikes--;
          }
          creation.likes++;
          creation.voted = 'like';
        }
        persistCreations();
        renderCreations();
      });
    });

    dislikeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        const creation = creations.find(c => c.id === id);
        if (!creation) return;

        if (creation.voted === 'dislike') {
          creation.dislikes--;
          creation.voted = null;
        } else {
          if (creation.voted === 'like') {
            creation.likes--;
          }
          creation.dislikes++;
          creation.voted = 'dislike';
        }
        persistCreations();
        renderCreations();
      });
    });
  }

  function initCreationActionEvents() {
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');

    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        const creation = creations.find(c => c.id === id);
        if (!creation) return;

        editingCreationId = id;
        document.getElementById('submitTitle').value = creation.title;
        document.getElementById('submitDesc').value = creation.desc;
        if (imagePreview) {
          imagePreview.innerHTML = creation.imageUrl
            ? `<img src="${escapeHtml(creation.imageUrl)}" alt="${t('submitImagePreviewAlt')}">`
            : '';
        }
        if (submitImage) submitImage.value = '';
        if (submitModalHeading) submitModalHeading.textContent = t('editModalHeading');

        submitModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        const creation = creations.find(c => c.id === id);
        if (!creation) return;

        deletionTargetId = id;
        if (deleteConfirmText) {
          deleteConfirmText.textContent = t('confirmDeleteText', { title: creation.title });
        }
        deleteConfirmModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Filter navigation buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderCreations();
    });
  });

  // Join form removed — posting is now open to all visitors.

  const submitModalOverlay = document.getElementById('submitModalOverlay');
  const closeSubmitModalBtn = document.getElementById('closeSubmitModalBtn');
  const submitCreationForm = document.getElementById('submitCreationForm');
  const submitImage = document.getElementById('submitImage');
  const imagePreview = document.getElementById('imagePreview');

  if (openSubmitModalBtn && submitModalOverlay && closeSubmitModalBtn) {
    openSubmitModalBtn.addEventListener('click', () => {
      // If no display name set, ask for one before opening
      if (!localStorage.getItem('username')) {
        const name = prompt('Choose a display name to post under:');
        if (!name || !name.trim()) return;
        localStorage.setItem('username', name.trim());
      }
      submitModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeSubmitModal = () => {
      submitModalOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
      editingCreationId = null;
      if (submitCreationForm) submitCreationForm.reset();
      if (imagePreview) imagePreview.innerHTML = '';
      if (submitImage) submitImage.value = '';
      if (submitModalHeading) submitModalHeading.textContent = t('submitModalHeading');
    };

    closeSubmitModalBtn.addEventListener('click', closeSubmitModal);
    submitModalOverlay.addEventListener('click', (e) => {
      if (e.target === submitModalOverlay) closeSubmitModal();
    });

    if (submitImage && imagePreview) {
      submitImage.addEventListener('change', () => {
        const file = submitImage.files[0];
        imagePreview.innerHTML = '';
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = t('submitImagePreviewAlt');
          imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }

    if (submitCreationForm) {
      submitCreationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titleVal = document.getElementById('submitTitle').value;
        const descVal = document.getElementById('submitDesc').value;
        const file = submitImage ? submitImage.files[0] : null;

        let imageUrl = null;
        if (file) {
          const formData = new FormData();
          formData.append('image', file);
          try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            imageUrl = data.url;
          } catch (err) {
            console.error('Image upload failed:', err);
            alert('Image upload failed. Please try again or submit without an image.');
            return;
          }
        }

        if (editingCreationId) {
          const creation = creations.find(c => c.id === editingCreationId);
          if (creation) {
            creation.title = titleVal;
            creation.desc = descVal;
            if (imageUrl) creation.imageUrl = imageUrl;
          }
        } else {
          const newCreation = {
            id: Date.now(),
            title: titleVal,
            desc: descVal,
            imageUrl,
            submittedBy: localStorage.getItem('username'),
            likes: 0,
            dislikes: 0,
            voted: null
          };
          creations.unshift(newCreation);
        }

        persistCreations();
        renderCreations();
        closeSubmitModal();

        const showcaseGridEl = document.getElementById('showcase');
        if (showcaseGridEl) {
          showcaseGridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  // C. Events Modal Controls
  const openHostModalBtn = document.getElementById('openHostModalBtn');
  const closeHostModalBtn = document.getElementById('closeHostModalBtn');
  const hostModalOverlay = document.getElementById('hostModalOverlay');
  const hostEventForm = document.getElementById('hostEventForm');
  const eventsTimeline = document.getElementById('eventsTimeline');

  if (openHostModalBtn && closeHostModalBtn && hostModalOverlay) {
    openHostModalBtn.addEventListener('click', () => {
      hostModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeHostModal = () => {
      hostModalOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    };

    closeHostModalBtn.addEventListener('click', closeHostModal);
    hostModalOverlay.addEventListener('click', (e) => {
      if (e.target === hostModalOverlay) closeHostModal();
    });

    if (hostEventForm) {
      hostEventForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('eventTitle').value;
        const time = document.getElementById('eventTime').value;
        const type = document.getElementById('eventType').value;
        const desc = document.getElementById('eventDesc').value;

        const eventCard = document.createElement('div');
        eventCard.className = 'event-card reveal active';
        eventCard.innerHTML = `
          <div class="event-meta">
            <span>${time}</span>
            <span>${type}</span>
          </div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(desc)}</p>
        `;

        eventsTimeline.insertBefore(eventCard, eventsTimeline.firstChild);

        hostEventForm.reset();
        closeHostModal();

        eventCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
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
    renderCreations();
  });

  // Initial render
  renderCreations();
});
