const GameManager = {
  activeConfig: null,
  allConfigs: [],
  // (global reference for animation triggering)
  activeAnimationListener: null,

  audioSprites: {
    short_cough: { start: 0.0, duration: 2.2 }, // Adjust these to your .ogg
    severe_cough: { start: 8.0, duration: 2.0 },
  },

  hideHallway() {
    const hallway = document.querySelector('[gltf-model="#hallway"]');
    if (hallway) hallway.setAttribute("visible", false);
  },

  hideUI(el) {
    const menu = el.closest('[id^="enter-prompt"]');
    if (!menu) return;

    const loadingIndicator = menu.querySelector(".loading-indicator");

    Array.from(menu.children).forEach((child) => {
      if (child !== loadingIndicator) {
        child.setAttribute("visible", "false");
        child.classList.remove("interactable");
      }
    });

    if (loadingIndicator) {
      loadingIndicator.setAttribute("visible", "true");
    }
  },

  hideCheckpoints() {
    const container = document.querySelector("#checkpoint-container");
    if (!container) return;

    container.setAttribute("visible", false);

    //disable raycasting
    container.querySelectorAll(".checkpoint").forEach((cp) => {
      cp.classList.remove("checkpoint");
    });
  },

  launchSimulation(index) {
    this.allConfigs = Object.values(SCENARIO_CONFIGS);

    console.log(`Selected scenario is ${index}.`);
    this.activeConfig = this.allConfigs[index] || this.allConfigs[0];
    const config = this.activeConfig;
    let activeRig = "";

    const menuPlane = document.querySelector(".door-menu");
    const loadingIndicator = document.querySelector(".loading-indicator");
    let container;
    if (index === 0) {
      container = document.querySelector("#room-a-simulation-container");
      activeRig = "#rig";

      const backdrop = document.createElement("a-plane");
      backdrop.id = "room-1-backdrop"; // Assign the ID here
      backdrop.setAttribute("src", "#city-backdrop");
      backdrop.setAttribute("width", "40");
      backdrop.setAttribute("height", "20");
      backdrop.setAttribute("position", "-5 -1.5 3"); 
      backdrop.setAttribute("rotation", "-3 90 0"); 
      backdrop.setAttribute("material", "shader: flat; side: double;");
      
      // Start it as hidden if you want to trigger it later
      backdrop.setAttribute("visible", "false"); 
      
      container.appendChild(backdrop);
    } else {
      container = document.querySelector("#room-b-simulation-container");
      activeRig = "#playerRig";
    }

    const playerRig = document.querySelector(activeRig);

    // Hide all menu elements except the loading indicator
    Array.from(menuPlane.children).forEach((child) => {
      if (child !== loadingIndicator) {
        child.setAttribute("visible", "false");
        // Also remove interactable class so they can't be clicked while loadings
        child.classList.remove("interactable");
      }
    });
    this.hideHallway();
    this.hideCheckpoints();

    // Show the loading text
    loadingIndicator.setAttribute("visible", "true");

    // Global UI Sound Entity
    const uiSound = document.createElement("a-entity");
    uiSound.setAttribute("id", "ui-sound-player");
    // Save reference for easy access
    this.uiSoundEntity = uiSound;
    uiSound.setAttribute("sound", {
      src: "#success-sfx",
      autoplay: false,
      positional: false, // Volume is the same everywhere
      volume: 0.5,
    });
    container.appendChild(uiSound);

    // Spawn the Hospital Room
    const room = document.createElement("a-entity");
    room.setAttribute("gltf-model", config.roomModel);
    room.setAttribute("visible", "false");
    room.setAttribute("position", config.roomPos);
    room.setAttribute("sound", {
      src: "#ambience-sound",
      autoplay: false,
      loop: true,
      volume: 0.8,
      positional: false,
    });
    container.appendChild(room);

    // Physics walls
    const physicsFloor = document.createElement("a-box");
    physicsFloor.setAttribute("static-body", "");
    physicsFloor.setAttribute("width", "20");
    physicsFloor.setAttribute("depth", "20");
    physicsFloor.setAttribute("height", "0.2");
    physicsFloor.setAttribute("position", "0 -0.1 0"); // Sink it slightly so the top is at 0
    physicsFloor.setAttribute("color", "red"); // Red for debugging
    physicsFloor.setAttribute("visible", "false"); // Keep it invisible
    container.appendChild(physicsFloor);

    const medicationCart = document.createElement("a-box");
    medicationCart.setAttribute("static-body", "");
    medicationCart.setAttribute("width", config.medCartWidth);
    medicationCart.setAttribute("depth", config.medCartDepth);
    medicationCart.setAttribute("height", config.medCartHeight);
    medicationCart.setAttribute("position", config.medCartPos);
    medicationCart.setAttribute("rotation", config.medCartRot);
    medicationCart.setAttribute("color", "red"); // Red for debugging
    medicationCart.setAttribute("visible", "false"); // Keep it invisible
    container.appendChild(medicationCart);

    // Spawn patient
    const patient = document.createElement("a-entity");
    patient.setAttribute("id", "patient");

    // (global reference for animation triggering)
    this.patientEntity = patient;

    patient.setAttribute("gltf-model", "#patient");
    patient.setAttribute("position", config.patientPos);
    patient.setAttribute("rotation", config.patientRot);
    patient.setAttribute("scale", config.patientScale);

    patient.setAttribute(
      "animation-mixer",
      `clip: ${PATIENT_ANIMS.IDLE}; crossFadeDuration: 0.5;`,
    );
    patient.setAttribute("sound", {
      src: "#cough-sfx",
      poolSize: 3, // Allows multiple cough sounds to overlap slightly if triggered fast
      volume: 1.5,
    });

    patient.setAttribute("visible", "false");
    container.appendChild(patient);

    console.log("Config data read");

    room.addEventListener("model-loaded", () => {
      // 4. Room is ready! Remove the whole menu
      const startMenu = document.querySelector("#start-menu");
      if (startMenu) startMenu.parentNode.removeChild(startMenu);
      loadingIndicator.setAttribute("visible", "false");

      // Set preconfigured player position
      playerRig.setAttribute("position", config.spawnPos);
      playerRig.setAttribute("rotation", config.spawnRot);

      room.setAttribute("visible", "true");
      if (room.components.sound) {
        room.components.sound.playSound();
      }

      const backdrop = document.querySelector("#room-1-backdrop");
      if (backdrop) {
        backdrop.setAttribute("visible", "true");
      }

      patient.setAttribute("visible", "true");

      setTimeout(() => {
        this.spawnPanels(container);

        setTimeout(() => {
          ScenarioManager.init(this.activeConfig.questionPool);
          KeypadManager.init();
          CalcManager.init();
          WhiteboardManager.init();
          StatsManager.init();

          if (config.patientCough === true) this.startRandomCoughing();
        }, 100);
      }, 100);
    });
  },

  spawnPanels(parent) {
    const SCENARIO_FONT = "./assets/fonts/InterTight-Medium-msdf.json";

    const uiWrapper = document.createElement("a-entity");
    uiWrapper.id = "ui-wrapper";
    uiWrapper.setAttribute("position", this.activeConfig.uiWrapperPos);
    uiWrapper.setAttribute("rotation", this.activeConfig.uiWrapperRot);

    const config = this.activeConfig;
    const features = config.features || [];

    if (!config.dashboardData) {
      console.log("No dashboard data available.");
    }

    uiWrapper.innerHTML = `
    <a-entity id="scenario-panel" face-user visible="true" scale="0.5 0.5 0.5" position="${config.scenarioPanelPos}" rotation="${config.scenarioPanelRot}">
        
        <a-text id="panel-scenario" value="" align="center" anchor="center" baseline="top" 
                position="0 0.6 0" font="${SCENARIO_FONT}" shader="msdf" negate="false" 
                color="white" width="1.9" wrap-count="25">
        </a-text>

        <a-text id="panel-rationale" value="" visible="false" align="right" anchor="center" baseline="top" 
                position="0.6 0.6 0" font="${SCENARIO_FONT}" shader="msdf" negate="false" 
                opacity="0" color="#00ff00" width="1" wrap-count="25">
        </a-text>

        <a-text id="panel-status" value="" align="center" position="0 -0.9 1" width="1.5" rotation="-10 0 0"></a-text>

        <a-entity id="ui-keypad-toggle" scale="0.5 0.5 0.5" position="-0.8 -1.0 0.1" rotation="-20 0 0">
            <a-plane class="interactable" width="1.2" height="0.4" color="#00d4ff" onclick="GameManager.togglePanel('#input-panel')">
                <a-text value="ANTWOORD INVOEREN" align="center" color="white" width="2.5" position="0 0 0.01"></a-text>
            </a-plane>
        </a-entity>

        <a-entity id="input-panel" visible="false" scale="0.001 0.001 0.001" position="0.9 -0.8 1.7" rotation="-20 -15 0">
            <a-entity id="keypad-container" position="0 0 0" rotation="0 0 0"></a-entity>
        </a-entity>

        <a-entity id="next-question-btn" scale="0.5 0.5 0.5" position="0.8 -1.0 0.1" rotation="-20 0 0" visible="false">
            <a-plane width="1.2" height="0.4" color="#26d896" onclick="ScenarioManager.handleNextClick()">
                <a-text value="VOLGENDE VRAAG" align="center" color="white" width="2.8" position="0 0 0.01"></a-text>
            </a-plane>
        </a-entity>
    </a-entity>

    <a-entity id="main-dashboard" position="${config.mainDashboardPos}" rotation="${config.mainDashboardRot}" scale="0.5 0.5 0.5">
        <a-plane id="dashboard-bg" color="#1a1a1a" opacity="0.95" height="2.4" width="3.2"></a-plane>
        <a-plane id="dashboard-bg" color="#00d4ff" opacity="0.5" height="2.45" width="3.25" position="0 0 -0.01"></a-plane>
        
        <a-entity id="tab-bar" position="0 1.0 0.01">
          <a-plane id="tab-info" class="interactable" position="-0.8 0 0" width="0.75" height="0.2" color="#26d896" onclick="GameManager.switchTab('info')">
            <a-text value="INFO" align="center" width="2.5" color="white"></a-text>
          </a-plane>
          <a-plane id="tab-meds" class="interactable" position="0 0 0" width="0.75" height="0.2" color="#444" onclick="GameManager.switchTab('meds')">
            <a-text value="MEDS" align="center" width="2.5" color="white"></a-text>
          </a-plane>
          <a-plane id="tab-notes" class="interactable" position="0.8 0 0" width="0.75" height="0.2" color="#444" onclick="GameManager.switchTab('notes')">
            <a-text value="NOTITIES" align="center" width="2.5" color="white"></a-text>
          </a-plane>
        </a-entity>

        <a-entity id="content-info" visible="true">
          <a-text value="SBAR OVERDRACHT" align="center" position="0 0.728 0.02" width="3.5" color="#ffd700"></a-text>
          
          <a-entity id="info-page-1" visible="true">
            <a-text value="S (Situatie):" position="-1.4 0.5 0.02" width="3" color="#00d4ff"></a-text>
            <a-text id="sbar-s" value="${config.mainDashboardData.s}" position="-1.4 0.191 0.02" width="2.8" wrap-count="50"></a-text>
            
            <a-text value="B (Background):" position="-1.4 -0.185 0.02" width="3" color="#00d4ff"></a-text>
            <a-text id="sbar-b" value="${config.mainDashboardData.b}" position="-1.4 -0.5 0.02" width="2.8" wrap-count="50"></a-text>
          </a-entity>

          <a-entity id="info-page-2" visible="false">
            <a-text value="A (Assessment):" position="-1.4 0.45 0.02" width="3" color="#00d4ff"></a-text>
            <a-text id="sbar-a" value="${config.mainDashboardData.a}" position="-1.4 0.142 0.02" width="2.8" wrap-count="50"></a-text>
            
            <a-text value="R (Recommendation):" position="-1.4 -0.2 0.02" width="3" color="#00d4ff"></a-text>
            <a-text id="sbar-r" value="${config.mainDashboardData.r}" position="-1.4 -0.5 0.02" width="2.8" wrap-count="50"></a-text>
          </a-entity>

          <a-plane id="info-page-btn" class="interactable" position="0 -0.95 0.02" width="1.2" height="0.25" color="#444" onclick="GameManager.toggleInfoPage()">
            <a-text id="info-page-text" value="VOLGENDE (1/2)" align="center" width="2.5" position="0 0 0.01"></a-text>
          </a-plane>
        </a-entity>

        <a-entity id="content-meds" visible="false">
          <a-text value="ACTUELE MEDICATIE" align="center" position="0 0.8 0.02" width="3.5" color="#99ffcc"></a-text>
          <a-text value="MEDICIJN" position="-1.4 0.55 0.02" width="2.5" color="#ffd700"></a-text>
          <a-text value="DOSERING" position="-0.1 0.55 0.02" width="2.5" color="#ffd700"></a-text>
          <a-text value="FREQ" position="0.8 0.55 0.02" width="2.5" color="#ffd700"></a-text>
          
          <a-text id="med-list-names" value="${config.mainDashboardData.meds.names}" position="-1.4 0.05 0.02" width="2.5"></a-text>
          <a-text id="med-list-dosages" value="${config.mainDashboardData.meds.dosages}" position="-0.1 0.05 0.02" width="2.5"></a-text>
          <a-text id="med-list-freqs" value="${config.mainDashboardData.meds.freqs}" position="0.8 0.05 0.02" width="2.5"></a-text>
        </a-entity>

        <a-entity id="content-notes" visible="false">
          <a-plane id="whiteboard-canvas-area" class="interactable" material="src: #drawing-canvas; transparent: false; shader: flat" color="#fff6d4" width="3.0" height="1.8" position="0 0 0.01">
            <a-text value="NOTITIES" color="#000000" align="center" position="0 0.8 0.01" width="2"></a-text>
            <a-circle class="interactable" radius="0.1" color="#faeeab" position="-1.2 -0.75 0.02" onclick="GameManager.togglePanel('#calculator-panel')">
              <a-image src="#icon-calc" width="0.12" height="0.12" position="0 0 0.01"></a-image>
            </a-circle>
            <a-circle class="interactable" radius="0.1" color="#ff7d7d" position="1.2 -0.75 0.02" onclick="WhiteboardManager.clear()">
              <a-image src="#icon-trash" width="0.12" height="0.12" position="0 0 0.01"></a-image>
            </a-circle>
          </a-plane>
          <a-entity id="calculator-panel" visible="false" scale="0.001 0.001 0.001" position="-1.6 0 0.7" rotation="-10 30 0">
            <a-plane width="1.15" height="0.35" opacity="0.9" color="#333" position="0 0.8 0.1" rotation="20 0 0">
              <a-text id="calc-display" value="0" align="right" width="3" position="0.5 0 0.01" color="white" font="monoid"></a-text>
            </a-plane>
            <a-entity id="button-container"></a-entity>
          </a-entity>
        </a-entity>
    </a-entity>

    <a-entity id="evaluation-menu" visible="false" position="1.574 -50 3.2" rotation="0 180 0">
        <a-text id="eval-title" value="EVALUATIE" align="center" position="0 0.5 0.01" color="#00d4ff" width="4"></a-text>
        <a-text id="eval-result" value="Tijd is op!" align="center" position="0 0.2 0.01" width="3"></a-text>
        <a-text id="eval-score" value="Eindscore: 0" align="center" position="0 -0.1 0.01" color="#00d4ff" width="2.5"></a-text>
        <a-plane class="interactable" width="1.6" height="0.3" color="#1a1a1a" position="0 -0.5 0.02" onclick="window.location.reload()">
            <a-text value="Ga terug naar startscherm" align="center" width="3" color="white"></a-text>
        </a-plane>
    </a-entity>

    ${
      features.includes("IV_PUMP")
        ? `
      <a-entity id="iv-pump-station" position="${config.ivPolePos}" rotation="${config.ivPoleRot}">
        <a-entity gltf-model="#iv-pole" class="ignore-ray"></a-entity>
        <a-entity id="iv-pump-display" position="${config.ivPumpScreenPos}" rotation="${config.ivPumpScreenRot}">
          <a-plane width="0.6" height="0.22" position="0 0.06 0" color="#000000" material="emissive: #181818"></a-plane>
          <a-text id="pump-drug-name" value="ONDANSETRON" position="-0.28 0.07 0.01" align="left" width="1.2" scale="0.8 0.8 0.8" color="#a9a9a9"></a-text>
          <a-entity id="digit-container" position="0.2 0.07 0.01" scale="0.7 0.7 0.7">
            <a-text id="digit-100" value="0" position="-0.08 0 0" align="center" width="2.5" color="#a9a9a9"></a-text>
            <a-text id="digit-10"  value="0" position="0 0 0"    align="center" width="2.5" color="#a9a9a9"></a-text>
            <a-text id="digit-1"   value="0" position="0.08 0 0"  align="center" width="2.5" color="#a9a9a9"></a-text>
            <a-plane id="digit-cursor" width="0.06" height="0.012" color="#a9a9a9" position="0.08 -0.06 0.01"></a-plane>
          </a-entity>
          <a-text value="ml/h" align="left" position="0.17 -0.01 0.01" width="1.1" color="#a9a9a9"></a-text>
          <a-entity position="0.5 -0.1 0.01" rotation="0 -15 0">
              <a-image class="interactable" src="#arrow-btn-asset" width="0.07" height="0.07" position="0 0.08 0" scale="1.3 1.3 1.3" onclick="ScenarioManager.scrollDigit(1)"></a-image>
              <a-image class="interactable" src="#arrow-btn-asset" width="0.07" height="0.07" position="-0.08 0 0" scale="1.3 1.3 1.3" rotation="0 0 90" onclick="ScenarioManager.moveCursor(-1)"></a-image>
              <a-image class="interactable" src="#arrow-btn-asset" width="0.07" height="0.07" position="0.08 0 0" scale="1.3 1.3 1.3" rotation="0 0 -90" onclick="ScenarioManager.moveCursor(1)"></a-image>
              <a-image class="interactable" src="#arrow-btn-asset" width="0.07" height="0.07" position="0 -0.08 0" scale="1.3 1.3 1.3" rotation="0 0 180" onclick="ScenarioManager.scrollDigit(-1)"></a-image>
              <a-image class="interactable" id="pump-ok-btn" src="#ok-btn-asset" width="0.1" height="0.1" position="0.2 -0.05 0" scale="1 1 1" onclick="ScenarioManager.submitPump()"></a-image>
          </a-entity>
        </a-entity>
      </a-entity>
    `
        : ""
    }

    ${
      features.includes("MED_CUP")
        ? `
      <a-box id="med-cup" class="interactable" phys-grab water-logic="fullness: 0.8" dynamic-body="mass: 0.5" width="0.05" height="0.05" depth="0.05" position="0 0 0" material="visible: false">
        <a-entity gltf-model="#medication-cup" position="0 -0.025 0"></a-entity>
      </a-box>
    `
        : ""
    }

    ${
      features.includes("BOTTLES")
        ? `
      <a-box id="bottle-1pc" class="interactable" phys-grab width="0.06" height="0.12" depth="0.06" visible="false">
          <a-entity gltf-model="#med-bottle-model" position="0 -0.06 0"></a-entity>
          <a-text value="1%" align="center" position="0 0.08 0.04" scale="0.1 0.1 0.1" color="white"></a-text>
      </a-box>
      <a-box id="bottle-2pc" class="interactable" phys-grab width="0.06" height="0.12" depth="0.06" visible="false">
          <a-entity gltf-model="#med-bottle-model" position="0 -0.06 0"></a-entity>
          <a-text value="2%" align="center" position="0 0.08 0.04" scale="0.1 0.1 0.1" color="white"></a-text>
      </a-box>
      <a-box id="bottle-5pc" class="interactable" phys-grab width="0.06" height="0.12" depth="0.06" visible="false">
          <a-entity gltf-model="#med-bottle-model" position="0 -0.06 0"></a-entity>
          <a-text value="5%" align="center" position="0 0.08 0.04" scale="0.1 0.1 0.1" color="white"></a-text>
      </a-box>
    `
        : ""
    }

    ${
      features.includes("SENSOR")
        ? `
      <a-box static-body position="1.416 0.837 2.952" width="0.770" height="0.030" depth="0.390" color="red" visible="false" sensor-logic></a-box>
    `
        : ""
    }
  `;

    parent.appendChild(uiWrapper);
  },

  togglePanel(panelId, force = false) {
    const panel = document.querySelector(panelId);
    if (!panel) return;

    if (
      !force &&
      panelId === "#input-panel" &&
      ScenarioManager.current &&
      ScenarioManager.current.isPump
    ) {
      ScenarioManager.updateUI(
        "Gebruik de infuuspomp om de vraag te beantwoorden!",
        "#ffcc00",
        false,
      );
      return;
    }

    const isVisible =
      panel.getAttribute("visible") === true ||
      panel.getAttribute("visible") === "true";
    const newState = !isVisible;

    if (newState) {
      panel.setAttribute("visible", "true");
      // Get the target scale from the element or default based on ID

      // let targetScale = (panelId === "#input-panel") ? "0.6 0.6 0.6" : "0.5 0.5 0.5";
      let targetScale = "0.6 0.6 0.6";
      panel.setAttribute(
        "animation__scale",
        `property: scale; to: ${targetScale}; dur: 300; easing: easeOutBack`,
      );
    } else {
      panel.setAttribute(
        "animation__scale",
        `property: scale; to: 0.001 0.001 0.001; dur: 200; easing: easeInQuad`,
      );
      // Wait for animation to finish before hiding
      setTimeout(() => panel.setAttribute("visible", "false"), 200);
    }
    this.updateToggleIcon(panelId, newState);
  },

  // Helper: Update the visual state of the button that clicked it
  updateToggleIcon(panelId, active) {
    let selector;

    if (panelId === "#input-panel") {
      // The blue "Antwoord Invoeren" button
      selector = "#ui-keypad-toggle a-plane";
    } else {
      // The yellow calculator button inside the whiteboard
      selector = "#content-notes a-circle";
    }

    const icon = document.querySelector(selector);
    if (icon) {
      // Handle different colors for different buttons
      if (panelId === "#input-panel") {
        icon.setAttribute("material", "color", active ? "#097287" : "#00d4ff");
      } else {
        icon.setAttribute("material", "color", active ? "#00ff88" : "#ffd700");
      }
    }
  },

  toggleInfoPage() {
    const p1 = document.querySelector("#info-page-1");
    const p2 = document.querySelector("#info-page-2");
    const btnText = document.querySelector("#info-page-text");

    const isP1Visible =
      p1.getAttribute("visible") === true ||
      p1.getAttribute("visible") === "true";

    if (isP1Visible) {
      p1.setAttribute("visible", "false");
      p2.setAttribute("visible", "true");
      btnText.setAttribute("value", "TERUG (2/2)");
    } else {
      p1.setAttribute("visible", "true");
      p2.setAttribute("visible", "false");
      btnText.setAttribute("value", "VOLGENDE (1/2)");
    }
  },

  switchTab(tabId) {
    const tabs = ["info", "meds", "notes"];
    const calc = document.querySelector("#calculator-panel");

    const isCalcVisible =
      calc &&
      (calc.getAttribute("visible") === true ||
        calc.getAttribute("visible") === "true");

    if (tabId !== "notes" && isCalcVisible) {
      calc.setAttribute(
        "animation__scale",
        "property: scale; to: 0.001 0.001 0.001; dur: 200; easing: easeInQuad",
      );
      if (this.updateToggleIcon)
        this.updateToggleIcon("#calculator-panel", false);

      setTimeout(() => {
        calc.setAttribute("visible", "false");
        this.executeTabSwap(tabId, tabs);
      }, 200);
    } else {
      this.executeTabSwap(tabId, tabs);
    }
  },

  // Move the actual visibility logic to a helper function
  executeTabSwap(tabId, tabs) {
    tabs.forEach((t) => {
      const content = document.querySelector(`#content-${t}`);
      const button = document.querySelector(`#tab-${t}`);

      if (content) {
        content.setAttribute("visible", t === tabId);
      }

      if (button) {
        // Set the active tab to green (#26d896) and others to dark gray (#444)
        button.setAttribute("color", t === tabId ? "#26d896" : "#444");
      }
    });
  },

  playCoughSfx(spriteName) {
    // Use the global reference we saved earlier
    const patient = this.patientEntity;
    const soundComp = patient.components.sound;
    const sprite = AUDIO_SPRITES[spriteName];

    if (soundComp && sprite) {
      // Access the underlying audio
      const audio = soundComp.pool.children[0];

      if (audio && audio.buffer) {
        audio.stop();

        // 1. Set the starting position
        audio.offset = sprite.start;

        // 2. Play the sound
        audio.play();

        // 3. Manually stop it after the duration ends
        setTimeout(() => {
          if (audio.isPlaying) {
            audio.stop();
            // console.log(`Manual stop triggered for ${spriteName}`);
          }
        }, sprite.duration * 1000); // Convert seconds to milliseconds
      }
    }
  },

  updatePatientStatus(condition) {
    const patient = this.patientEntity;
    if (!patient) return;

    // 1. CLEAR existing listener immediately to prevent recursion
    if (this.activeAnimationListener) {
      patient.removeEventListener(
        "animation-finished",
        this.activeAnimationListener,
      );
      this.activeAnimationListener = null;
    }

    let clipName = PATIENT_ANIMS.IDLE;
    let shouldLoop = true;

    switch (condition) {
      case "ok":
        clipName = PATIENT_ANIMS.GESTURE;
        shouldLoop = false;
        break;
      case "cough":
        clipName = PATIENT_ANIMS.COUGH_MILD;
        shouldLoop = false;
        this.playCoughSfx("short_cough");
        break;
      case "severe_cough":
        clipName = PATIENT_ANIMS.COUGH_SEVERE;
        shouldLoop = false;
        this.playCoughSfx("severe_cough");
        break;
      case "critical":
        clipName = PATIENT_ANIMS.BREATHLESS;
        shouldLoop = true;
        break;
      default:
        clipName = PATIENT_ANIMS.IDLE;
        shouldLoop = true;
    }

    // 2. STOP all previous actions to clear the mixer state
    const mixer = patient.components["animation-mixer"]?.mixer;
    if (mixer) {
      mixer.stopAllAction();
    }

    // 3. APPLY new animation
    patient.setAttribute("animation-mixer", {
      clip: clipName,
      crossFadeDuration: 0.5,
      loop: shouldLoop ? "repeat" : "once",
      clampWhenFinished: true,
    });

    // 4. ONLY attach listener for one-shot animations
    if (!shouldLoop) {
      this.activeAnimationListener = (evt) => {
        // Safety: Only trigger if the finished clip is the one we just started
        if (evt.detail.action._clip.name === clipName) {
          // console.log("Animation finished, returning to idle safely.");

          // Remove self first!
          patient.removeEventListener(
            "animation-finished",
            this.activeAnimationListener,
          );
          this.activeAnimationListener = null;

          // Return to idle
          patient.setAttribute("animation-mixer", {
            clip: PATIENT_ANIMS.IDLE,
            crossFadeDuration: 1.0,
            loop: "repeat",
          });
        }
      };
      patient.addEventListener(
        "animation-finished",
        this.activeAnimationListener,
      );
    }
  },

  startRandomCoughing() {
    const triggerNextCough = () => {
      // Generate a random time between 1 and 15 seconds
      const randomDelay = Math.floor(Math.random() * 14000) + 1000;

      this.coughTimeout = setTimeout(() => {
        // Pick randomly between mild and severe cough
        const isSevere = Math.random() > 0.7; // 30% chance for severe
        const condition = isSevere ? "severe_cough" : "cough";

        // Call your existing function
        this.updatePatientStatus(condition);

        // Recursive call to keep the loop going
        triggerNextCough();
      }, randomDelay);
    };

    triggerNextCough();
  },

  stopRandomCoughing() {
    if (this.coughTimeout) clearTimeout(this.coughTimeout);
  },

  exitSimulation(win) {
    // 1. Remove the 3D world elements to save performance
    // Assuming 'room' and 'patient' were children of 'main-simulation-container'
    const container = document.querySelector("#main-simulation-container");
    if (container) {
      // We find all direct children that ARE NOT the ui-wrapper and remove them
      Array.from(container.children).forEach((child) => {
        if (child.id !== "ui-wrapper") {
          container.removeChild(child);
        }
      });
    }

    // 2. Clear the HUD from the camera
    const hud = document.querySelector("#hud");
    if (hud) hud.parentNode.removeChild(hud);

    // 3. Hide the Gameplay UI Panels
    const scenarioPanel = document.querySelector("#scenario-panel");
    const mainDashboard = document.querySelector("#main-dashboard");
    if (scenarioPanel) scenarioPanel.setAttribute("visible", "false");
    if (mainDashboard) mainDashboard.setAttribute("visible", "false");

    // 4. Setup and Show the Evaluation Menu
    const evalMenu = document.querySelector("#evaluation-menu");
    const evalResult = document.querySelector("#eval-result");
    const evalScore = document.querySelector("#eval-score");

    if (evalMenu) {
      evalMenu.setAttribute("position", "1.574 1.6 3.2");
      evalMenu.setAttribute("visible", "true");
      // Add interactable class so the 'OPNIEUW' button works
      const restartBtn = evalMenu.querySelector("a-plane");
      if (restartBtn) restartBtn.classList.add("interactable");

      if (win) {
        const roomModel = this.activeConfig.roomModel;
        if (roomModel === "#room-a-glb") {
          CodeManager.completeRoom("room1");
        } else if (roomModel === "#room-b-glb") {
          CodeManager.completeRoom("room2");
        }
        evalResult.setAttribute("value", "GEFELICITEERD!\nDoel bereikt.");
        evalResult.setAttribute("color", "#00ff88");
      } else {
        evalResult.setAttribute("value", "TIJD is om!\nProbeer het opnieuw...");
        evalResult.setAttribute("color", "#ff4444");
      }

      // Grab score from StatsManager
      evalScore.setAttribute("value", `Behaalde score: ${StatsManager.score}`);
    }
  },
};

