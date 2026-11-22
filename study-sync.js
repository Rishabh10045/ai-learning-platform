const syncKey = 'ai-learning-platform.study-account.v1';

export function defaultSyncOrigin() {
  return location.hostname.endsWith('.github.io') ? '' : location.origin;
}

function normalizeOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Enter the HTTPS address of the Study Desk sync server.');
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Enter the server origin only, such as https://study.example.com.');
  }
  return url.origin;
}

export class StudySyncError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class StudySync {
  #account = null;
  #snapshot = null;
  #queue = Promise.resolve();
  #generation = 0;

  constructor() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(syncKey));
      if (saved && typeof saved.token === 'string') this.#account = { ...saved, origin: normalizeOrigin(saved.origin) };
    } catch {
      // A blocked or expired browser session can sign in again without affecting local progress.
    }
  }

  get account() { return this.#account; }
  get current() { return this.#snapshot; }

  async #request(origin, path, method, body, token) {
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body) headers['Content-Type'] = 'application/json';
    let response;
    try {
      response = await fetch(origin + '/api/v1/' + path, {
        method, headers, body: body && JSON.stringify(body), cache: 'no-store',
        signal: AbortSignal.timeout(16000)
      });
    } catch {
      throw new StudySyncError(0, 'The sync server is unreachable. Your last confirmed progress remains on the account.');
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new StudySyncError(response.status, 'This address did not respond as a Study Desk sync server.');
    }
    if (!response.ok && response.status !== 409) {
      throw new StudySyncError(response.status, data.message || 'The sync request failed.');
    }
    return { status: response.status, data };
  }

  #adopt(data) {
    if (!Number.isSafeInteger(data.revision) || !data.state || typeof data.state !== 'object') {
      throw new StudySyncError(0, 'The sync server returned an invalid progress snapshot.');
    }
    if (!this.#snapshot || data.revision >= this.#snapshot.revision) {
      this.#snapshot = { ...data, remindersConfigured: data.remindersConfigured ?? this.#snapshot?.remindersConfigured };
    }
    return this.#snapshot;
  }

  async signIn(origin, email, password) {
    const target = normalizeOrigin(origin);
    const { data } = await this.#request(target, 'session', 'POST', { email, password });
    if (!/^[\w-]{43}$/.test(data.token || '')) throw new Error('The server returned an invalid session.');
    this.#generation++;
    this.#snapshot = null;
    const { token, ...progress } = data;
    const snapshot = this.#adopt(progress);
    this.#account = { origin: target, token, email: data.email };
    try {
      sessionStorage.setItem(syncKey, JSON.stringify(this.#account));
    } catch {
      // Sync remains available in the current tab when browser session storage is disabled.
    }
    return snapshot;
  }

  async signOut() {
    const account = this.#account;
    this.#account = null;
    this.#snapshot = null;
    this.#generation++;
    try { sessionStorage.removeItem(syncKey); } catch {}
    if (account) {
      try { await this.#request(account.origin, 'session', 'DELETE', null, account.token); } catch {}
    }
  }

  async pull() {
    const generation = this.#generation;
    await this.#queue;
    if (!this.#account || this.#generation !== generation) return null;
    const account = this.#account;
    const { data } = await this.#request(account.origin, 'progress', 'GET', null, account.token);
    return this.#generation === generation ? this.#adopt(data) : null;
  }

  #write(path, method, fields) {
    const generation = this.#generation;
    const operation = this.#queue.then(async () => {
      if (!this.#account || !this.#snapshot || this.#generation !== generation) {
        throw new StudySyncError(409, 'Refresh the account and confirm the change before trying again.');
      }
      const account = this.#account;
      const { status, data } = await this.#request(account.origin, path, method,
        { revision: this.#snapshot.revision, ...fields }, account.token);
      if (this.#generation !== generation) return null;
      const snapshot = this.#adopt(data);
      if (status === 409) {
        this.#generation++;
        throw new StudySyncError(409, 'Another browser saved first. Confirm the updated progress before trying this edit again.');
      }
      return snapshot;
    });
    // A rejected command must not block independent later actions.
    this.#queue = operation.catch(() => {});
    return operation;
  }

  save(action) { return this.#write('progress', 'PATCH', { action }); }
  importLocal(state) { return this.#write('import', 'POST', { state }); }
}
