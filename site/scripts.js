// Project data (from React version)
const projects = [
  {
    id: 1,
    title: "SERAPHIM",
    subtitle: "Celestial Form Study",
    year: "2024",
    tech: "Six-layer SSS wing material with volumetric god rays — 4K stable at 512 samples",
    description: "Hardware-pushing render exploring divine aesthetics through engineering precision. Subsurface scattering through multi-layer wing material system, celestial lighting rig with volumetric god rays.",
    tags: ["Organic Modeling", "SSS Mastery", "Celestial Lighting"],
    image: "assets/seraphim.jpg",
    link: "https://artstation.com/..."
  },
  {
    id: 2,
    title: "EVENT HORIZON",
    subtitle: "Gravitational Phenomenon",
    year: "2024",
    tech: "Physics-accurate gravitational lensing via 47-node procedural setup",
    description: "Cosmic-scale rendering exploring gravitational distortion through procedural node workflows. Event Horizon Telescope data-informed light ray bending, temperature-gradient accretion disk.",
    tags: ["Procedural Workflows", "Physics Simulation", "Node Mastery"],
    image: "assets/event horizon.png",
    link: "https://artstation.com/..."
  },
  {
    id: 3,
    title: "MIDNIGHT DRIVE",
    subtitle: "Automotive & Environmental Lighting",
    year: "2024",
    tech: "Physically-based materials with real-time ray-traced reflections and volumetric fog",
    description: "Photorealistic automotive rendering in urban night environment. Accurate car paint shader with metallic flake, emission-mapped tail lights, wet asphalt reflections, and atmospheric depth of field with bokeh.",
    tags: ["Automotive Rendering", "Night Lighting", "PBR Materials"],
    image: "assets/car render.jpg",
    link: "https://artstation.com/..."
  }
];

// State
let scrollY = 0;
let scrollProgress = 0;
let activeSection = 'hero';
let ticking = false;

// Render projects
function renderProjects() {
  const container = document.getElementById('projects');
  
  projects.forEach((project, index) => {
    const article = document.createElement('article');
    article.className = 'project';
    article.dataset.index = index;
    
    article.innerHTML = `
      <div class="project-image-wrap">
        <div class="project-image">
          <img src="${project.image}" alt="${project.title}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div class="project-overlay"></div>
        <div class="project-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </div>
      </div>
      
      <div class="project-content">
        <div>
          <div class="project-year">${project.year}</div>
          <h3 class="project-title">${project.title}</h3>
          <div class="project-subtitle">${project.subtitle}</div>
        </div>
        
        <div class="project-tech">${project.tech}</div>
        
        <p class="project-desc">${project.description}</p>
        
        <div class="project-tags">
          ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
        </div>
        
        <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="project-link">
          VIEW FULL CASE STUDY
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    `;
    
    container.appendChild(article);
  });
}

// Parallax calculation for project cards
function getParallaxTransform(element, index) {
  const rect = element.getBoundingClientRect();
  const elementTop = rect.top + scrollY;
  const elementHeight = rect.height;
  const windowHeight = window.innerHeight;
  
  const scrollProgressLocal = (scrollY + windowHeight - elementTop) / (windowHeight + elementHeight);
  const clampedProgress = Math.max(0, Math.min(1, scrollProgressLocal));
  
  const speeds = [0.15, 0.2, 0.12];
  const speed = speeds[index % speeds.length];
  
  const translateY = (clampedProgress - 0.5) * -100 * speed;
  const scale = 1 + (clampedProgress * 0.05);
  
  return { translateY, scale };
}

// Handle scroll with requestAnimationFrame
function handleScroll() {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      scrollY = window.scrollY;
      
      // Calculate scroll progress (0-1)
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      scrollProgress = Math.min(scrollY / documentHeight, 1);
      
      // Update hero parallax
      updateHeroParallax();
      
      // Update project parallax
      updateProjectParallax();
      
      // Update active section
      updateActiveSection();
      
      // Update hero scroll button visibility
      const heroScrollBtn = document.querySelector('.hero-scroll');
      if (heroScrollBtn) {
        heroScrollBtn.style.opacity = Math.max(0, 1 - scrollY / 300);
      }
      
      ticking = false;
    });
    ticking = true;
  }
}

// Update hero parallax effects
function updateHeroParallax() {
  const heroElements = document.querySelectorAll('[data-parallax]');
  
  heroElements.forEach(element => {
    const speed = parseFloat(element.dataset.parallax);
    const translateY = scrollY * speed;
    const opacity = Math.max(0, 1 - scrollY / 500);
    
    element.style.transform = `translateY(${translateY}px)`;
    element.style.opacity = opacity;
  });
}

// Update project card parallax
function updateProjectParallax() {
  const projectElements = document.querySelectorAll('.project');
  
  projectElements.forEach((project, index) => {
    const imageWrap = project.querySelector('.project-image-wrap');
    if (imageWrap) {
      const { translateY, scale } = getParallaxTransform(project, index);
      imageWrap.style.transform = `translateY(${translateY}px) scale(${scale})`;
      imageWrap.style.transition = 'transform 0.1s ease-out';
    }
  });
}

// Update active section in nav
function updateActiveSection() {
  const sections = ['hero', 'work', 'about', 'contact'];
  
  const current = sections.find(section => {
    const element = document.getElementById(section);
    if (element) {
      const rect = element.getBoundingClientRect();
      return rect.top <= 100 && rect.bottom >= 100;
    }
    return false;
  });
  
  if (current && current !== activeSection) {
    activeSection = current;
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const section = link.dataset.section;
      if (section === activeSection) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

// Smooth scroll to section
function scrollToSection(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderProjects();
  
  // Attach scroll listener
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Attach nav click handlers
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('href').substring(1);
      scrollToSection(section);
    });
  });
  
  // Attach hero scroll button handler
  const heroScrollBtn = document.querySelector('.hero-scroll');
  if (heroScrollBtn) {
    heroScrollBtn.addEventListener('click', () => {
      scrollToSection('work');
    });
  }
  
  // Initial scroll handling
  handleScroll();
});