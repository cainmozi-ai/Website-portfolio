// Combined Three.js script (non-module version for easier loading)
// This bundles everything into one file without ES6 imports

const MODEL_PATH = 'assets/le rene glb.glb';
const ENABLE_AUTO_ROTATE = true;
const AUTO_ROTATE_SPEED = 0.5;

// Wait for Three.js to load from CDN
function initWhenReady() {
  if (typeof THREE === 'undefined') {
    console.log('Waiting for Three.js to load...');
    setTimeout(initWhenReady, 100);
    return;
  }
  
  console.log('Three.js loaded, initializing model viewer...');
  new ModelViewer('hero-canvas');
}

class ModelViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.statusDiv = document.getElementById('model-status');
    
    if (!this.canvas) {
      console.error('Canvas element not found');
      this.updateStatus('ERROR: Canvas not found');
      return;
    }

    console.log('ModelViewer initializing...');
    console.log('Model path:', MODEL_PATH);
    this.updateStatus('Initializing 3D viewer...');

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;
    this.scrollProgress = 0;
    
    this.init();
    this.loadModel();
    this.animate();
    this.setupScrollListener();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(10, 10, 10);
    spotLight.angle = 0.3;
    spotLight.penumbra = 1;
    spotLight.castShadow = true;
    this.scene.add(spotLight);

    const pointLight = new THREE.PointLight(0xDC143C, 0.5);
    pointLight.position.set(-10, -10, -10);
    this.scene.add(pointLight);

    // Controls (check if OrbitControls is available)
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.canvas);
      this.controls.enableZoom = false;
      this.controls.enablePan = false;
      if (ENABLE_AUTO_ROTATE) {
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
      }
    } else {
      console.warn('OrbitControls not loaded - camera will be static');
    }

    window.addEventListener('resize', () => this.onWindowResize());
    
    this.updateStatus('Scene initialized, loading model...');
  }

  loadModel() {
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.error('GLTFLoader not available');
      this.updateStatus('ERROR: GLTFLoader not loaded');
      this.createFallback();
      return;
    }
    
    const loader = new THREE.GLTFLoader();
    
    console.log('Starting GLTF load from:', MODEL_PATH);
    
    loader.load(
      MODEL_PATH,
      (gltf) => {
        console.log('GLTF loaded successfully');
        this.model = gltf.scene;
        
        // Center and scale
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model size:', size);
        
        gltf.scene.position.x = -center.x;
        gltf.scene.position.y = -center.y;
        gltf.scene.position.z = -center.z;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        this.model.scale.set(scale, scale, scale);
        
        console.log('Applied scale:', scale);
        
        this.scene.add(this.model);
        this.updateStatus('✓ Model loaded!');
        setTimeout(() => {
          if (this.statusDiv) this.statusDiv.style.display = 'none';
        }, 2000);
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percent = (progress.loaded / progress.total) * 100;
          this.updateStatus(`Loading: ${percent.toFixed(0)}%`);
        }
      },
      (error) => {
        console.error('Error loading model:', error);
        this.updateStatus('ERROR: Could not load model');
        this.createFallback();
      }
    );
  }

  createFallback() {
    const geometry = new THREE.IcosahedronGeometry(1.5, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xDC143C,
      metalness: 0.7,
      roughness: 0.2
    });
    
    this.model = new THREE.Mesh(geometry, material);
    this.scene.add(this.model);
    this.updateStatus('Using fallback geometry');
  }

  setupScrollListener() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight - windowHeight;
          this.scrollProgress = Math.min(scrollY / documentHeight, 1);
          
          if (this.model) {
            this.model.rotation.x = this.scrollProgress * 0.3;
            this.model.rotation.y = this.scrollProgress * 0.5;
          }
          
          const opacity = Math.max(0, 1 - this.scrollProgress * 2);
          this.canvas.style.opacity = opacity;
          
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  updateStatus(message) {
    console.log(message);
    if (this.statusDiv) {
      this.statusDiv.textContent = message;
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.controls) {
      this.controls.update();
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhenReady);
} else {
  initWhenReady();
}
