/**
 * Nexus Contacts - Application Controller & UI Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    user: null,
    contacts: [],
    stats: { total: 0, favorites: 0, categories: {} },
    filters: {
      q: '',
      category: 'All',
      favorite: false,
      sort: 'recent',
    },
    contactToDelete: null,
    searchDebounce: null,
  };

  // DOM Elements
  const elements = {
    // Layout & Nav
    userNavSection: document.getElementById('user-nav-section'),
    userAvatar: document.getElementById('user-avatar-initials'),
    userName: document.getElementById('user-display-name'),
    userEmail: document.getElementById('user-display-email'),
    logoutBtn: document.getElementById('logout-btn'),

    // Views
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),

    // Auth Elements
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authAlert: document.getElementById('auth-alert'),
    authTitle: document.getElementById('auth-heading'),
    authDesc: document.getElementById('auth-subheading'),
    promptToRegister: document.getElementById('prompt-to-register'),
    promptToLogin: document.getElementById('prompt-to-login'),
    switchToRegisterLink: document.getElementById('switch-to-register-link'),
    switchToLoginLink: document.getElementById('switch-to-login-link'),
    loginSubmitBtn: document.getElementById('login-submit-btn'),
    registerSubmitBtn: document.getElementById('register-submit-btn'),

    // Stats
    statTotal: document.getElementById('stat-total-count'),
    statFavorite: document.getElementById('stat-favorite-count'),
    statWork: document.getElementById('stat-work-count'),
    statPersonal: document.getElementById('stat-personal-count'),

    // Controls & Filters
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    sortSelect: document.getElementById('sort-select'),
    filterChips: document.querySelectorAll('.filter-chip'),
    resultsCount: document.getElementById('results-count-text'),
    contactsContainer: document.getElementById('contacts-container'),
    emptyState: document.getElementById('empty-state'),
    emptyAddBtn: document.getElementById('empty-add-btn'),

    // Contact Modal
    contactModal: document.getElementById('contact-modal'),
    modalTitle: document.getElementById('modal-title'),
    contactForm: document.getElementById('contact-form'),
    contactIdInput: document.getElementById('contact-id'),
    openAddModalBtn: document.getElementById('open-add-modal-btn'),
    closeContactModalBtn: document.getElementById('close-contact-modal-btn'),
    cancelContactBtn: document.getElementById('cancel-contact-btn'),
    saveContactBtn: document.getElementById('save-contact-btn'),

    // Delete Modal
    deleteModal: document.getElementById('delete-modal'),
    deleteContactName: document.getElementById('delete-contact-name'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container'),
  };

  // =========================================================================
  // Toast Notifications
  // =========================================================================
  const showToast = (message, type = 'info', duration = 3500) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${escapeHTML(message)}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // =========================================================================
  // Helper Functions
  // =========================================================================
  const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const setBtnLoading = (button, isLoading) => {
    const textSpan = button.querySelector('.btn-text');
    const spinner = button.querySelector('.btn-spinner');
    if (isLoading) {
      button.disabled = true;
      if (textSpan) textSpan.classList.add('hidden');
      if (spinner) spinner.classList.remove('hidden');
    } else {
      button.disabled = false;
      if (textSpan) textSpan.classList.remove('hidden');
      if (spinner) spinner.classList.add('hidden');
    }
  };

  const showAuthAlert = (message, isError = true) => {
    elements.authAlert.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    elements.authAlert.textContent = message;
    elements.authAlert.classList.remove('hidden');
  };

  const hideAuthAlert = () => {
    elements.authAlert.classList.add('hidden');
  };

  // =========================================================================
  // Auth State Transitions
  // =========================================================================
  const switchAuthTab = (isRegister) => {
    hideAuthAlert();
    if (isRegister) {
      elements.tabRegister.classList.add('active');
      elements.tabRegister.setAttribute('aria-selected', 'true');
      elements.tabLogin.classList.remove('active');
      elements.tabLogin.setAttribute('aria-selected', 'false');

      elements.registerForm.classList.remove('hidden');
      elements.loginForm.classList.add('hidden');
      elements.authTitle.textContent = 'Create an Account';
      elements.authDesc.textContent = 'Join Contact Manager to securely manage your network anywhere.';

      elements.promptToRegister?.classList.add('hidden');
      elements.promptToLogin?.classList.remove('hidden');
    } else {
      elements.tabLogin.classList.add('active');
      elements.tabLogin.setAttribute('aria-selected', 'true');
      elements.tabRegister.classList.remove('active');
      elements.tabRegister.setAttribute('aria-selected', 'false');

      elements.loginForm.classList.remove('hidden');
      elements.registerForm.classList.add('hidden');
      elements.authTitle.textContent = 'Welcome Back';
      elements.authDesc.textContent = 'Sign in to access and manage your contacts seamlessly.';

      elements.promptToRegister?.classList.remove('hidden');
      elements.promptToLogin?.classList.add('hidden');
    }
  };

  const setAuthenticatedState = (user) => {
    state.user = user;
    if (user) {
      elements.authView.classList.add('hidden');
      elements.dashboardView.classList.remove('hidden');
      elements.userNavSection.classList.remove('hidden');

      elements.userName.textContent = user.name;
      elements.userEmail.textContent = user.email;
      elements.userAvatar.textContent = getInitials(user.name);

      loadStats();
      loadContacts();
    } else {
      elements.authView.classList.remove('hidden');
      elements.dashboardView.classList.add('hidden');
      elements.userNavSection.classList.add('hidden');
      state.contacts = [];
    }
  };

  // =========================================================================
  // API Actions & Data Fetching
  // =========================================================================
  const checkSession = async () => {
    const token = API.getToken();
    if (!token) {
      setAuthenticatedState(null);
      return;
    }

    try {
      const res = await API.auth.getMe();
      if (res.success && res.user) {
        setAuthenticatedState(res.user);
      } else {
        API.clearSession();
        setAuthenticatedState(null);
      }
    } catch (err) {
      API.clearSession();
      setAuthenticatedState(null);
    }
  };

  const loadStats = async () => {
    try {
      const res = await API.contacts.getStats();
      if (res.success && res.data) {
        state.stats = res.data;
        elements.statTotal.textContent = res.data.total || 0;
        elements.statFavorite.textContent = res.data.favorites || 0;

        const workCount = (res.data.categories?.Work || 0) + (res.data.categories?.Client || 0);
        const personalCount =
          (res.data.categories?.Personal || 0) + (res.data.categories?.Family || 0);

        elements.statWork.textContent = workCount;
        elements.statPersonal.textContent = personalCount;
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadContacts = async () => {
    elements.resultsCount.textContent = 'Loading contacts...';
    try {
      const res = await API.contacts.getAll(state.filters);
      if (res.success) {
        state.contacts = res.data || [];
        renderContacts();
      }
    } catch (error) {
      showToast(error.message || 'Failed to fetch contacts', 'error');
      elements.resultsCount.textContent = 'Error loading contacts';
    }
  };

  // =========================================================================
  // Contact Card Rendering
  // =========================================================================
  const renderContacts = () => {
    const list = state.contacts;

    // Update result info count
    if (list.length === 0) {
      elements.resultsCount.textContent = 'No contacts found';
      elements.contactsContainer.innerHTML = '';
      elements.emptyState.classList.remove('hidden');

      if (state.filters.q || state.filters.category !== 'All' || state.filters.favorite) {
        document.getElementById('empty-title').textContent = 'No matching contacts';
        document.getElementById('empty-subtitle').textContent =
          'Try adjusting your search keywords or filter criteria.';
      } else {
        document.getElementById('empty-title').textContent = 'No contacts yet';
        document.getElementById('empty-subtitle').textContent =
          'Start building your address book by adding your first contact.';
      }
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.resultsCount.textContent = `Showing ${list.length} ${
      list.length === 1 ? 'contact' : 'contacts'
    }`;

    elements.contactsContainer.innerHTML = list
      .map((c) => {
        const initials = getInitials(c.name);
        const favClass = c.isFavorite ? 'is-fav' : '';
        const favIconColor = c.isFavorite ? 'currentColor' : 'none';
        const color = c.avatarColor || '#3b82f6';

        return `
        <div class="contact-card" data-id="${c._id}">
          <div class="contact-card-top">
            <div class="contact-profile">
              <div class="contact-avatar" style="background-color: ${color};">
                ${initials}
              </div>
              <div class="contact-names">
                <span class="contact-name">${escapeHTML(c.name)}</span>
                ${
                  c.company
                    ? `<span class="contact-company">${escapeHTML(c.company)}</span>`
                    : ''
                }
              </div>
            </div>
            <button class="favorite-toggle-btn ${favClass}" data-id="${c._id}" title="${
          c.isFavorite ? 'Remove from favorites' : 'Mark as favorite'
        }">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${favIconColor}" stroke="currentColor" stroke-width="1.8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          </div>

          <span class="contact-category-badge badge-${c.category || 'Personal'}">${
          c.category || 'Personal'
        }</span>

          <div class="contact-details-list">
            <div class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <a href="tel:${escapeHTML(c.phone)}" class="detail-link">${escapeHTML(
          c.phone
        )}</a>
            </div>

            ${
              c.email
                ? `
            <div class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <a href="mailto:${escapeHTML(c.email)}" class="detail-link">${escapeHTML(
                    c.email
                  )}</a>
            </div>
            `
                : ''
            }

            ${
              c.address
                ? `
            <div class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${escapeHTML(c.address)}</span>
            </div>
            `
                : ''
            }
          </div>

          ${
            c.notes
              ? `<div class="contact-notes-box">${escapeHTML(c.notes)}</div>`
              : ''
          }

          <div class="contact-card-actions">
            <button class="card-action-btn btn-edit" data-id="${c._id}" title="Edit contact">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
            <button class="card-action-btn btn-delete" data-id="${c._id}" data-name="${escapeHTML(
          c.name
        )}" title="Delete contact">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
          </div>
        </div>
      `;
      })
      .join('');
  };

  // =========================================================================
  // Modal Handlers
  // =========================================================================
  const openContactModal = (contact = null) => {
    elements.contactForm.reset();
    if (contact) {
      elements.modalTitle.textContent = 'Edit Contact';
      elements.contactIdInput.value = contact._id;
      document.getElementById('contact-name').value = contact.name || '';
      document.getElementById('contact-category').value = contact.category || 'Personal';
      document.getElementById('contact-phone').value = contact.phone || '';
      document.getElementById('contact-email').value = contact.email || '';
      document.getElementById('contact-company').value = contact.company || '';
      document.getElementById('contact-address').value = contact.address || '';
      document.getElementById('contact-notes').value = contact.notes || '';
      document.getElementById('contact-favorite').checked = Boolean(contact.isFavorite);
    } else {
      elements.modalTitle.textContent = 'Add New Contact';
      elements.contactIdInput.value = '';
    }
    elements.contactModal.classList.remove('hidden');
    document.getElementById('contact-name').focus();
  };

  const closeContactModal = () => {
    elements.contactModal.classList.add('hidden');
    elements.contactForm.reset();
  };

  const openDeleteModal = (id, name) => {
    state.contactToDelete = id;
    elements.deleteContactName.textContent = `"${name}"`;
    elements.deleteModal.classList.remove('hidden');
  };

  const closeDeleteModal = () => {
    state.contactToDelete = null;
    elements.deleteModal.classList.add('hidden');
  };

  // =========================================================================
  // Event Listeners - Auth
  // =========================================================================
  elements.tabLogin.addEventListener('click', () => switchAuthTab(false));
  elements.tabRegister.addEventListener('click', () => switchAuthTab(true));
  elements.switchToRegisterLink?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab(true);
  });
  elements.switchToLoginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab(false);
  });

  // Toggle Password Visibility
  document.querySelectorAll('.btn-toggle-pwd').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
      } else {
        input.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
      }
    });
  });

  // Login Submit
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    setBtnLoading(elements.loginSubmitBtn, true);
    try {
      const res = await API.auth.login(email, password);
      if (res.success && res.token) {
        API.setSession(res.token, res.user);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        setAuthenticatedState(res.user);
      }
    } catch (err) {
      showAuthAlert(err.message || 'Login failed. Please check your credentials.', true);
    } finally {
      setBtnLoading(elements.loginSubmitBtn, false);
    }
  });

  // Register Submit
  elements.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    setBtnLoading(elements.registerSubmitBtn, true);
    try {
      const res = await API.auth.register(name, email, password);
      if (res.success) {
        // Reset registration form
        elements.registerForm.reset();

        // Switch to sign in tab
        switchAuthTab(false);

        // Reset and clear login form inputs completely
        elements.loginForm.reset();
        const loginEmailInput = document.getElementById('login-email');
        if (loginEmailInput) {
          loginEmailInput.value = '';
          loginEmailInput.focus();
        }
        const loginPasswordInput = document.getElementById('login-password');
        if (loginPasswordInput) {
          loginPasswordInput.value = '';
        }

        // Display success alert on the login screen
        showAuthAlert('Account created successfully! Please sign in with your email and password.', false);
        showToast('Account created! Please sign in to continue.', 'success');
      }
    } catch (err) {
      showAuthAlert(err.message || 'Registration failed.', true);
    } finally {
      setBtnLoading(elements.registerSubmitBtn, false);
    }
  });

  // Logout
  elements.logoutBtn.addEventListener('click', () => {
    API.clearSession();
    setAuthenticatedState(null);
    showToast('You have been signed out.', 'info');
  });

  // Auth Expired Custom Event
  window.addEventListener('auth:expired', () => {
    setAuthenticatedState(null);
    showToast('Your session has expired. Please sign in again.', 'error');
  });

  // =========================================================================
  // Event Listeners - Dashboard Search, Filter & Sort
  // =========================================================================
  elements.searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val) {
      elements.searchClearBtn.classList.remove('hidden');
    } else {
      elements.searchClearBtn.classList.add('hidden');
    }

    clearTimeout(state.searchDebounce);
    state.searchDebounce = setTimeout(() => {
      state.filters.q = val;
      loadContacts();
    }, 280);
  });

  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.searchClearBtn.classList.add('hidden');
    state.filters.q = '';
    loadContacts();
  });

  elements.sortSelect.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    loadContacts();
  });

  elements.filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      elements.filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const isFav = chip.getAttribute('data-favorite');
      const cat = chip.getAttribute('data-category');

      if (isFav === 'true') {
        state.filters.favorite = true;
        state.filters.category = 'All';
      } else {
        state.filters.favorite = false;
        state.filters.category = cat || 'All';
      }

      loadContacts();
    });
  });

  // =========================================================================
  // Event Listeners - Contact CRUD
  // =========================================================================
  elements.openAddModalBtn.addEventListener('click', () => openContactModal(null));
  elements.emptyAddBtn.addEventListener('click', () => openContactModal(null));
  elements.closeContactModalBtn.addEventListener('click', closeContactModal);
  elements.cancelContactBtn.addEventListener('click', closeContactModal);

  // Save Contact (Create or Update)
  elements.contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = elements.contactIdInput.value;
    const contactData = {
      name: document.getElementById('contact-name').value.trim(),
      category: document.getElementById('contact-category').value,
      phone: document.getElementById('contact-phone').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      company: document.getElementById('contact-company').value.trim(),
      address: document.getElementById('contact-address').value.trim(),
      notes: document.getElementById('contact-notes').value.trim(),
      isFavorite: document.getElementById('contact-favorite').checked,
    };

    setBtnLoading(elements.saveContactBtn, true);
    try {
      if (id) {
        // Update
        const res = await API.contacts.update(id, contactData);
        if (res.success) {
          showToast('Contact updated successfully!', 'success');
          closeContactModal();
          loadContacts();
          loadStats();
        }
      } else {
        // Create
        const res = await API.contacts.create(contactData);
        if (res.success) {
          showToast('New contact added successfully!', 'success');
          closeContactModal();
          loadContacts();
          loadStats();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save contact', 'error');
    } finally {
      setBtnLoading(elements.saveContactBtn, false);
    }
  });

  // Grid Action Delegation (Favorite Toggle, Edit, Delete)
  elements.contactsContainer.addEventListener('click', async (e) => {
    // Favorite Toggle
    const favBtn = e.target.closest('.favorite-toggle-btn');
    if (favBtn) {
      const id = favBtn.getAttribute('data-id');
      try {
        const res = await API.contacts.toggleFavorite(id);
        if (res.success) {
          showToast(res.message, 'success');
          loadContacts();
          loadStats();
        }
      } catch (err) {
        showToast(err.message || 'Failed to update favorite status', 'error');
      }
      return;
    }

    // Edit Button
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      const contact = state.contacts.find((c) => c._id === id);
      if (contact) {
        openContactModal(contact);
      }
      return;
    }

    // Delete Button
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      const name = deleteBtn.getAttribute('data-name');
      openDeleteModal(id, name);
      return;
    }
  });

  // Delete Confirmation
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener('click', async () => {
    if (!state.contactToDelete) return;
    setBtnLoading(elements.confirmDeleteBtn, true);
    try {
      const res = await API.contacts.delete(state.contactToDelete);
      if (res.success) {
        showToast('Contact deleted successfully', 'success');
        closeDeleteModal();
        loadContacts();
        loadStats();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete contact', 'error');
    } finally {
      setBtnLoading(elements.confirmDeleteBtn, false);
    }
  });

  // Backdrop click to close modals
  window.addEventListener('click', (e) => {
    if (e.target === elements.contactModal) closeContactModal();
    if (e.target === elements.deleteModal) closeDeleteModal();
  });

  // Escape key to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContactModal();
      closeDeleteModal();
    }
  });

  // Initial App Boot
  checkSession();
});
