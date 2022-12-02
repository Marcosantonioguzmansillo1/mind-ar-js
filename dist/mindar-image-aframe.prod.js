const { Controller: u, UI: m } = window.MINDAR.IMAGE;
AFRAME.registerSystem("mindar-image-system", {
  container: null,
  video: null,
  processingImage: !1,
  init: function() {
    this.anchorEntities = [];
  },
  tick: function() {
  },
  setup: function({ imageTargetSrc: t, maxTrack: e, showStats: i, uiLoading: a, uiScanning: s, uiError: o, missTolerance: n, warmupTolerance: h, filterMinCF: l, filterBeta: c }) {
    this.imageTargetSrc = t, this.maxTrack = e, this.filterMinCF = l, this.filterBeta = c, this.missTolerance = n, this.warmupTolerance = h, this.showStats = i, this.ui = new m({ uiLoading: a, uiScanning: s, uiError: o });
  },
  registerAnchor: function(t, e) {
    this.anchorEntities.push({ el: t, targetIndex: e });
  },
  start: function() {
    this.container = this.el.sceneEl.parentNode, this.showStats && (this.mainStats = new Stats(), this.mainStats.showPanel(0), this.mainStats.domElement.style.cssText = "position:absolute;top:0px;left:0px;z-index:999", this.container.appendChild(this.mainStats.domElement)), this.ui.showLoading(), this._startVideo();
  },
  switchTarget: function(t) {
    this.controller.interestedTargetIndex = t;
  },
  stop: function() {
    this.pause(), this.video.srcObject.getTracks().forEach(function(e) {
      e.stop();
    }), this.video.remove();
  },
  pause: function(t = !1) {
    t || this.video.pause(), this.controller.stopProcessVideo();
  },
  unpause: function() {
    this.video.play(), this.controller.processVideo(this.video);
  },
  _startVideo: function() {
    if (this.video = document.createElement("video"), this.video.setAttribute("autoplay", ""), this.video.setAttribute("muted", ""), this.video.setAttribute("playsinline", ""), this.video.style.position = "absolute", this.video.style.top = "0px", this.video.style.left = "0px", this.video.style.zIndex = "-2", this.container.appendChild(this.video), !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.el.emit("arError", { error: "VIDEO_FAIL" }), this.ui.showCompatibility();
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: !1, video: {
      facingMode: "environment"
    } }).then((t) => {
      this.video.addEventListener("loadedmetadata", () => {
        this.video.setAttribute("width", this.video.videoWidth), this.video.setAttribute("height", this.video.videoHeight), this._startAR();
      }), this.video.srcObject = t;
    }).catch((t) => {
      console.log("getUserMedia error", t), this.el.emit("arError", { error: "VIDEO_FAIL" });
    });
  },
  _startAR: async function() {
    const t = this.video;
    this.container, this.controller = new u({
      inputWidth: t.videoWidth,
      inputHeight: t.videoHeight,
      maxTrack: this.maxTrack,
      filterMinCF: this.filterMinCF,
      filterBeta: this.filterBeta,
      missTolerance: this.missTolerance,
      warmupTolerance: this.warmupTolerance,
      onUpdate: (i) => {
        if (i.type === "processDone")
          this.mainStats && this.mainStats.update();
        else if (i.type === "updateMatrix") {
          const { targetIndex: a, worldMatrix: s } = i;
          for (let o = 0; o < this.anchorEntities.length; o++)
            this.anchorEntities[o].targetIndex === a && (this.anchorEntities[o].el.updateWorldMatrix(s), s && this.ui.hideScanning());
        }
      }
    }), this._resize(), window.addEventListener("resize", this._resize.bind(this));
    const { dimensions: e } = await this.controller.addImageTargets(this.imageTargetSrc);
    for (let i = 0; i < this.anchorEntities.length; i++) {
      const { el: a, targetIndex: s } = this.anchorEntities[i];
      s < e.length && a.setupMarker(e[s]);
    }
    await this.controller.dummyRun(this.video), this.el.emit("arReady"), this.ui.hideLoading(), this.ui.showScanning(), this.controller.processVideo(this.video);
  },
  _resize: function() {
    const t = this.video, e = this.container;
    let i, a;
    const s = t.videoWidth / t.videoHeight, o = e.clientWidth / e.clientHeight;
    s > o ? (a = e.clientHeight, i = a * s) : (i = e.clientWidth, a = i / s);
    const n = this.controller.getProjectionMatrix(), h = 2 * Math.atan(1 / n[5] / a * e.clientHeight) * 180 / Math.PI, l = n[14] / (n[10] - 1), c = n[14] / (n[10] + 1);
    n[5] / n[0];
    const d = e.clientWidth / e.clientHeight, r = e.getElementsByTagName("a-camera")[0].getObject3D("camera");
    r.fov = h, r.aspect = d, r.near = l, r.far = c, r.updateProjectionMatrix(), this.video.style.top = -(a - e.clientHeight) / 2 + "px", this.video.style.left = -(i - e.clientWidth) / 2 + "px", this.video.style.width = i + "px", this.video.style.height = a + "px";
  }
});
AFRAME.registerComponent("mindar-image", {
  dependencies: ["mindar-image-system"],
  schema: {
    imageTargetSrc: { type: "string" },
    maxTrack: { type: "int", default: 1 },
    filterMinCF: { type: "number", default: -1 },
    filterBeta: { type: "number", default: -1 },
    missTolerance: { type: "int", default: -1 },
    warmupTolerance: { type: "int", default: -1 },
    showStats: { type: "boolean", default: !1 },
    autoStart: { type: "boolean", default: !0 },
    uiLoading: { type: "string", default: "yes" },
    uiScanning: { type: "string", default: "yes" },
    uiError: { type: "string", default: "yes" }
  },
  init: function() {
    const t = this.el.sceneEl.systems["mindar-image-system"];
    t.setup({
      imageTargetSrc: this.data.imageTargetSrc,
      maxTrack: this.data.maxTrack,
      filterMinCF: this.data.filterMinCF === -1 ? null : this.data.filterMinCF,
      filterBeta: this.data.filterBeta === -1 ? null : this.data.filterBeta,
      missTolerance: this.data.missTolerance === -1 ? null : this.data.missTolerance,
      warmupTolerance: this.data.warmupTolerance === -1 ? null : this.data.warmupTolerance,
      showStats: this.data.showStats,
      uiLoading: this.data.uiLoading,
      uiScanning: this.data.uiScanning,
      uiError: this.data.uiError
    }), this.data.autoStart && this.el.sceneEl.addEventListener("renderstart", () => {
      t.start();
    });
  }
});
AFRAME.registerComponent("mindar-image-target", {
  dependencies: ["mindar-image-system"],
  schema: {
    targetIndex: { type: "number" }
  },
  postMatrix: null,
  init: function() {
    this.el.sceneEl.systems["mindar-image-system"].registerAnchor(this, this.data.targetIndex);
    const e = this.el.object3D;
    e.visible = !1, e.matrixAutoUpdate = !1;
  },
  setupMarker([t, e]) {
    const i = new AFRAME.THREE.Vector3(), a = new AFRAME.THREE.Quaternion(), s = new AFRAME.THREE.Vector3();
    i.x = t / 2, i.y = t / 2 + (e - t) / 2, s.x = t, s.y = t, s.z = t, this.postMatrix = new AFRAME.THREE.Matrix4(), this.postMatrix.compose(i, a, s);
  },
  updateWorldMatrix(t) {
    if (!this.el.object3D.visible && t !== null ? this.el.emit("targetFound") : this.el.object3D.visible && t === null && this.el.emit("targetLost"), this.el.object3D.visible = t !== null, t !== null) {
      var e = new AFRAME.THREE.Matrix4();
      e.elements = t, e.multiply(this.postMatrix), this.el.object3D.matrix = e;
    }
  }
});
