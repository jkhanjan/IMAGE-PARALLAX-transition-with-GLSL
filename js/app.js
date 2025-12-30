import * as THREE from "three";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import GUI from "lil-gui";
import gsap, { TimelineMax } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import img1 from "../img1.jpg";
import img2 from "../img2.jpg";
import img3 from "../img3.jpg";
import img4 from "../5.png";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { RippleShader } from "./effect1";
import { CurtainShader } from "./effect3";
import { RGBShader } from "./effect2";

export default class Sketch {
  constructor(selector) {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111, 1);
    this.container = document.getElementById("container");
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );

    this.camera.position.set(0, 0, 900);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    this.mouse = new THREE.Vector2();
    this.mouseTarget = new THREE.Vector2();
    this.paused = false;

    // Track current image and animation state
    this.currentImageIndex = 0;
    this.totalImages = 3;
    this.isAnimating = false;

    // Text content for each page
    this.textContent = ["IMAGE &", "PARALLAX", "TRANSITION"];

    this.setupResize();
    this.setupMouseEvents();
    this.setupClickEvents();
    this.addObjects();
    this.createTextOverlay();
    this.initPost();
    this.resize();
    this.render();
    this.settings();
  }
  createTextOverlay() {
    this.textOverlay = document.createElement("div");
    Object.assign(this.textOverlay.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      fontSize: "6vw",
      fontWeight: "300",
      color: "white",
      pointerEvents: "none",
      userSelect: "none",
      fontFamily: "Arial, sans-serif",
      letterSpacing: "0.1em",
      zIndex: "10",
    });

    this.textOverlay.textContent = this.textContent[0];
    this.container.style.position = "relative";
    this.container.appendChild(this.textOverlay);

    gsap.set(this.textOverlay, {
      xPercent: -50,
      yPercent: -50,
    });
  }

  updateTextContent(index) {
    gsap.to(this.textOverlay, {
      yPercent: -150,
      opacity: 0,
      duration: 0.85,
      ease: "power2.in",
      onComplete: () => {
        this.textOverlay.textContent = this.textContent[index];

        gsap.set(this.textOverlay, {
          yPercent: 150,
        });

        gsap.to(this.textOverlay, {
          yPercent: -50,
          opacity: 1,
          duration: 0.85,
          ease: "power2.out",
        });
      },
    });
  }

  initPost() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.effectPass = new ShaderPass(RippleShader);
    this.composer.addPass(this.effectPass);

    this.effectPass1 = new ShaderPass(RGBShader);
    this.composer.addPass(this.effectPass1);

    this.effectPass2 = new ShaderPass(CurtainShader);
    this.composer.addPass(this.effectPass2);
  }

  setupMouseEvents() {
    const handleMouseMove = (e) => {
      this.mouse.x = (e.clientX / this.width) * 2 - 1;
      this.mouse.y = -(e.clientY / this.height) * 2 + 1;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.mouse.x = (touch.clientX / this.width) * 2 - 1;
        this.mouse.y = -(touch.clientY / this.height) * 2 + 1;
      }
    };

    this.renderer.domElement.addEventListener("mousemove", handleMouseMove);
    this.renderer.domElement.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });

    this.eventHandlers = {
      mousemove: handleMouseMove,
      touchmove: handleTouchMove,
    };
  }

  setupClickEvents() {
    const handleClick = () => {
      if (!this.isAnimating) {
        this.navigateToNextImage();
      }
    };

    const handleTouch = (e) => {
      if (!this.isAnimating) {
        e.preventDefault();
        this.navigateToNextImage();
      }
    };

    this.renderer.domElement.addEventListener("click", handleClick);
    this.renderer.domElement.addEventListener("touchend", handleTouch);

    // Store handlers for cleanup
    this.eventHandlers.click = handleClick;
    this.eventHandlers.touchend = handleTouch;
  }

  navigateToNextImage() {
    const nextIndex = (this.currentImageIndex + 1) % this.totalImages;
    this.animateToImage(nextIndex);
  }

  animateToImage(targetIndex) {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const targetX = targetIndex * 2100;

    const currentIndex = this.currentImageIndex;
    const toIndex = targetIndex;

    // Update text content
    this.updateTextContent(targetIndex);

    let tl = gsap.timeline({
      onComplete: () => {
        this.currentImageIndex = targetIndex;
        this.isAnimating = false;
      },
    });

    tl.to(this.camera.position, {
      x: targetX,
      duration: 1.7,
      ease: "power2.inOut",
    });

    tl.to(
      this.camera.position,
      {
        z: 700,
        duration: 1.2,
        ease: "power2.inOut",
      },
      0
    );

    tl.to(
      this.camera.position,
      {
        z: 900,
        duration: 1,
        ease: "power2.inOut",
      },
      1
    );

    if (currentIndex === 0 && toIndex === 1) {
      // Ripple effect forward
      tl.to(
        this.effectPass2.uniforms.uProgress,
        {
          value: 1,
          duration: 1,
          ease: "power2.inOut",
        },
        0
      );

      // Ripple effect backward
      tl.to(
        this.effectPass2.uniforms.uProgress,
        {
          value: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        1
      );

      // RGB effect forward
      tl.to(
        this.effectPass1.uniforms.uProgress,
        {
          value: 1,
          duration: 1,
          ease: "power3.inOut",
        },
        0
      );

      // RGB effect backward
      tl.to(
        this.effectPass1.uniforms.uProgress,
        {
          value: 0,
          duration: 1,
          ease: "power3.inOut",
        },
        1
      );
    }

    if (currentIndex === 1 && toIndex === 2) {
      // Ripple effect forward
      tl.to(
        this.effectPass.uniforms.uProgress,
        {
          value: 1,
          duration: 1,
          ease: "power2.inOut",
        },
        0
      );

      // Ripple effect backward
      tl.to(
        this.effectPass.uniforms.uProgress,
        {
          value: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        1
      );

      // RGB effect forward
      tl.to(
        this.effectPass1.uniforms.uProgress,
        {
          value: 1,
          duration: 1,
          ease: "power3.inOut",
        },
        0
      );

      // RGB effect backward
      tl.to(
        this.effectPass1.uniforms.uProgress,
        {
          value: 0,
          duration: 1,
          ease: "power3.inOut",
        },
        1
      );
    }

    if (currentIndex === 2 && toIndex === 0) {
      // Ripple effect forward
      tl.to(
        this.effectPass.uniforms.uProgress,
        {
          value: 1,
          duration: 1,
          ease: "power2.inOut",
        },
        0
      );

      // Ripple effect backward
      tl.to(
        this.effectPass.uniforms.uProgress,
        {
          value: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        1
      );
    }
  }

  settings() {
    let that = this;
    this.settings = {
      time: 0,
      progress1: 0,
      currentImage: 0,
      goToNext: () => {
        this.navigateToNextImage();
      },
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "time", 0, 100, 0.01);
    this.gui.add(this.settings, "progress1", 0, 1, 0.01).onChange((val) => {
      this.effectPass.uniforms.uProgress.value = val;
    });
    this.gui.add(this.settings, "currentImage", 0, 2, 1).onChange((val) => {
      if (!this.isAnimating) {
        this.animateToImage(Math.round(val));
      }
    });
    this.gui.add(this.settings, "goToNext");
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.textures = [img3, img1, img2];
    this.maskTexture = new THREE.TextureLoader().load(img4);
    this.textures = this.textures.map((t) => new THREE.TextureLoader().load(t));
    this.geometry = new THREE.PlaneGeometry(1980, 1080, 1, 1);
    this.group = [];

    this.textures.forEach((t, j) => {
      let group = new THREE.Group();
      this.scene.add(group);
      this.group.push(group);

      for (let i = 0; i < 3; i++) {
        let m = new THREE.MeshBasicMaterial({
          map: t,
        });

        if (i > 0) {
          m = new THREE.MeshBasicMaterial({
            map: t,
            alphaMap: this.maskTexture,
            transparent: true,
            side: THREE.DoubleSide,
          });
          m.opacity = 1;
        }

        let mesh = new THREE.Mesh(this.geometry, m);
        mesh.position.z = (i + 1) * 20;
        group.add(mesh);
        group.position.x = j * 2100;
      }
    });
  }

  stop() {
    this.paused = true;
  }

  play() {
    this.paused = false;
    this.render();
  }

  dispose() {
    if (this.eventHandlers) {
      this.renderer.domElement.removeEventListener(
        "mousemove",
        this.eventHandlers.mousemove
      );
      this.renderer.domElement.removeEventListener(
        "touchmove",
        this.eventHandlers.touchmove
      );
      this.renderer.domElement.removeEventListener(
        "click",
        this.eventHandlers.click
      );
      this.renderer.domElement.removeEventListener(
        "touchend",
        this.eventHandlers.touchend
      );
    }

    // Clean up text overlay
    if (this.textOverlay && this.textOverlay.parentNode) {
      this.textOverlay.parentNode.removeChild(this.textOverlay);
    }
  }

  render() {
    if (this.paused) return;
    this.time += 0.05;
    this.oscillation = Math.sin(this.time * 0.3) * 0.5 + 0.5;

    // Apply parallax effect to text
    if (this.textOverlay) {
      const parallaxX = this.mouse.x * 30; // Adjust intensity
      const parallaxY = -this.mouse.y * 30;
      this.textOverlay.style.transform = `translate(calc(-50% + ${parallaxX}px), calc(-50% + ${parallaxY}px))`;
    }

    this.group.forEach((g) => {
      g.rotation.x = this.mouse.y * -0.1;
      g.rotation.y = this.mouse.x * -0.1;
      g.children.forEach((mesh, i) => {
        mesh.position.z = (i + 1) * 100 - this.oscillation * 50;
      });
    });

    requestAnimationFrame(this.render.bind(this));
    this.composer.render();
  }
}

new Sketch("container");
