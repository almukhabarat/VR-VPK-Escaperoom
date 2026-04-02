const EPS = 0.1;

// Checkpoint Component

if (!AFRAME.components['checkpoint']) {
    AFRAME.registerComponent('checkpoint', {
        schema: { x: {default: 0}, y: {default: 0}, z: {default: 0} },
        getOffset: function () {
            return new THREE.Vector3(this.data.x, this.data.y, this.data.z);
        }
    });
}


// Checkpoint Controls

if (!AFRAME.components['checkpoint-controls']) {
    AFRAME.registerComponent('checkpoint-controls', {
        schema: {
            enabled: {default: true},
            mode: {default: 'animate', oneOf: ['teleport', 'animate']},
            animateSpeed: {default: 3.0}
        },

        init: function () {
            this.active = true;
            this.checkpoint = null;
            this.offset = new THREE.Vector3();
            this.position = new THREE.Vector3();
            this.targetPosition = new THREE.Vector3();
        },

        setCheckpoint: function(checkpoint) {
            if (!this.active || this.checkpoint === checkpoint) return;
            this.checkpoint = checkpoint;

            if (this.data.mode === 'teleport') {
                // Instant teleport
                this.checkpoint.object3D.getWorldPosition(this.targetPosition);
                this.targetPosition.add(this.checkpoint.components.checkpoint.getOffset());
                this.el.setAttribute('position', this.targetPosition);
                this.checkpoint = null;
            }
        },

        isVelocityActive: function () {
            return !!(this.active && this.checkpoint && this.data.mode === 'animate');
        },

        getVelocity: function() {
            if (!this.isVelocityActive()) return new THREE.Vector3(0,0,0);
            this.sync();
            const distance = this.position.distanceTo(this.targetPosition);
            if (distance < EPS) {
                this.checkpoint = null;
                return new THREE.Vector3(0,0,0);
            }
            this.offset.setLength(this.data.animateSpeed);
            return this.offset;
        },

        sync: function() {
            if (!this.checkpoint) return;
            this.position.copy(this.el.getAttribute('position'));
            this.checkpoint.object3D.getWorldPosition(this.targetPosition);
            this.targetPosition.add(this.checkpoint.components.checkpoint.getOffset());
            this.offset.copy(this.targetPosition).sub(this.position);
        }
    });
}


// Rig Movement

if (!AFRAME.components['rig-movement']) {
    AFRAME.registerComponent('rig-movement', {
        tick: function (time, delta) {
            const rig = this.el;
            const cc = rig.components['checkpoint-controls'];
            if (cc && cc.isVelocityActive()) {
                const velocity = cc.getVelocity();
                const moveDelta = velocity.clone().multiplyScalar(delta / 1000);
                rig.object3D.position.add(moveDelta);
            }
        }
    });
}

// Checkpoint Hover & Click Logic

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.checkpoint').forEach(checkpoint => {
        // Hover effect
        checkpoint.addEventListener('mouseenter', () => checkpoint.setAttribute('material', 'color', '#6fc6fc'));
        checkpoint.addEventListener('mouseleave', () => checkpoint.setAttribute('material', 'color', '#bbb'));

        // Standard Click (Works for Desktop and often VR Raycasters)
        checkpoint.addEventListener('click', () => {
            const rig = document.querySelector('#rig');
            rig.components['checkpoint-controls'].setCheckpoint(checkpoint);
        });

        // VR Controller Trigger Fix
        // We listen to the controller itself, or ensure the event bubbles
        checkpoint.addEventListener('triggerdown', (evt) => {
            // A-Frame laser-controls usually synthesize a 'click' event.
            // If they don't, we force the checkpoint setting here.
            const rig = document.querySelector('#rig');
            rig.components['checkpoint-controls'].setCheckpoint(checkpoint);
        });
    });
});

AFRAME.registerComponent('door-trigger', {
    schema: {
        target: { type: 'selector' }
    },

    init: function () {
        this.player = document.querySelector('#camera');
        this.prompt = this.data.target;
        this.door = this.el;

        this.isNear = false;

        this.doorWorldPos = new THREE.Vector3();
        this.playerWorldPos = new THREE.Vector3();

        this.buttons = this.prompt.querySelectorAll('.door-button');
    },

    tick: function () {
        this.door.object3D.getWorldPosition(this.doorWorldPos);
        this.player.object3D.getWorldPosition(this.playerWorldPos);

        const distance = this.doorWorldPos.distanceTo(this.playerWorldPos);

        if (distance < 1.5) {
            if (!this.isNear) {
                this.prompt.setAttribute('visible', true);

                this.buttons.forEach(btn => {
                    btn.classList.add('interactable');
                });

                this.isNear = true;
            }
        } else {
            if (this.isNear) {
                this.prompt.setAttribute('visible', false);

                this.buttons.forEach(btn => {
                    btn.classList.remove('interactable');
                });

                this.isNear = false;
            }
        }
    }

});

document.addEventListener('DOMContentLoaded', () => {
    const rig = document.querySelector('#rig');
    const thirdCheckpoint = document.querySelectorAll('.checkpoint')[2]; // third checkpoint
    const keypadTrigger = document.querySelector('#keypad-trigger');
    const keypad = document.querySelector('#keypad');

    if (!rig || !thirdCheckpoint || !keypadTrigger || !keypad) return;

    let isNear = false;

    // Component to enable trigger after reaching third checkpoint
    AFRAME.registerComponent('checkpoint-keypad-trigger', {
        init: function() {
            // Initialize once to save memory
            this.playerPos = new THREE.Vector3();
            this.checkpointPos = new THREE.Vector3();
        },
        tick: function () {
            this.el.object3D.getWorldPosition(this.playerPos);
            thirdCheckpoint.object3D.getWorldPosition(this.checkpointPos);

            const distance = this.playerPos.distanceTo(this.checkpointPos);

            if (distance < 1.5 && !isNear) {
                keypadTrigger.classList.add('interactable');
                isNear = true;
            }
        }
    });

    rig.setAttribute('checkpoint-keypad-trigger', '');

    keypadTrigger.addEventListener('click', () => {
        keypad.setAttribute('visible', true);

        // Enable all keypad buttons
        keypad.querySelectorAll('.keypad-button').forEach(btn => {
            btn.classList.add('interactable');
        });

        keypadTrigger.addEventListener('click', () => {
            const isVisible = keypad.getAttribute('visible');
            if (isVisible) {
                // Hide trigger again
                keypad.setAttribute('visible', false);
            } else {
                keypad.setAttribute('visible', true);
            }
        });

    });
});

document.addEventListener('DOMContentLoaded', () => {
    const keypadTrigger = document.querySelector('#keypad-trigger');
    if (!keypadTrigger) return;

    // Hover effect
    keypadTrigger.addEventListener('mouseenter', () => {
        keypadTrigger.setAttribute('visible', true);
        keypadTrigger.setAttribute('opacity', 0.6);
    });

    keypadTrigger.addEventListener('mouseleave', () => {
        keypadTrigger.setAttribute('visible', false);
    });

});

