const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

(async () => {
  const dashboardHtml = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
  assert.ok(!dashboardHtml.includes("||'284041'"), 'Dashboard should not fall back to the same hard-coded user ID for every user.');

  const authCode = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');
  const store = {};
  const localStorage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    key(index) {
      return Object.keys(store)[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };

  const context = {
    localStorage,
    window: {},
    console,
    TextEncoder,
    crypto: require('crypto').webcrypto
  };

  vm.runInNewContext(authCode, context);
  const auth = context.window.sbiPayAuth;

  const first = await auth.localRegister({ username: 'Alice', phone: '9999999001', password: 'pass123' });
  const second = await auth.localRegister({ username: 'Bob', phone: '9999999002', password: 'pass123' });

  assert.notStrictEqual(first.userId, second.userId, 'Local registration should create different user IDs.');
  assert.ok(/^[0-9]+$/.test(first.userId), 'Local registration should generate a numeric user ID.');
  assert.ok(/^[0-9]+$/.test(second.userId), 'Local registration should generate a numeric user ID.');

  console.log('auth uniqueness checks passed');
})();
