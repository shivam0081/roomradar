import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import workspaceBg from '../assets/rooms/workspace.png';
import './rooms.css';

const skills = [
  { name: 'UI/UX Design', level: 90, color: '#a8c4a0' },
  { name: 'React & Next.js', level: 85, color: '#8cb8a0' },
  { name: 'Node.js & APIs', level: 80, color: '#78a890' },
  { name: 'MongoDB & SQL', level: 75, color: '#6a9882' },
  { name: 'GSAP / Motion', level: 70, color: '#5c8872' },
];

const projects = [
  { id: 1, title: 'RoomRadar', desc: 'Real-time roommate matching platform with MERN stack', tag: 'Full-Stack' },
  { id: 2, title: 'House Navigator', desc: 'Immersive room-based website experience', tag: 'Creative' },
  { id: 3, title: 'Contact Manager', desc: 'CRUD contact management SaaS with Render + Vercel', tag: 'SaaS' },
];

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } },
  },
};

export default function Workspace({ room, isActive }) {
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

  return (
    <div className="room room--workspace" id="room-workspace">
      <motion.div
        className="room-bg"
        style={{ backgroundImage: `url(${workspaceBg})`, scale: 1.08 }}
        animate={{ x: mousePos.x * -14, y: mousePos.y * -8 }}
        transition={{ type: 'spring', stiffness: 50, damping: 25 }}
      />
      <div className="room-light room-light--workspace" />

      <div className="room-content room-content--dual">
        {/* Left: Intro + Skills */}
        <motion.div
          className="workspace-left"
          variants={stagger.container}
          initial="hidden"
          animate={isActive ? "visible" : "hidden"}
        >
          <motion.div variants={stagger.item} className="room-tag">
            <span className="tag-dot" style={{ background: room.accent }} />
            My Work
          </motion.div>
          <motion.h2 variants={stagger.item}>
            The place where<br /><em>ideas breathe.</em>
          </motion.h2>
          <motion.p variants={stagger.item} className="room-body" style={{ maxWidth: '340px' }}>
            A full-stack developer with a passion for design systems, clean code, and immersive digital experiences.
          </motion.p>

          <motion.div variants={stagger.item} className="skills-list">
            {skills.map((skill, i) => (
              <div key={skill.name} className="skill-row">
                <div className="skill-meta">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-pct">{skill.level}%</span>
                </div>
                <div className="skill-bar-track">
                  <motion.div
                    className="skill-bar-fill"
                    style={{ background: skill.color }}
                    initial={{ scaleX: 0 }}
                    animate={isActive ? { scaleX: skill.level / 100 } : { scaleX: 0 }}
                    transition={{ duration: 0.9, delay: 0.5 + i * 0.08, ease: [0.76, 0, 0.24, 1] }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Projects */}
        <motion.div
          className="workspace-right"
          variants={stagger.container}
          initial="hidden"
          animate={isActive ? "visible" : "hidden"}
        >
          <motion.div variants={stagger.item} className="room-tag">
            <span className="tag-dot" style={{ background: room.accent }} />
            Selected Projects
          </motion.div>
          <div className="project-cards">
            {projects.map((proj) => (
              <motion.div
                key={proj.id}
                className="project-card"
                variants={stagger.item}
                whileHover={{ scale: 1.02, y: -3 }}
                style={{ '--proj-accent': room.accent }}
              >
                <div className="project-card-tag">{proj.tag}</div>
                <h3 className="project-title">{proj.title}</h3>
                <p className="project-desc">{proj.desc}</p>
                <div className="project-arrow">→</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