/**
 * ─── CALCULATOR MANAGER ───
 * Handles the 3D Buttons and Display
 */
const CalcManager = {
  input: "",

  init() {
    this.renderButtons();
  },

  renderButtons() {
    const config = [
      { label: "7", x: -0.45, y: 0.4 },
      { label: "8", x: -0.15, y: 0.4 },
      { label: "9", x: 0.15, y: 0.4 },
      { label: "/", x: 0.45, y: 0.4, color: "#4a90e2" },
      { label: "4", x: -0.45, y: 0.05 },
      { label: "5", x: -0.15, y: 0.05 },
      { label: "6", x: 0.15, y: 0.05 },
      { label: "*", x: 0.45, y: 0.05, color: "#4a90e2" },
      { label: "1", x: -0.45, y: -0.3 },
      { label: "2", x: -0.15, y: -0.3 },
      { label: "3", x: 0.15, y: -0.3 },
      { label: "-", x: 0.45, y: -0.3, color: "#4a90e2" },
      { label: ".", x: -0.45, y: -0.65 },
      { label: "0", x: -0.15, y: -0.65 },
      { label: "+", x: 0.45, y: -0.65, color: "#4a90e2" },
      { label: "OK", x: 0.15, y: -0.65, color: "#00ff88" },
      { label: "C", x: -0.3, y: -1.0, color: "#ff6b6b", width: 0.55 },
      { label: "DEL", x: 0.3, y: -1.0, color: "#f39c12", width: 0.55 },
    ];

    const container = document.querySelector("#button-container");
    container.innerHTML = ""; // Clear existing if any

    config.forEach((btn) => {
      const el = document.createElement("a-entity");
      const w = btn.width || 0.25; // Standard width or custom wide button
      const defaultCol = btn.color || "#444";
      const activeHover = "#ffffff";

      el.setAttribute("position", `${btn.x} ${btn.y} 0.03`);
      el.setAttribute("class", "interactable");
      el.setAttribute("geometry", `primitive: plane; width: ${w}; height: 0.3`);
      el.setAttribute("material", `color: ${defaultCol}`);
      el.innerHTML = `<a-text value="${btn.label}" align="center" width="2.5" position="0 0 0.01"></a-text>`;

      el.addEventListener("mouseenter", () =>
        el.setAttribute("material", "color", activeHover),
      );
      el.addEventListener("mouseleave", () =>
        el.setAttribute("material", "color", defaultCol),
      );

      el.addEventListener("click", () => {
        this.handlePress(btn.label);
      });

      container.appendChild(el);
    });
  },

  resetCalculator() {
    this.input = "";
    document.querySelector("#calc-display").setAttribute("value", "0");
  },

  handlePress(val) {
    if (val === "C") {
      this.input = "";
    } else if (val === "DEL") {
      // Remove the last character
      this.input = this.input.slice(0, -1);
    } else if (val === "OK") {
      try {
        // We use a simple regex to only allow numbers and operators for safety
        const sanitized = this.input.replace(/[^-+*/.0-9]/g, "");
        const result = eval(sanitized);

        // Send the final result to the scenario check
        // this.input = Math.round(result).toString();
        this.input = Number(result.toFixed(3)).toString();
      } catch (e) {
        this.input = "Error";
      }
    } else {
      // Prevent typing "Error" into the next equation
      if (this.input === "Error") this.input = "";
      this.input += val;
    }
    // document
    //   .querySelector("#calc-display")
    //   .setAttribute("value", this.input || "0");
    const display = document.querySelector("#calc-display");

    // Check if input is exactly an empty string to show "0"
    // This ensures that if the result IS 0, it shows 0,
    // but if it's 0.25, it shows 0.25.
    display.setAttribute("value", this.input === "" ? "0" : this.input);
  },
};

