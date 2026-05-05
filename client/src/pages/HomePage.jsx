import { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext';
import FocalView from '../components/FocalView';

export default function HomePage() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/browse', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="page home-room">
      <section className="hero">
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Find your perfect roommate &amp; room
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            RoomRadar discovers verified roommates and spaces. 
            Experience living before you move in.
          </motion.p>
          <div className="hero-actions">
            <Link className="btn" to="/register">
              Enter House →
            </Link>
            <Link className="btn outline" to="/login">
              Login
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">500+</span>
              <span className="hero-stat-label">Rooms Listed</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">1.2k+</span>
              <span className="hero-stat-label">Matches Made</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">30+</span>
              <span className="hero-stat-label">Cities</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <FocalView>
            <div className="hero-card">
              <div className="hero-card-label">✨ Featured Listing</div>
              <h3>Cozy 2BHK near OMR</h3>
              <p>₹15,000/mo · Bangalore · Available now</p>
              <div className="tags">
                <span className="tag">🌿 Clean</span>
                <span className="tag">📚 Study-friendly</span>
                <span className="tag">📶 WiFi</span>
                <span className="tag">🌙 Night Owl OK</span>
              </div>
              <div className="hero-match-badge">
                <div className="match-score-label">Match Score</div>
                <div className="match-score-track">
                  <div className="match-score-fill" style={{ width: '87%' }} />
                </div>
                <div className="match-score-text">87% compatible</div>
              </div>
            </div>
          </FocalView>
        </div>
      </section>

      <section className="features">
        <h2>Why RoomRadar?</h2>
        <div className="cards">
          <FocalView>
            <div className="feature-card">
              <span className="feature-icon">✅</span>
              <h3>Verified Profiles</h3>
              <p>See user details and lifestyle tags before connecting with potential roommates.</p>
            </div>
          </FocalView>
          <FocalView>
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3>Smart Matching</h3>
              <p>Get suggested roommates and rooms scored by preferences, budget, and lifestyle.</p>
            </div>
          </FocalView>
          <FocalView>
            <div className="feature-card">
              <span className="feature-icon">💬</span>
              <h3>Real-time Chat</h3>
              <p>Chat instantly with shortlisted matches in one unified place.</p>
            </div>
          </FocalView>
          <FocalView>
            <div className="feature-card">
              <span className="feature-icon">📅</span>
              <h3>Easy Bookings</h3>
              <p>Request, accept or reject bookings with a single click, all in one dashboard.</p>
            </div>
          </FocalView>
        </div>
      </section>
    </div>
  );
}
