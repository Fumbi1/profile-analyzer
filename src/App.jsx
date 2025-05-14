import { useEffect, useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import jsPDF from 'jspdf';

function App() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const isValidLinkedInUrl = (url) => /^https?:\/\/(www\.)?linkedin\.com\/.*$/i.test(url);

  function getLinkId(linkedinUrl) {
    try {
      const { pathname } = new URL(linkedinUrl);
      const segments = pathname.split('/').filter(Boolean);
      return segments[1] || '';
    } catch {
      return '';
    }
  }

  const generateSummary = (profileData) => {
    // Generate summary from structured profile data
    if (!profileData || typeof profileData !== 'object') {
      return "Could not process profile data.";
    }

    const { fullName, public_identifier, headline, about, articles, followers, connections } = profileData;


    const formattedSummary = `
    Profile Analysis for ${name}:
    
    ${fullName ? `Full Name: ${fullName}` : 'Full Name is not provided.'}

    ${public_identifier ? `Public Identifier: ${public_identifier}` : 'Not provided.'}

    ${headline ? `Current Position: ${headline}` : 'No headline information available.'}
    
    ${about ? `About: ${about}` : 'No summary provided in the profile.'}

    ${followers ? `Followers: ${followers}` : 'Number of followers not available.'}

    ${connections ? `Connections: ${connections}` : 'No information on connection is available.'}
    
    ${Array.isArray(articles) && articles.length > 0 
     ? `Articles published: ${articles.length}` 
     : 'No articles data available.'}
    `;

    return formattedSummary.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Name is required.');
    if (!isValidLinkedInUrl(url)) return setError('Enter a valid LinkedIn URL.');

    const linkId = getLinkId(url);
    if (!linkId) {
      return setError('Could not extract LinkedIn identifier.');
    }

    const params = new URLSearchParams({
      api_key: '681e2d74002f180a6f91ea97',
      type: 'profile',
      linkId,
      private: 'true'            // allow protected profiles
    });

    setLoading(true);
    try {
      // Using ScrapingDog API to scrape the LinkedIn profile
      const scrapingDogUrl = `https://api.scrapingdog.com/linkedin/?${params}`;

      const response = await fetch(scrapingDogUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(`ScrapingDog 400: ${msg}`);
      }

      const profileData = await response.json();
      const profile  = profileData[0] || {};
      const summary = generateSummary(profile);

      setSummaries((prev) => [{ name, url, data: profile, summary, expanded: false }, ...prev]);
      setName('');
      setUrl('');
    } catch (err) {
      setError(`Error: ${err.message || 'Something went wrong.'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index) => {
    setSummaries((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  const downloadPdf = (summary, name) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`LinkedIn Summary Report for ${name}`, 10, 20);
    doc.setFontSize(12);
    doc.text(summary, 10, 40, { maxWidth: 180 });
    doc.save(`${name}-LinkedIn-Summary.pdf`);
  };

  return (
    <>
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      <div className="app-container">
        <form className="form" onSubmit={handleSubmit}>
          <div><img src="/linkedin-logo.png" alt="LinkedIn Logo" className="linkedin-logo" /></div>
          <h2>LinkedIn Profile Analyzer</h2>
          {error && <div className="error">{error}</div>}
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="url" placeholder="LinkedIn Profile URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Analyze'}
          </button>
        </form>

        {summaries.length > 0 && (
          <div className="summary-list">
            {summaries.map((item, index) => (
              <div className="summary-card" key={index}>
                <h3>{item.name}</h3>
                <p className="url">{item.url}</p>
                <p className={`summary-text ${item.expanded ? 'expanded' : ''}`}>
                  {item.expanded ? item.summary : item.summary.slice(0, 200) + '...'}
                </p>
                <div className="summary-actions">
                  <button onClick={() => toggleExpand(index)}>
                    {item.expanded ? 'Collapse' : 'Read More'}
                  </button>
                  <button onClick={() => downloadPdf(item.summary, item.name)}>
                    📄 Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default App;