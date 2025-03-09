import styles from './App.module.css';

function App() {
  return (
    <div class={styles.App}>
      <header>
        <h1>SPA base template</h1>
      </header>
      <div class={styles.content}>
        <p>Content goes here</p>
      </div>
      <footer>
        <p>&copy;2025 <a href="https://tompaton.com/">tompaton.com</a></p>
      </footer>
    </div>
  );
}

export default App;
