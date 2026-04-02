AFRAME.components.text.schema.font.default = "kelsonsans";

// A-frame component used for camera position tracking
AFRAME.registerComponent("face-user", {
  init: function () {
    // Helper vectors to avoid creating new ones every frame (saves memory)
    this.cameraPos = new THREE.Vector3();
    this.panelPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
  },

  tick: function () {
    const cameraEl = document.querySelector("#camera");
    if (!cameraEl) return;

    const object3D = this.el.object3D;

    // 1. Get the camera's position in the world
    cameraEl.object3D.getWorldPosition(this.cameraPos);

    // 2. Get the panel's position in the world
    object3D.getWorldPosition(this.panelPos);

    // 3. Create a target at the same height as the panel to prevent tilting
    this.targetPos.set(this.cameraPos.x, this.panelPos.y, this.cameraPos.z);

    // 4. Look at the target
    object3D.lookAt(this.targetPos);

    // 5. If the panel faces backwards after this, uncomment the line below:
    // object3D.rotateY(Math.PI);
  },
});

AFRAME.registerComponent("phys-grab", {
  init: function () {
    this.grabbingHand = null;
    this.grabDistance = 0; // Store the initial distance

    this.el.addEventListener("mousedown", (evt) => {
      this.grabbingHand = evt.detail.cursorEl;

      if (this.grabbingHand && this.el.object3D) {
        // 1. Calculate the initial distance between hand and object
        const handPos = new THREE.Vector3();
        const objPos = new THREE.Vector3();
        this.grabbingHand.object3D.getWorldPosition(handPos);
        this.el.object3D.getWorldPosition(objPos);

        this.grabDistance = handPos.distanceTo(objPos);
      }

      if (this.el.body) {
        this.el.body.type = window.CANNON.Body.KINEMATIC;
      }
    });

    this.el.addEventListener("mouseup", () => {
      if (this.el.body) {
        this.el.body.type = window.CANNON.Body.DYNAMIC;
      }
      this.grabbingHand = null;
    });
  },

  tick: function () {
    if (this.grabbingHand && this.el.object3D) {
      const handPos = new THREE.Vector3();
      const raycaster = this.grabbingHand.components.raycaster;

      if (raycaster) {
        // 1. Get the exact starting point of the ray (the controller tip)
        this.grabbingHand.object3D.getWorldPosition(handPos);

        // 2. Get the Raycaster's actual direction vector
        // This accounts for any offsets or custom "origin" points in your raycaster config
        const direction = new THREE.Vector3().copy(
          raycaster.raycaster.ray.direction,
        );

        // 3. Calculate the new position along that exact line
        const targetPos = new THREE.Vector3()
          .copy(handPos)
          .add(direction.multiplyScalar(this.grabDistance));

        // 4. Apply to the object
        this.el.object3D.position.copy(targetPos);

        // Sync Physics
        if (this.el.body) {
          this.el.body.position.copy(targetPos);
          this.el.body.velocity.set(0, 0, 0);
          this.el.body.angularVelocity.set(0, 0, 0);
        }
      }
    }
  },
});

AFRAME.registerComponent("water-logic", {
  schema: {
    fullness: { type: "number", default: 0.6 },
    color: { type: "color", default: "#394552" },
  },

  init: function () {
    this.waterEl = document.createElement("a-circle");
    this.waterEl.setAttribute("radius", 0.03); // Slightly smaller than the 0.05 box
    this.waterEl.setAttribute("material", {
      shader: "flat",
      color: this.data.color,
      transparent: true,
      opacity: 0.7,
      side: "double",
      depthTest: false,
    });
    this.el.appendChild(this.waterEl);
    this.worldQuat = new THREE.Quaternion();
  },

  tick: function () {
    if (!this.waterEl) return;

    // 1. Position the water based on fullness inside the box
    // Box height is 0.05, so bottom is -0.025
    const yPos = this.data.fullness * 0.05 - 0.025;
    this.waterEl.object3D.position.set(0, yPos, 0);

    // 2. Keep it level
    this.el.object3D.getWorldQuaternion(this.worldQuat);
    this.waterEl.object3D.quaternion.copy(this.worldQuat).invert();
    this.waterEl.object3D.rotateX(Math.PI / -2);
  },
});

AFRAME.registerComponent("sensor-logic", {
  init: function () {
    this.el.addEventListener("collide", (e) => {
      const collidedEl = e.detail.body.el;
      if (!collidedEl || !ScenarioManager.awaitingPhysicalAction) return;

      const grabComp = collidedEl.components["phys-grab"];
      const isBeingHeld = grabComp && grabComp.grabbingHand;

      if (!isBeingHeld) {
        const currentTask = ScenarioManager.current;

        // Validation for Bottles
        if (currentTask.requiredPct) {
          const placedPct = parseInt(collidedEl.dataset.pct);

          if (placedPct !== currentTask.requiredPct) {
            ScenarioManager.updateUI(
              `Foutieve flacon! Je hebt ${placedPct}% gepakt. Pak de juiste flacon.`,
              "#ff6b6b",
              false,
            );
            return; // STOP HERE
          }
        }

        // SUCCESS
        ScenarioManager.onPhysicalActionComplete();
        collidedEl.setAttribute("dynamic-body", "static: true");

        setTimeout(() => {
          collidedEl.setAttribute("visible", "false");
          collidedEl.setAttribute("position", "0 -10 0");
          collidedEl.removeAttribute("static-body");
        }, 3000);
      }
    });
  },
});
