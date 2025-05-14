import './Navbar.css';

function Navbar({ isDark, toggleTheme }) {
  return (
    <nav className="navbar">
      <h1 className="navbar-title">Welcome to the demo version of LinkedIn Analyzer Tool</h1>
      <div className="theme-toggle-wrapper">
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDark ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
