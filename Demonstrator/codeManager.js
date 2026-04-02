const CodeManager = {
    enteredCode: "",
    roomCodes: {},
    collected: {},
    fullCode: "",

    init() {
        // Load saved codes and collected status
        const savedData = localStorage.getItem("vr_game_data");
        if (savedData) {
            const data = JSON.parse(savedData);
            this.fullCode = data.fullCode;
            this.roomCodes = data.roomCodes;
            this.collected = data.collected;
            console.log("Game data loaded from storage:", data);
        } else {
            // Generate new full code
            this.fullCode = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");
            // Split into room codes
            this.roomCodes = {
                room1: this.fullCode.slice(0, 2).split(""),
                room2: this.fullCode.slice(2, 4).split("")
            };
            // Initialize collected status
            this.collected = { room1: false, room2: false };

            this.saveData();
            console.log("New game data generated:", { fullCode: this.fullCode, roomCodes: this.roomCodes });
        }

        this.updateHUD();
    },

    saveData() {
        localStorage.setItem("vr_game_data", JSON.stringify({
            fullCode: this.fullCode,
            roomCodes: this.roomCodes,
            collected: this.collected
        }));
    },

    completeRoom(roomId) {
        this.collected[roomId] = true;
        this.saveData(); // save collected status

        const digits = this.roomCodes[roomId];
        this.showCodeReward(roomId, digits);
        this.updateHUD();
    },

    showCodeReward(roomId, digits) {
        const cam = document.querySelector("#camera");
        const reward = document.createElement("a-entity");
        reward.setAttribute("position", "0 0 -1");
        reward.setAttribute("face-user", "");
        reward.innerHTML = `
            <a-plane width="1.5" height="0.6" color="#111" opacity="0.9"></a-plane>
            <a-text 
                value="Code gevonden!\n${digits.join(" ")}" 
                align="center" 
                color="#00ff88"
                width="2"
                position="0 0 0.01">
            </a-text>
        `;
        cam.appendChild(reward);
        setTimeout(() => reward.remove(), 4000);
    },

    updateHUD() {
        const roomNames = { room1: "Code 1", room2: "Code 2" };
        const hudMap = { room1: "room1-code-display", room2: "room2-code-display" };

        Object.keys(hudMap).forEach(roomId => {
            const display = document.querySelector(`#${hudMap[roomId]}`);

            if (!display) return;
            const digits = this.collected[roomId] ? this.roomCodes[roomId] : null;
            const codeString = digits ? digits.join("") : "--";
            const textValue = `${roomNames[roomId]}: ${codeString}`;

            // Force A-Frame to re-render
            display.setAttribute("value", "");
            setTimeout(() => display.setAttribute("value", textValue), 50);
        });
    },

    addDigit(digit) {
        if (this.enteredCode.length >= 4) return;
        this.enteredCode += digit;
        this.updateDisplay();
    },

    clearCode() {
        this.enteredCode = "";
        this.updateDisplay();
    },

    updateDisplay() {
        const display = document.querySelector("#door-display");
        if (!display) return;
        display.setAttribute("value", this.enteredCode.padEnd(4, "-"));
    },

    checkCode() {
        if (this.enteredCode === this.fullCode) {
            this.onCorrectCode();
        } else {
            this.onWrongCode();
        }
    },

    onCorrectCode() {
        const display = document.querySelector("#door-display");
        display.setAttribute("value", "OPEN");
        display.setAttribute("color", "#00ff88");
        console.log("Door unlocked");

        setTimeout(() => {
            this.showEndScreen();
        }, 1500);
    },

    showEndScreen() {
        const cam = document.querySelector("#camera");

        const screen = document.createElement("a-entity");
        screen.setAttribute("id", "end-screen");
        screen.setAttribute("position", "0 0 -1");
        screen.setAttribute("face-user", "");

        screen.innerHTML = `
        <a-plane width="1.8" height="1" color="#111" opacity="0.95"></a-plane>

        <a-text 
            value="Goed gedaan! 🎉\\nJe bent ontsnapt."
            align="center"
            color="#00ff88"
            width="2"
            position="0 0.3 0.01">
        </a-text>

        <!-- Replay button -->
        <a-entity 
            class="interactable"
            geometry="primitive: plane; width: 0.6; height: 0.2"
            material="color: #00d4ff"
            position="0 0 0.02"
            onclick="CodeManager.restartGame()">
            <a-text value="Opnieuw oefenen" align="center" width="2"></a-text>
        </a-entity>

        <!-- Exit button -->
        <a-entity 
            class="interactable"
            geometry="primitive: plane; width: 0.6; height: 0.2"
            material="color: #ff4444"
            position="0 -0.3 0.02"
            onclick="CodeManager.hideEndScreen()">
            <a-text value="Sluiten" align="center" width="2"></a-text>
        </a-entity>
    `;

        cam.appendChild(screen);
    },
    restartGame() {
        const screen = document.querySelector("#end-screen");
        if (screen) screen.remove();

        this.resetGame();
    },
    hideEndScreen() {
        const screen = document.querySelector("#end-screen");
        if (screen) screen.remove();
    },

    onWrongCode() {
        const display = document.querySelector("#door-display");
        display.setAttribute("value", "ERROR");
        display.setAttribute("color", "#ff4444");
        setTimeout(() => this.clearCode(), 1500);
    },

    resetGame() {
        localStorage.removeItem("vr_game_data");
        this.enteredCode = "";
        this.fullCode = "";
        this.roomCodes = {};
        this.collected = {};
        this.init();
        this.updateDisplay();
        window.location.reload();
    }
};

// Initialize after A-Frame scene has loaded
document.querySelector("a-scene").addEventListener("loaded", () => {
    CodeManager.init();
});