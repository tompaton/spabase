import { createStore } from "solid-js/store";
import styles from './App.module.css';
import { AppSync, SyncButton, SyncSettings } from './AppSync';

const [state, setState] = createStore({
  sync: { url: null, date: null },
  ui: {
    // add UI state here (won't be synced)
  },
  // add app state here (will be synced between devices)
  content: ''
});

function App() {
  const sync = new AppSync(state, setState, 'spabase');

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

        <SyncButton sync={sync} />
        <SyncSettings sync={sync} />
      </div>
      <footer>
        <p>&copy;2025 <a href="https://tompaton.com/">tompaton.com</a></p>
      </footer>
    </div>
  );
}

export default App;
