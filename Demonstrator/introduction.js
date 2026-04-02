// Content texts
const introText = `Los de opdrachten op binnen de tijd om vervolgens een code te verdienen. Nadat je alle kamers hebt voltooid heb je de code om te escapen!

Klik met de trigger op je controller om knoppen te gebruiken.

Klik op de cirkels op de vloer om ernaartoe te lopen.

`;

const infoText = `Vul de voortgangsbar binnen de tijd door de vragen correct te beantwoorden.

Bij elk fout gaat de voortgangsbar iets achteruit.

Na 2 fouten per vraag, krijg je de berekening en wordt er een nieuwe vraag getoond.

Klik op de keypad naast de laatste deur als je de volledige code hebt`;

const tipsText = `
Er is een whiteboard aanwezig waar je de berekening op kunt schrijven. 
Ook kun je een rekenmachine gebruiken. (Beide hulpmiddelen vind je bij notities.)

Zit je vast of wil je toch terug naar de gang? druk dan op reset (links boven).

Code vergeten? rechts boven wordt het opgeslagen.
`;

const introTitle = `Introductie`
const infoTitle = `Uitleg`
const tipsTitle = `Help`

window.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('#titleText');
    const content = document.querySelector('#contentText');
    const introUI = document.querySelector('#introUI');

    const tab1 = document.querySelector('#tab1');
    const tab2 = document.querySelector('#tab2');
    const tab3 = document.querySelector('#tab3');
    const closeBtn = document.querySelector('#closeBtn');
    const openBtn = document.querySelector('#openHelp');
    const startButtons = document.querySelectorAll('.door-button');
    const camera = document.querySelector('#camera');
    const keypadButtons = document.querySelectorAll('.keypad-button');
    const resetBtn = document.querySelector('#reset').parentElement;
    const openHelpBtn = document.querySelector('#openHelp');


    content.setAttribute('value', introText);

    // Tab switching
    tab1.addEventListener('click', () => {
        title.setAttribute('value', introTitle);
        content.setAttribute('value', introText);
        setActiveTab(tab1);
    });

    // --- Tab switching ---
    function setActiveTab(activeTab, text, titleText) {
        [tab1, tab2, tab3].forEach(tab => {
            tab.setAttribute('color', '#000'); // default
        });
        activeTab.setAttribute('color', '#00d4ff'); // active
        title.setAttribute('value', titleText);
        content.setAttribute('value', text);
    }

    tab1.addEventListener('click', () => setActiveTab(tab1, introText, introTitle));
    tab2.addEventListener('click', () => setActiveTab(tab2, infoText, infoTitle));
    tab3.addEventListener('click', () => setActiveTab(tab3, tipsText, tipsTitle));

    closeBtn.addEventListener('click', () => {
        introUI.setAttribute('visible', false);
    });

    // --- Hover effect ---
    [tab1, tab2, tab3].forEach(tab => {
        const defaultColor = tab.getAttribute('color');

        tab.addEventListener('mouseenter', () => {
            tab.setAttribute('animation__hover', {
                property: 'color',
                to: '#09d1fa',
                dur: 200,
                easing: 'easeInOutQuad'
            });
        });

        tab.addEventListener('mouseleave', () => {
            const restoreColor = tab.getAttribute('color') !== '#00d4ff' ? defaultColor : '#00d4ff';
            tab.setAttribute('animation__hover', {
                property: 'color',
                to: restoreColor,
                dur: 200,
                easing: 'easeInOutQuad'
            });
        });
    });

    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.setAttribute('animation__color', {
            property: 'color',
            to: '#ff0000',
            dur: 200,
            easing: 'easeInOutQuad'
        });
        closeBtn.setAttribute('animation__scale', {
            property: 'scale',
            to: '1.1 1.1 1.1',
            dur: 200,
            easing: 'easeOutBack'
        });
    });

    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.setAttribute('animation__color', {
            property: 'color',
            to: '#ff4444',
            dur: 200,
            easing: 'easeInOutQuad'
        });
        closeBtn.setAttribute('animation__scale', {
            property: 'scale',
            to: '1 1 1',
            dur: 200,
            easing: 'easeOutBack'
        });
    });

// move panel in front of user
    openBtn.addEventListener('click', () => {
        const camPos = new THREE.Vector3();
        const direction = new THREE.Vector3();

        camera.object3D.getWorldPosition(camPos);
        camera.object3D.getWorldDirection(direction);

        const distance = -0.6;
        const newPos = camPos.clone().add(direction.multiplyScalar(distance));

        introUI.setAttribute('animation__position', {
            property: 'position',
            to: `${newPos.x} ${newPos.y} ${newPos.z}`,
            dur: 300,
            easing: 'easeOutQuad'
        });

        introUI.setAttribute('visible', true);
    });

    startButtons.forEach((btn) => {
        btn.addEventListener('mouseenter', () => {
            btn.setAttribute('animation__scale', {
                property: 'scale',
                to: '1.1 1.1 1.1',
                dur: 200,
                easing: 'easeOutBack'
            });
        });

        btn.addEventListener('mouseleave', () => {
            btn.setAttribute('animation__scale', {
                property: 'scale',
                to: '1 1 1',
                dur: 200,
                easing: 'easeOutBack'
            });
        });
    });

    keypadButtons.forEach((btn) => {
        btn.addEventListener('mouseenter', () => {
            btn.setAttribute('animation__scale', {
                property: 'scale',
                to: '1.1 1.1 1.1',
                dur: 200,
                easing: 'easeOutBack'
            });
        });

        btn.addEventListener('mouseleave', () => {
            btn.setAttribute('animation__scale', {
                property: 'scale',
                to: '1 1 1',
                dur: 200,
                easing: 'easeOutBack'
            });
            const originalColor = btn.getAttribute('onclick')?.includes('clearCode') || btn.getAttribute('onclick')?.includes('checkCode')
                ? '#ccc' : '#eee';
            btn.setAttribute('animation__color', {
                property: 'color',
                to: originalColor,
                dur: 200,
                easing: 'easeInOutQuad'
            });
        });
    });

    resetBtn.addEventListener('mouseenter', () => {
        resetBtn.setAttribute('animation__scale', {
            property: 'scale',
            to: '1.2 1.2 1.2',
            dur: 200,
            easing: 'easeOutBack'
        });
        resetBtn.setAttribute('animation__color', {
            property: 'color',
            to: '#bb2424',
            dur: 200,
            easing: 'easeInOutQuad'
        });
    });

    resetBtn.addEventListener('mouseleave', () => {
        resetBtn.setAttribute('animation__scale', {
            property: 'scale',
            to: '1 1 1',
            dur: 200,
            easing: 'easeOutBack'
        });
        resetBtn.setAttribute('animation__color', {
            property: 'color',
            to: '#1a1a1a',
            dur: 200,
            easing: 'easeInOutQuad'
        });
    });

    openHelpBtn.addEventListener('mouseenter', () => {
        openHelpBtn.setAttribute('animation__scale', {
            property: 'scale',
            to: '1.15 1.15 1.15',
            dur: 200,
            easing: 'easeOutBack'
        });
    });

    openHelpBtn.addEventListener('mouseleave', () => {
        openHelpBtn.setAttribute('animation__scale', {
            property: 'scale',
            to: '1 1 1',
            dur: 200,
            easing: 'easeOutBack'
        });
    });
});