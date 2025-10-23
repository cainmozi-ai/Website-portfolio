// Three.js 3D Model Loader with Scroll-Based Rotation
// Usage: Place your model file in assets/ and update MODEL_PATH

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// Configuration
const MODEL_PATH = 'assets/le rene glb.glb'; // Update this path to your model
const ENABLE_AUTO_ROTATE = true;
const AUTO_ROTATE_SPEED = 0.5;

class ModelViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.statusDiv = document.getElementById('model-status');
    
    if (!this.canvas) {
      console.error('Canvas element not found with id:', canvasId);
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
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent background

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

    // Lighting (matching React version)
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

    // Controls
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    if (ENABLE_AUTO_ROTATE) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
    }

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  loadModel() {
    // Determine loader based on file extension
    const extension = MODEL_PATH.split('.').pop().toLowerCase();
    
    if (extension === 'obj') {
      this.loadOBJ();
    } else if (extension === 'gltf' || extension === 'glb') {
      this.loadGLTF();
    } else {
      console.error('Unsupported model format. Use .obj, .gltf, or .glb');
      this.createFallbackGeometry();
    }
  }

  loadGLTF() {
    const loader = new GLTFLoader();
    
    console.log('Starting GLTF load from:', MODEL_PATH);
    
    loader.load(
      MODEL_PATH,
      (gltf) => {
        console.log('GLTF loaded, processing...');
        this.model = gltf.scene;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model size:', size);
        console.log('Model center:', center);
        
        // Center model at origin
        gltf.scene.position.x = -center.x;
        gltf.scene.position.y = -center.y;
        gltf.scene.position.z = -center.z;
        
        // Auto-scale to fit viewport (adjust 2 to make larger/smaller)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        this.model.scale.set(scale, scale, scale);
        
        console.log('Applied scale:', scale);
        
        this.scene.add(this.model);
        console.log('GLTF model added to scene successfully');
        this.updateStatus('✓ Model loaded successfully!');
        setTimeout(() => {
          if (this.statusDiv) this.statusDiv.style.display = 'none';
        }, 2000);
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading model: ${percent.toFixed(0)}%`);
          this.updateStatus(`Loading model: ${percent.toFixed(0)}%`);
        }
      },
      (error) => {
        console.error('Error loading GLTF model:', error);
        console.warn('Make sure "le rene glb.glb" is in the assets/ folder');
        this.updateStatus('ERROR: ' + error.message);
        this.createFallbackGeometry();
      }
    );
  }

  loadOBJ() {
    const loader = new OBJLoader();
    
    console.log('Starting OBJ load from:', MODEL_PATH);
    
    loader.load(
      MODEL_PATH,
      (obj) => {
        console.log('OBJ loaded, processing...');
        this.model = obj;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model size:', size);
        console.log('Model center:', center);
        
        // Center model at origin
        obj.position.x = -center.x;
        obj.position.y = -center.y;
        obj.position.z = -center.z;
        
        // Auto-scale to fit viewport (adjust 2 to make larger/smaller)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        this.model.scale.set(scale, scale, scale);
        
        console.log('Applied scale:', scale);
        
        // Apply material to all meshes
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.3,
              roughness: 0.4
            });
          }
        });
        
        this.scene.add(this.model);
        console.log('OBJ model added to scene successfully');
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading model: ${percent.toFixed(0)}%`);
        }
      },
      (error) => {
        console.error('Error loading OBJ model:', error);
        console.warn('Make sure "de rene.obj" is in the assets/ folder');
        this.createFallbackGeometry();
      }
    );
  }

  updateStatus(message) {
    console.log(message);
    if (this.statusDiv) {
      this.statusDiv.textContent = message;
    }
  }

  createFallbackGeometry() {
    // Fallback: beautiful geometric placeholder
    const geometry = new THREE.IcosahedronGeometry(1.5, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xDC143C,
      metalness: 0.7,
      roughness: 0.2,
      wireframe: false
    });
    
    this.model = new THREE.Mesh(geometry, material);
    this.scene.add(this.model);
    
    console.log('Using fallback geometry (icosahedron)');
    this.updateStatus('Using fallback geometry (model not found)');
  }

  updateScrollProgress(progress) {
    this.scrollProgress = progress;
    
    if (this.model) {
      // Apply scroll-based rotation (matching React version)
      this.model.rotation.x = progress * 0.3;
      this.model.rotation.y = progress * 0.5;
    }

    // Fade canvas on scroll
    const opacity = Math.max(0, 1 - progress * 2);
    this.canvas.style.opacity = opacity;
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

// Export for use in main script
export { ModelViewer };
