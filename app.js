document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const save = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Demo interactions should still work if browser storage is unavailable.
    }
  };

  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  } [character]));

  $$('[data-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  const menuButton = $('[data-menu]');
  const mobileNavigation = $('[data-mobile-nav]');
  if (menuButton && mobileNavigation) {
    menuButton.addEventListener('click', () => {
      mobileNavigation.classList.toggle('hidden');
    });
  }

  $$('[data-mood]').forEach(button => {
    button.addEventListener('click', () => {
      $$('[data-mood]').forEach(item => {
        item.classList.remove('ring-2', 'ring-[var(--color-primary)]');
      });
      button.classList.add('ring-2', 'ring-[var(--color-primary)]');
      const moodInput = $('[name="mood"]');
      if (moodInput) moodInput.value = button.dataset.mood || '';
    });
  });

  const checkinForm = $('#checkin-form');
  if (checkinForm) {
    const storedCheckin = read('manomitr-checkin', {});
    if (storedCheckin.mood) {
      const savedMood = $$('[data-mood]').find(button => button.dataset.mood === storedCheckin.mood);
      if (savedMood) savedMood.click();
    }

    ['stress', 'energy'].forEach(name => {
      const field = checkinForm.elements[name];
      if (field && storedCheckin[name]) field.value = storedCheckin[name];
    });

    checkinForm.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(checkinForm).entries());
      save('manomitr-checkin', {
        ...data,
        date: new Date().toISOString()
      });
      const result = $('#checkin-result');
      if (result) result.textContent = 'Saved to your demo wellness journal ✓';
    });
  }

  $$('[data-search]').forEach(search => {
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      const scope = search.closest('main') || document;
      $$('[data-searchable]', scope).forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? '' : 'none';
      });
    });
  });

  $$('[data-modal-open]').forEach(button => {
    button.addEventListener('click', () => {
      const modal = $(button.dataset.modalOpen);
      if (modal) modal.classList.remove('hidden');
    });
  });

  $$('[data-modal-close]').forEach(button => {
    button.addEventListener('click', () => {
      const modal = $(button.dataset.modalClose);
      if (modal) modal.classList.add('hidden');
    });
  });

  $$('[data-modal-open]').forEach(button => {
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const modal = $(button.dataset.modalOpen);
        if (modal) modal.classList.add('hidden');
      }
    });
  });

  const bookingForm = $('#booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', event => {
      event.preventDefault();
      const booking = Object.fromEntries(new FormData(bookingForm).entries());
      save('manomitr-booking', {
        ...booking,
        createdAt: new Date().toISOString()
      });
      bookingForm.classList.add('hidden');
      const confirmation = $('#booking-confirmed');
      if (confirmation) confirmation.classList.remove('hidden');
    });
  }

  const chatForm = $('#chat-form');
  if (chatForm) {
    const messages = $('#messages');
    const addMessage = (text, user = false) => {
      if (!messages) return;
      const bubble = document.createElement('div');
      bubble.className = user ?
        'ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--color-primary)] px-4 py-3 text-sm text-white' :
        'max-w-[80%] rounded-2xl rounded-bl-sm bg-[#edf6ef] px-4 py-3 text-sm';
      bubble.textContent = text;
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    };

    const respond = text => {
      const lower = text.toLowerCase();
      if (lower.includes('danger') || lower.includes('suicide') || lower.includes('harm')) {
        return 'I’m sorry you’re facing this. ManoBot cannot provide crisis care. If you may be in immediate danger, contact local emergency services now or reach out to a trusted person who can stay with you.';
      }
      if (lower.includes('professional') || lower.includes('help')) {
        return 'I can help you explore the ManoCare directory. ManoBot offers general wellness information and does not diagnose or replace a qualified professional.';
      }
      if (lower.includes('breath') || lower.includes('stress')) {
        return 'Try a gentle reset: inhale for 4 counts, exhale for 6, and repeat five times. Stop if it feels uncomfortable.';
      }
      if (lower.includes('routine')) {
        return 'Choose one small anchor today: a glass of water, a short walk, or five quiet minutes without notifications. Small steps count.';
      }
      return 'Thanks for sharing. I can offer general wellness ideas and help you find a suitable next step.';
    };

    const submitChat = text => {
      if (!text || !text.trim()) return;
      addMessage(text.trim(), true);
      window.setTimeout(() => addMessage(respond(text)), 250);
    };

    chatForm.addEventListener('submit', event => {
      event.preventDefault();
      const input = $('#chat-input');
      if (!input) return;
      submitChat(input.value);
      input.value = '';
      input.focus();
    });

    $$('[data-chat-prompt]').forEach(button => {
      button.addEventListener('click', () => submitChat(button.dataset.chatPrompt || ''));
    });
  }

  const signupForm = $('#signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(signupForm).entries());
      save('manomitr-profile', {
        name: data.name || '',
        email: data.email || '',
        preferences: data.preferences || ''
      });
      save('manomitr-session', {
        email: data.email || '',
        createdAt: new Date().toISOString()
      });
      window.location.href = '/wellness';
    });
  }

  const diaryForm = $('#diary-form');
  if (diaryForm) {
    const list = $('#diary-list');
    const renderDiary = () => {
      if (!list) return;
      const entries = read('manomitr-diary', []);
      list.innerHTML = entries.length ?
        entries.map((entry, index) => `<article class="card p-6" data-searchable><div class="flex flex-wrap justify-between gap-2"><span class="badge">Private demo entry</span><span class="text-sm muted">${escapeHTML(entry.date)}</span></div><h2 class="mt-5 text-xl">${escapeHTML(entry.title || 'Untitled entry')}</h2><p class="mt-3 whitespace-pre-line leading-7 muted">${escapeHTML(entry.body)}</p><div class="mt-5 flex gap-3 text-sm"><button type="button" class="font-semibold text-[var(--color-primary)]" data-diary-edit="${index}">Edit</button><button type="button" class="muted" data-diary-delete="${index}">Delete</button></div></article>`).join('') :
        '<div class="card p-6 muted">No entries yet. Your first reflection can start here.</div>';

      $$('[data-diary-delete]', list).forEach(button => {
        button.addEventListener('click', () => {
          const entries = read('manomitr-diary', []);
          entries.splice(Number(button.dataset.diaryDelete), 1);
          save('manomitr-diary', entries);
          renderDiary();
        });
      });

      $$('[data-diary-edit]', list).forEach(button => {
        button.addEventListener('click', () => {
          const entry = read('manomitr-diary', [])[Number(button.dataset.diaryEdit)];
          if (!entry) return;
          const title = $('#diary-title');
          const body = $('#diary-body');
          const index = $('#diary-index');
          if (title) title.value = entry.title || '';
          if (body) body.value = entry.body || '';
          if (index) index.value = button.dataset.diaryEdit;
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
      });
    };

    diaryForm.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(diaryForm).entries());
      const entries = read('manomitr-diary', []);
      const index = data.index === '' ? -1 : Number(data.index);
      const entry = {
        title: data.title || 'Untitled entry',
        body: data.body || '',
        date: new Date().toLocaleDateString()
      };
      if (index >= 0 && entries[index]) entries[index] = entry;
      else entries.unshift(entry);
      save('manomitr-diary', entries);
      diaryForm.reset();
      const diaryIndex = $('#diary-index');
      if (diaryIndex) diaryIndex.value = '';
      renderDiary();
    });

    renderDiary();
  }

  const trackerForm = $('#tracker-form');
  if (trackerForm) {
    const savedTracker = read('manomitr-tracker', {});
    Object.keys(savedTracker).forEach(name => {
      const field = trackerForm.elements[name];
      if (field) field.value = savedTracker[name];
    });
    trackerForm.addEventListener('submit', event => {
      event.preventDefault();
      save('manomitr-tracker', Object.fromEntries(new FormData(trackerForm).entries()));
      const result = $('#tracker-result');
      if (result) result.textContent = 'Demo entry saved ✓';
    });
  }

  const connectionForm = $('#connection-form');
  if (connectionForm) {
    const list = $('#connections-list');
    const renderConnections = () => {
      if (!list) return;
      const items = read('manomitr-connections', []);
      list.innerHTML = items.length ?
        items.map((item, index) => `<div class="card p-6"><span class="text-3xl">🤝</span><h2 class="mt-4 text-2xl">${escapeHTML(item.name)}</h2><p class="mt-1 muted">${escapeHTML(item.relationship)} · Demo contact</p><button type="button" data-connection-delete="${index}" class="btn btn-light mt-5 text-sm">Remove</button></div>`).join('') :
        '<div class="card p-6 muted">No trusted contacts added yet.</div>';
      $$('[data-connection-delete]', list).forEach(button => {
        button.addEventListener('click', () => {
          const contacts = read('manomitr-connections', []);
          contacts.splice(Number(button.dataset.connectionDelete), 1);
          save('manomitr-connections', contacts);
          renderConnections();
        });
      });
    };
    connectionForm.addEventListener('submit', event => {
      event.preventDefault();
      const items = read('manomitr-connections', []);
      items.push(Object.fromEntries(new FormData(connectionForm).entries()));
      save('manomitr-connections', items);
      connectionForm.reset();
      renderConnections();
    });
    renderConnections();
  }

  $$('[data-enroll]').forEach(button => {
    button.addEventListener('click', () => {
      button.textContent = 'Enrolled in demo ✓';
      button.disabled = true;
      save('manomitr-enrollment', {
        course: button.dataset.enroll || '',
        date: new Date().toISOString()
      });
    });
  });
});