const StatsManager = {
  score: 20,
  maxScore: 100, // The goal to reach the top of the bar
  timeLeft: 600, // Time in seconds
  timerInterval: null,

  spawnHUD() {
    const camera = document.querySelector("a-camera");
    if (!camera) return;

    const hud = document.createElement("a-entity");
    hud.id = "hud";
    // Bring it very close to the face (20cm)
    hud.setAttribute("position", "0 0 -0.2");
    hud.setAttribute(
      "material",
      "depthTest: false; transparant: true; opacity: 0.9",
    );

    // TIMER (Top Center - Scaled down because it's closer)
    // background plane
    const timerPlane = document.createElement("a-plane");
    timerPlane.setAttribute("position", "0 0.065 0");
    timerPlane.setAttribute("width", "0.05");
    timerPlane.setAttribute("height", "0.015");
    timerPlane.setAttribute("color", "#000000");
    timerPlane.setAttribute(
      "material",
      "opacity: 0.6; transparent: true; depthTest: false",
    );

    const timerText = document.createElement("a-text");
    timerText.id = "timer-text";
    timerText.setAttribute("align", "center");
    timerText.setAttribute("position", "0 0.065 0"); // Smaller Y offset
    timerText.setAttribute("width", "0.3"); // Much smaller width
    timerText.setAttribute("color", "#fff");
    timerText.setAttribute(
      "material",
      "depthTest: false; transparant: true; opacity: 0.9",
    );
    hud.appendChild(timerPlane);
    hud.appendChild(timerText);

    const hudStatus = document.createElement("a-text");
    hudStatus.id = "hud-status";
    hudStatus.setAttribute("align", "center");
    // hudStatus.setAttribute("position", "0 0.045 0");
    hudStatus.setAttribute("position", "0 0.03 -0.25");
    hudStatus.setAttribute("width", "0.25");
    hudStatus.setAttribute("value", ""); // Starts empty
    hudStatus.setAttribute("material", "depthTest: false");
    hud.appendChild(hudStatus);

    camera.appendChild(hud);

    // SCORE BAR CONTAINER
    const scoreContainer = document.createElement("a-entity");
    scoreContainer.id = "score-container";
    scoreContainer.setAttribute("position", "0 0.08 0"); // Smaller Y offset

    // BG Plane
    const bg = document.createElement("a-plane");
    bg.setAttribute("width", "0.12"); // Shrink physical size
    bg.setAttribute("height", "0.008");
    bg.setAttribute("color", "#111");
    bg.setAttribute("opacity", "0.5");
    scoreContainer.appendChild(bg);

    // Fill Plane
    const fill = document.createElement("a-plane");
    fill.id = "score-bar-fill";
    fill.setAttribute("width", "0.116");
    fill.setAttribute("height", "0.006");
    fill.setAttribute("color", "#26d896");
    // Pivot logic needs to be based on the new width (0.116 / 2 = 0.058)
    fill.setAttribute("position", "-0.058 0 0.001");
    fill.setAttribute("scale", "0.2 1 1");
    scoreContainer.appendChild(fill);

    hud.appendChild(scoreContainer);
    camera.appendChild(hud);
  },

  init() {
    this.spawnHUD();
    this.updateProgress();
    this.startTimer();
  },

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateUI();
      if (this.timeLeft <= 0) this.gameOver(false);
    }, 1000);
  },

  addPoints() {
    this.score = Math.min(this.maxScore, this.score + 15);
    this.updateProgress();
    if (this.score >= this.maxScore) this.gameOver(true);
  },

  removePoints() {
    this.score = Math.max(0, this.score - 10);
    this.updateProgress();
  },

  updateProgress() {
    const bar = document.querySelector("#score-bar-fill");
    if (bar) {
      const percentage = Math.max(0.01, this.score / this.maxScore);
      bar.setAttribute("scale", `${percentage} 1 1`);

      // NEW PIVOT MATH: Based on the 0.116 width
      // -0.058 is the far left edge
      const newX = -0.058 + 0.058 * percentage;
      bar.setAttribute("position", `${newX} 0 0.001`);

      // Color logic remains the same
      if (percentage < 0.25) bar.setAttribute("color", "#ff4444");
      else if (percentage < 0.6) bar.setAttribute("color", "#ffbb00");
      else bar.setAttribute("color", "#26d896");
    }
  },

  updateUI() {
    const timerEl = document.querySelector("#timer-text");
    if (timerEl) {
      const mins = Math.floor(this.timeLeft / 60);
      const secs = this.timeLeft % 60;
      timerEl.setAttribute("value", `${mins}:${secs < 10 ? "0" : ""}${secs}`);
    }
  },

  showStatus(text, color = "#ffffff") {
    const hudStatus = document.querySelector("#hud-status");
    if (hudStatus) {
      hudStatus.setAttribute("value", text);
      hudStatus.setAttribute("color", color);

      // Optional: Auto-hide the message after 3 seconds
      clearTimeout(this.statusTimeout);
      this.statusTimeout = setTimeout(() => {
        hudStatus.setAttribute("value", "");
      }, 3000);
    }
  },

  gameOver(win) {
    clearInterval(this.timerInterval);
    const status = win ? "GEFELICITEERD! DOEL BEREIKT" : "TIJD IS OM!";
    ScenarioManager.updateUI(status, win ? "#00ff88" : "#ff4444", false);

    setTimeout(() => {
      GameManager.exitSimulation(win);
    }, 1500);
  },
};
