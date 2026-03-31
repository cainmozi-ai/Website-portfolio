/* ═══════════════════════════════════════════════════════════════
  THE MORIARTY EXPERIENCE — Case Study Model Viewer
  Handles: orbit viewer (glTF/OBJ) + 360° panorama viewer
   Usage: Add data attributes to .model-viewer-container elements
   
  Orbit:    data-viewer-type="orbit" data-model-src="assets/models/spitfire.glb"
         data-viewer-type="orbit" data-model-src="assets/Byodo-in/Byodo-in.obj"
   Panorama: data-viewer-type="panorama" data-pano-src="assets/panoramas/byodoin-4k.jpg"
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Brandmark SVG for loader
  var LOADER_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 20V4l5 8-5 8zm7 0V4l5 8-5 8zm7 0V4l5 8-5 8z"/></svg>';

  // ─── Dynamic Script Loading ───
  // Three.js + GLTFLoader are loaded on demand, not upfront
  var threeLoaded = typeof THREE !== 'undefined';
  var threeLoading = false;
  var threeCallbacks = [];

  function loadThreeJS(callback) {
    if (threeLoaded) { callback(); return; }
    threeCallbacks.push(callback);
    if (threeLoading) return;
    threeLoading = true;

    // Detect path prefix (project pages are in work/ subdirectory)
    var scripts = document.getElementsByTagName('script');
    var prefix = '';
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('model-viewer.js') !== -1) {
        prefix = scripts[i].src.replace(/model-viewer\.js.*$/, '');
        break;
      }
    }

    function finalizeThreeLoad() {
      threeLoaded = true;
      threeCallbacks.forEach(function (cb) { cb(); });
      threeCallbacks = [];
    }

    function loadOptionalScripts(basePath, onComplete) {
      var scriptsToLoad = [
        'GLTFLoader-working.js',
        'OBJLoader.js'
      ];
      var idx = 0;

      function loadNext() {
        if (idx >= scriptsToLoad.length) {
          onComplete();
          return;
        }

        var script = document.createElement('script');
        script.src = basePath + scriptsToLoad[idx++];
        script.onload = loadNext;
        script.onerror = loadNext;
        document.head.appendChild(script);
      }

      loadNext();
    }

    var threeScript = document.createElement('script');
    threeScript.src = prefix + 'three.min.js';
    threeScript.onload = function () {
      loadOptionalScripts(prefix, finalizeThreeLoad);
    };
    document.head.appendChild(threeScript);
  }

  // ─── Lazy Init via Intersection Observer ───
  function setupLazyViewers() {
    var containers = document.querySelectorAll('.model-viewer-container');
    if (!containers.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          loadThreeJS(function () {
            initViewer(entry.target);
          });
        }
      });
    }, { threshold: 0.1 });

    containers.forEach(function (el) {
      // Add loader
      var loader = document.createElement('div');
      loader.className = 'model-viewer-loader';
      loader.innerHTML = '<div class="loader-mark">' + LOADER_SVG + '</div>';
      el.appendChild(loader);

      // Add hint
      var hint = document.createElement('div');
      hint.className = 'model-viewer-hint';
      var isMobile = 'ontouchstart' in window;
      hint.textContent = isMobile ? 'Swipe to explore' : '\u21BB Drag to explore';
      el.appendChild(hint);

      observer.observe(el);
    });
  }

  // ─── Init appropriate viewer type ───
  function initViewer(container) {
    var type = container.getAttribute('data-viewer-type');
    if (type === 'panorama') {
      initPanoramaViewer(container);
    } else {
      initOrbitViewer(container);
    }
  }

  // ─── Orbit Viewer (glTF models) ───
  function initOrbitViewer(container) {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded — orbit viewer unavailable');
      return;
    }

    var modelSrc = container.getAttribute('data-model-src');
    if (!modelSrc) return;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0A0A);

    var camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 3);
    camera.far = 5000;
    camera.updateProjectionMatrix();

    var rendererEl = document.createElement('canvas');
    rendererEl.className = 'model-viewer-canvas';
    container.appendChild(rendererEl);

    var renderer = new THREE.WebGLRenderer({ canvas: rendererEl, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Lighting — studio-style, subtle
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    var fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, 1, -2);
    scene.add(fillLight);

    // Controls — constrained
    // OrbitControls must be available via THREE.OrbitControls or imported
    var controls = null;
    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableZoom = true;
      controls.minDistance = 2;
      controls.maxDistance = 5;
      controls.minPolarAngle = Math.PI / 3;
      controls.maxPolarAngle = Math.PI / 1.5;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.0;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    }

    function fitAndAddModel(model, isObj) {
      if (isObj) {
        model.traverse(function (child) {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xd7dce3,
              roughness: 0.75,
              metalness: 0.05,
              side: THREE.DoubleSide
            });
            if (child.geometry && !child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });
      }

      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z) || 1;
      var scale = 2 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      var scaledCenterY = (size.y * scale) * 0.1;
      if (controls) {
        controls.target.set(0, scaledCenterY, 0);
      }

      camera.position.set(0, Math.max(0.5, scaledCenterY + 0.3), 3.2);
      camera.lookAt(0, scaledCenterY, 0);

      scene.add(model);

      var loader = container.querySelector('.model-viewer-loader');
      if (loader) loader.classList.add('loaded');
    }

    var isObjModel = /\.obj(?:\?|#|$)/i.test(modelSrc);

    function addModelFallback() {
      var fallbackGeom = new THREE.IcosahedronGeometry(0.8, 1);
      var fallbackMat = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        roughness: 0.35,
        metalness: 0.15
      });
      var fallbackMesh = new THREE.Mesh(fallbackGeom, fallbackMat);
      scene.add(fallbackMesh);

      if (controls) {
        controls.target.set(0, 0, 0);
      }

      var loader = container.querySelector('.model-viewer-loader');
      if (loader) loader.classList.add('loaded');
    }

    if (isObjModel && THREE.OBJLoader) {
      var fileLoader = new THREE.FileLoader();
      fileLoader.setResponseType('text');
      fileLoader.load(modelSrc, function (rawText) {
        try {
          // Some exported OBJ files contain null bytes/BOM; strip these before parsing.
          var cleanText = String(rawText || '').replace(/^\uFEFF/, '').replace(/\0/g, '');
          var obj = new THREE.OBJLoader().parse(cleanText);
          fitAndAddModel(obj, true);
        } catch (parseErr) {
          console.warn('OBJ parse error:', parseErr);
          addModelFallback();
        }
      }, undefined, function (err) {
        console.warn('OBJ load error:', err);
        addModelFallback();
      });
    } else if (THREE.GLTFLoader) {
      var gltfLoader = new THREE.GLTFLoader();

      if (THREE.DRACOLoader) {
        var dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        gltfLoader.setDRACOLoader(dracoLoader);
      }

      gltfLoader.load(modelSrc, function (gltf) {
        fitAndAddModel(gltf.scene, false);
      }, undefined, function (err) {
        console.warn('Model load error:', err);
        addModelFallback();
      });
    } else {
      console.warn('No compatible loader found for model:', modelSrc);
      addModelFallback();
    }

    // Hide hint on first interaction
    var hintEl = container.querySelector('.model-viewer-hint');
    function hideHint() {
      if (hintEl) hintEl.classList.add('hidden');
      renderer.domElement.removeEventListener('pointerdown', hideHint);
    }
    renderer.domElement.addEventListener('pointerdown', hideHint);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    var resizeTO;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTO);
      resizeTO = setTimeout(function () {
        var w = container.clientWidth;
        var h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 100);
    });
  }

  // ─── 360° Panorama Viewer ───
  function initPanoramaViewer(container) {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded — panorama viewer unavailable');
      return;
    }

    var panoSrc = container.getAttribute('data-pano-src');
    if (!panoSrc) return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 1, 1100);
    camera.position.set(0, 0, 0);

    var rendererEl = document.createElement('canvas');
    rendererEl.className = 'model-viewer-canvas';
    container.appendChild(rendererEl);

    var renderer = new THREE.WebGLRenderer({ canvas: rendererEl, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Sphere with inverted normals for inside viewing
    var geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    var texture = new THREE.TextureLoader().load(panoSrc, function () {
      // Texture loaded — hide loader
      var loader = container.querySelector('.model-viewer-loader');
      if (loader) loader.classList.add('loaded');
    });

    var material = new THREE.MeshBasicMaterial({ map: texture });
    var sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Drag-to-look controls (manual, no OrbitControls needed for pano)
    var isDown = false;
    var startX = 0, startY = 0;
    var lon = 0, lat = 0;
    var lonDelta = 0, latDelta = 0;
    var autoRotateSpeed = 0.02;

    rendererEl.addEventListener('pointerdown', function (e) {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      // Hide hint
      var hintEl = container.querySelector('.model-viewer-hint');
      if (hintEl) hintEl.classList.add('hidden');
    });

    document.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      lonDelta = (startX - e.clientX) * 0.15;
      latDelta = (e.clientY - startY) * 0.15;
      lon += lonDelta;
      lat += latDelta;
      lat = Math.max(-30, Math.min(30, lat));
      startX = e.clientX;
      startY = e.clientY;
    });

    document.addEventListener('pointerup', function () {
      isDown = false;
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Auto-rotate when not dragging
      if (!isDown) {
        lon += autoRotateSpeed;
      }

      var phi = THREE.MathUtils.degToRad(90 - lat);
      var theta = THREE.MathUtils.degToRad(lon);

      var target = new THREE.Vector3();
      target.x = 500 * Math.sin(phi) * Math.cos(theta);
      target.y = 500 * Math.cos(phi);
      target.z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(target);
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    var resizeTO;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTO);
      resizeTO = setTimeout(function () {
        var w = container.clientWidth;
        var h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 100);
    });
  }

  // ─── Init ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLazyViewers);
  } else {
    setupLazyViewers();
  }
})();
