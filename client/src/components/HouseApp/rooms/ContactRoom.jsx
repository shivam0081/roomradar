import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import contactBg from '../assets/rooms/contact.png';
import './rooms.css';

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } },
  },
};

const socials = [
  { label: 'GitHub', icon: '⌥', href: '#' },
  { label: 'LinkedIn', icon: '⊡', href: '#' },
  { label: 'Twitter', icon: '⊕', href: '#' },
  { label: 'Email', icon: '✉', href: 'mailto:hello@example.com' },
];

export default function ContactRoom({ room, isActive }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e) => {
      if (!isActive) return;
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [isActive]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ name: '', email: '', message: '' }); }, 4000);
  };

  return (
    <div className="room room--contact" id="room-contact">
      <motion.div
        className="room-bg"
        style={{ backgroundImage: `url(${contactBg})`, scale: 1.08 }}
        animate={{ x: mousePos.x * -12, y: mousePos.y * -7 }}
        transition={{ type: 'spring', stiffness: 50, damping: 25 }}
      />
      <div className="room-light room-light--contact" />

      {/* Spotlight effect on focused input */}
      <motion.div
        className="contact-spotlight"
        animate={{ opacity: focused ? 0.6 : 0 }}
        transition={{ duration: 0.5 }}
      />

      <div className="room-content room-content--dual">
        {/* Left: Copy */}
        <motion.div
          className="contact-left"
          variants={stagger.container}
          initial="hidden"
          animate={isActive ? "visible" : "hidden"}
        >
          <motion.div variants={stagger.item} className="room-tag">
            <span className="tag-dot" style={{ background: room.accent }} />
            Get in touch
          </motion.div>
          <motion.h2 variants={stagger.item}>
            Let's start a<br /><em>conversation.</em>
          </motion.h2>
          <motion.p variants={stagger.item} className="room-body" style={{ maxWidth: '300px' }}>
            Whether it's a project, a collab, or just a friendly hello — my door is always open.
          </motion.p>

          <motion.div variants={stagger.item} className="social-links">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="social-link"
                id={`social-${s.label.toLowerCase()}`}
                style={{ '--social-accent': room.accent }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="social-icon">{s.icon}</span>
                <span>{s.label}</span>
              </a>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Form */}
        <motion.div
          className="contact-right"
          initial={{ opacity: 0, x: 30 }}
          animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {sent ? (
            <motion.div
              className="contact-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="success-icon" style={{ color: room.accent }}>✓</div>
              <h3>Message sent!</h3>
              <p>Thank you for reaching out. I'll be in touch soon.</p>
            </motion.div>
          ) : (
            <form className="contact-form" id="contact-form" onSubmit={handleSubmit} noValidate>
              <div className={`form-group ${focused === 'name' ? 'focused' : ''}`}>
                <label htmlFor="contact-name">Your Name</label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  placeholder="Alex Morgan"
                  style={{ '--input-accent': room.accent }}
                />
              </div>
              <div className={`form-group ${focused === 'email' ? 'focused' : ''}`}>
                <label htmlFor="contact-email">Email Address</label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="alex@example.com"
                  style={{ '--input-accent': room.accent }}
                />
              </div>
              <div className={`form-group ${focused === 'message' ? 'focused' : ''}`}>
                <label htmlFor="contact-message">Your Message</label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused(null)}
                  placeholder="I'd love to collaborate on..."
                  style={{ '--input-accent': room.accent }}
                />
              </div>
              <motion.button
                type="submit"
                id="contact-submit-btn"
                className="cta-btn contact-submit"
                style={{ '--cta-color': room.accent }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send message
                <span className="cta-arrow">✉</span>
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
