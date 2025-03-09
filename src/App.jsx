import { createStore } from "solid-js/store";
import { createDeferred, Show } from "solid-js";
import styles from './App.module.css';

const [state, setState] = createStore({
  sync: { url: null, date: null },
  ui: {
    // add UI state here (won't be synced)
  },
  // add app state here (will be synced between devices)
  content: ''
});

function App() {
  initSave();
  bindEvents();

  return (
    <div class={styles.App}>
      <header>
        <h1>SPA base template</h1>
      </header>
      <div class={styles.content}>
        <p>Make that thing!</p>

        <h2>Test</h2>
        <p>Test value to be saved and synced between devices:</p>
        <div>
          <textarea value={state.content} cols={40} rows={5}
            oninput={(event) => setState('content', event.target.value)}></textarea>
        </div>

        <p>Configure syncing:</p>

        <SyncButton />
        <SyncSettings />
      </div>
      <footer>
        <p>&copy;2025 <a href="https://tompaton.com/">tompaton.com</a></p>
      </footer>
    </div>
  );
}

// Persistence management

function initSave() {
  // load state
  if (localStorage.spabase) {
    setState(JSON.parse(localStorage.spabase));
  }

  // save state when it changes
  createDeferred(() => {
    console.log('saving...');
    localStorage.spabase = JSON.stringify(state);
  });
}

function bindEvents() {
  // capture and remove previous event listener if any, otherwise vite will keep
  // adding new ones each time the code is reloaded
  if (document._visibilitychangeeventlistener !== undefined) {
    document.removeEventListener('visibilitychange', document._visibilitychangeeventlistener);
  }
  document.addEventListener('visibilitychange', handleVisibilitychange);
  document._visibilitychangeeventlistener = handleVisibilitychange;
}

function handleVisibilitychange() {
  // save when user leaves the page or focuses it again
  if (syncEnabled())
    syncServerState();
}

function syncEnabled() {
  return state.sync?.url;
}

function generateRandomSyncUrl(event) {
  event.preventDefault();

  // random string to uniquely identify this device
  setState('sync', 'url',
    'https://spabase.tompaton.com/saved/'
    + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2));
}

function syncServerState() {
  // GET, reconcile then PUT merged value back
  const config = {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    headers: {}
  };
  if (state.sync.date)
    config.headers['If-Modified-Since'] = state.sync.date;

  fetch(state.sync.url, config)
    .then(response => {
      if (response.status === 200) {
        console.log('Updated');
        setState('sync', 'date', response.headers.get("Last-Modified"));
        return response.json();
      }
      // status 304 --> no update
      if (response.status === 304) {
        console.log('No update');
        return;
      }
      // status 404 --> create
      if (response.status === 404) {
        console.log('Not found');
        return;
      }
      // other status --> error
      console.error('Error: ' + response.status);
    }
    )
    .then(
      data => {
        if (data) {
          console.log('Loaded');
          setState(data);
        }

        const config = {
          method: 'PUT',
          credentials: 'include',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: getStateJSON()
        };
        fetch(state.sync.url, config)
          .then(response => {
            console.log('Saved:' + response.status);
            if (response.status === 201 || response.status === 204) {
              setState('sync', 'date', response.headers.get("Date"));
            }
          });
      }
    );
}

function getStateJSON() {
  // deep copy
  const backup = JSON.parse(JSON.stringify(state));

  // remove ui/device state
  delete backup.ui;
  delete backup.sync;

  return JSON.stringify(backup);
}

// Sync management UI

function SyncButton() {
  return (
    <>
      <button
        onclick={() => document.getElementById('sync_dialog').showModal()}
        title={syncEnabled()
          ? "Sync enabled (click for settings)"
          : "Sync disabled (click for settings)"}>
        {syncEnabled() ? "Synced" : "Not synced"}
      </button>
      <Show when={syncEnabled()}>
        <button onclick={syncServerState} title="Refresh state from server">↻</button>
      </Show>
    </>
  );
}

function SyncSettings() {
  return (
    <dialog id="sync_dialog">
      <h2>Sync</h2>
      <p>
        Enter sync settings url to share data between devices: <br />
        (contact me to register for free, or provide your own WebDAV url)
      </p>
      <form method="dialog">
        <p>
          <label for="sync_url">Sharing url</label>
          <input id="sync_url" type="text" value={state.sync?.url || ''}
            onchange={(event) => setState('sync', 'url', event.target.value)} />
          <button onclick={(event) => generateRandomSyncUrl(event)} title="Generate random sync url">new</button>
        </p>
        <button>Close</button>
      </form>
    </dialog>
  );
}


export default App;
