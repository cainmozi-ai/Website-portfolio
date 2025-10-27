// Simplified Three.js Model Viewer - No external dependencies needed
// Just works with the model file

const MODEL_PATH = 'assets/le rene glb.glb';

class SimpleModelViewer {
  constructor() {
    this.canvas = document.getElementById('hero-canvas');
    this.statusDiv = document.getElementById('model-status');
    
    if (!this.canvas || typeof THREE === 'undefined') {
      this.updateStatus('ERROR: Setup failed');
      return;
    }

    this.updateStatus('Initializing...');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.scrollProgress = 0;
    this.autoRotation = 0;
    
    this.init();
    this.loadModel();
    this.animate();
    this.setupScroll();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 6); // Much closer view

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights (bright, even lighting)
    // Strong ambient base light
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    
    // Main directional light from front
    const mainLight = new THREE.DirectionalLight(0xffffff, 2);
    mainLight.position.set(0, 10, 10);
    mainLight.castShadow = true;
    this.scene.add(mainLight);
    
    // Fill light from above
    const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
    topLight.position.set(0, 20, 0);
    this.scene.add(topLight);
    
    // Back rim light
    const backLight = new THREE.DirectionalLight(0xffffff, 1);
    backLight.position.set(0, 5, -10);
    this.scene.add(backLight);
    
    // Side lights for definition
    const leftLight = new THREE.PointLight(0xffffff, 1);
    leftLight.position.set(-15, 5, 5);
    this.scene.add(leftLight);
    
    const rightLight = new THREE.PointLight(0xffffff, 1);
    rightLight.position.set(15, 5, 5);
    this.scene.add(rightLight);

    window.addEventListener('resize', () => this.onResize());
    this.updateStatus('Scene ready, loading model...');
  }

  loadModel() {
    // Check if GLTFLoader exists
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.warn('GLTFLoader not available, using fallback');
      this.createFallback();
      return;
    }

    const loader = new THREE.GLTFLoader();
    
    loader.load(
      MODEL_PATH,
      (gltf) => {
        this.model = gltf.scene;
        
        // Ensure materials can receive lighting
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Ensure material is responsive to lights
            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });
        
        // Auto-center and scale
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        gltf.scene.position.sub(center);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 6 / maxDim; // Much larger and closer
        this.model.scale.setScalar(scale);
        
        console.log('Model size:', size, 'Scale:', scale);
        
        // Position model - head at top like reference image
        this.model.position.y = -5.9; // Lower - body extends down
        this.model.position.x = -1.4; // More to the left
        this.model.position.z = 4; // More forward/closer to camera
        
        console.log('Final position:', this.model.position);
        
        this.scene.add(this.model);
        this.updateStatus('✓ Model loaded!');
        setTimeout(() => { if (this.statusDiv) this.statusDiv.style.display = 'none'; }, 2000);
      },
      (xhr) => {
        const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
        this.updateStatus(`Loading: ${percent}%`);
      },
      (error) => {
        console.error('Load error:', error);
        this.updateStatus('Model not found - using fallback');
        this.createFallback();
      }
    );
  }

  createFallback() {
    const geo = new THREE.IcosahedronGeometry(4, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xDC143C, metalness: 0.7, roughness: 0.2 });
    this.model = new THREE.Mesh(geo, mat);
    this.model.position.y = -5.9; // Lower - body extends down
    this.model.position.x = -1.4; // More to the left
    this.model.position.z = 4; // More forward/closer to camera
    this.scene.add(this.model);
    console.log('Using fallback at position:', this.model.position);
    this.updateStatus('Using fallback geometry');
    setTimeout(() => { if (this.statusDiv) this.statusDiv.style.display = 'none'; }, 3000);
  }

  setupScroll() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          this.scrollProgress = Math.min(scrollY / docHeight, 1);
          
          // Move model up as user scrolls down
          if (this.model) {
            this.model.position.y = -5.9 + (this.scrollProgress * 10);
          }
          
          this.canvas.style.opacity = Math.max(0, 1 - this.scrollProgress * 2);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  updateStatus(msg) {
    console.log(msg);
    if (this.statusDiv) this.statusDiv.textContent = msg;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // No auto-rotation - model stays static
    
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when ready
// Test comment - GitHub Desktop integration
function startViewer() {
  if (typeof THREE === 'undefined') {
    console.log('Waiting for Three.js...');
    setTimeout(startViewer, 100);
    return;
  }
  
  // Give GLTFLoader time to load if available
  setTimeout(() => {
    console.log('Starting viewer...');
    new SimpleModelViewer();
  }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startViewer);
} else {
  startViewer();
}
