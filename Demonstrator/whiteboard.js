const WhiteboardManager = {
  canvas: null,
  ctx: null,
  activeRaycaster: null,
  isDrawing: false,
  lastPos: null,

  smoothingFactor: 0.2,
  smoothedPos: null,

  init() {
    this.canvas = document.getElementById("drawing-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");

    const board = document.querySelector("#whiteboard-canvas-area");
    if (!board) return;

    this.clear();

    // 1. Listen for Mousedown (Desktop/Cursor)
    board.addEventListener("mousedown", (evt) => {
      this.isDrawing = true;
      // In A-Frame, evt.detail.cursorEl is the entity that clicked
      this.activeRaycaster =
        evt.detail.cursorEl || document.querySelector("#camera a-cursor");
    });

    // 2. Listen for Triggerdown (VR Controllers / Emulator)
    const hands = document.querySelectorAll(
      "[oculus-touch-controls], [laser-controls]",
    );
    hands.forEach((hand) => {
      hand.addEventListener("triggerdown", () => {
        // Only start if THIS hand is actually pointing at the board
        const raycaster = hand.components.raycaster;
        if (raycaster && raycaster.getIntersection(board)) {
          this.isDrawing = true;
          this.activeRaycaster = hand;
        }
      });
      hand.addEventListener("triggerup", () => {
        this.isDrawing = false;
        this.lastPos = null; // Clean break between strokes
        this.activeRaycaster = null;
      });
    });

    window.addEventListener("mouseup", () => {
      this.isDrawing = false;
      this.activeRaycaster = null;
    });

    // 3. START THE LOOP
    this.runLoop();
  },

  runLoop() {
    this.tick();
    // 16ms is roughly 60fps. This is the "sweet spot" for performance.
    setTimeout(() => this.runLoop(), 16);
  },

  tick() {
    // 1. New Visibility Check:
    const notesTab = document.querySelector("#content-notes");
    if (!notesTab || notesTab.getAttribute("visible") === false) {
      this.isDrawing = false;
      this.lastPos = null;
      this.smoothedPos = null;
      return;
    }

    if (!this.isDrawing || !this.activeRaycaster) {
      this.lastPos = null;
      this.smoothedPos = null;
      return;
    }

    const board = document.querySelector("#whiteboard-canvas-area");
    const raycasterComp = this.activeRaycaster.components.raycaster;
    if (!raycasterComp) return;

    const intersection = raycasterComp.getIntersection(board);

    if (intersection && intersection.uv) {
      const uv = intersection.uv;
      const targetX = uv.x * this.canvas.width;
      const targetY = (1 - uv.y) * this.canvas.height;

      // --- SMOOTHING LOGIC ---
      if (!this.smoothedPos) {
        // First frame of the stroke, just jump to target
        this.smoothedPos = { x: targetX, y: targetY };
      } else {
        // Interpolate (Lerp) towards the target
        this.smoothedPos.x += (targetX - this.smoothedPos.x) * this.smoothingFactor;
        this.smoothedPos.y += (targetY - this.smoothedPos.y) * this.smoothingFactor;
      }

      this.drawAt(this.smoothedPos.x, this.smoothedPos.y);
    } else {
      this.lastPos = null;
      this.smoothedPos = null;
    }
  },

  drawAt(x, y) {
    this.ctx.strokeStyle = "#1f64ee";
    this.ctx.lineWidth = 3;
    this.ctx.lineJoin = "round";
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    if (this.lastPos) {
      // Draw a line from the last recorded spot to the new one
      this.ctx.moveTo(this.lastPos.x, this.lastPos.y);
      this.ctx.lineTo(x, y);
    } else {
      // If this is the very first dot of a stroke, just draw a tiny line to itself
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y);
    }

    this.ctx.stroke();

    // Save the current position for the next frame
    this.lastPos = { x, y };
    this.updateTexture();
  },

  updateTexture() {
    const board = document.querySelector("#whiteboard-canvas-area");
    if (!board) return;
    const mesh = board.getObject3D("mesh");
    if (mesh && mesh.material.map) {
      mesh.material.map.needsUpdate = true;
    }
  },

  clear() {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = "#e0e0e0";
    this.ctx.lineWidth = 1;
    for (let i = 40; i < this.canvas.height; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
    this.updateTexture(); // This pushes the "white" canvas back to the 3D model

    console.log("Cleared whiteboard");
  },
};
