// NAME: Reeeeewwwwinnnddd
// AUTHOR: Nick Colley
// DESCRIPTION: Let you rewind like you're doing a boiler room set.

(async function RewindPlugin() {
    const NAMESPACE = "spicetify-rewind-plugin";
    const REWIND_AUDIO_URL = "https://cdn.jsdelivr.net/gh/NickColley/spicetify-rewind/rewind.mp3";
    const REWIND_AUDIO_START_TIME = 0.612;
    const REWIND_AUDIO_END_TIME = 2.8;

    const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

    const addStylesToPage = (styles) => {
        const $style = document.createElement("style");
        $style.textContent = styles;
        document.head.appendChild($style);
    };

    const waitForElement = (selector) => {
        return new Promise(resolve => {
            const element = document.querySelector(selector);
            if (element) return resolve(element);
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    };

    const stopAudio = (audio) => {
        audio.stop();
    };

    if (!Spicetify.Player) {
        while (!Spicetify.Player) await new Promise(r => setTimeout(r, 500));
    }

    addStylesToPage(`
        .${NAMESPACE}--playing {
          animation: ${NAMESPACE}-playing 1s linear infinite;
        }
        .${NAMESPACE}--rewind {
          animation: ${NAMESPACE}-rewind ${REWIND_AUDIO_END_TIME}s;
        }
        @keyframes ${NAMESPACE}-playing {
          100% { transform: rotate(360deg); }
        }
        @keyframes ${NAMESPACE}-rewind {
          100% { transform: rotate(-10000deg); }
        }
    `);

    const $playerControls = await waitForElement("[aria-label='Player controls']");
    const $existingBackButton = $playerControls.querySelector("button[aria-label='Previous']");
    const $button = $existingBackButton.cloneNode(true);

    $button.setAttribute("aria-label", "Rewind");

    const audioContext = new AudioContext();

    const audioBuffer = await fetch(REWIND_AUDIO_URL)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer));

    const playRewindSound = (detuneValue = 0) => {
        const audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.detune.value = detuneValue;
        audioSource.connect(audioContext.destination);
        audioSource.start(0, REWIND_AUDIO_START_TIME, REWIND_AUDIO_END_TIME - REWIND_AUDIO_START_TIME);
        audioSource.onended = () => {
            audioSource.stop();
        };
    };

    let audioTimer = null;
    let isPlaying = false;

    $button.addEventListener("click", () => {
        if (audioTimer) {
            clearTimeout(audioTimer);
        }

        const currentVolume = clamp(Spicetify.Player.getVolume(), 0, 0.8);
        const randomDetune = Math.random() * 2400 - 1200;

        playRewindSound(randomDetune);

        if (isPlaying) Spicetify.Player.pause();
        Spicetify.Player.seek(0);

        $icon.classList.add(`${NAMESPACE}--rewind`);
        audioTimer = setTimeout(() => {
            Spicetify.Player.play();
            $icon.classList.remove(`${NAMESPACE}--rewind`);
        }, REWIND_AUDIO_END_TIME * 1000);
    });

    const $icon = $button.querySelector("svg");
    $icon.setAttribute("viewBox", "0 0 55.33 55.33");

    $icon.innerHTML = `
        <circle cx="28.16" cy="27.67" r="3.37"/>
        <path d="M28.16 1.89a25.78 25.78 0 1 0-.99 51.55 25.78 25.78 0 0 0 .99-51.55Zm-9.83 6.4a21.63 21.63 0 0 1 10.44-2.32c.34 0 .58.85.53 1.88l-.27 5.29c-.05 1.02-.27 1.85-.48 1.84h-.4c-1.86 0-3.63.4-5.21 1.12-.94.42-2.07.17-2.6-.72l-2.7-4.57a1.79 1.79 0 0 1 .69-2.51Zm-1.06 9.72-3.98-3.5a1.73 1.73 0 0 1-.06-2.6 1.7 1.7 0 0 1 2.54.24l3.26 4.17c.64.81.78 1.77.37 2.16-.42.4-1.35.2-2.13-.47Zm1.76 9.66a9.12 9.12 0 1 1 18.25 0 9.12 9.12 0 0 1-18.25 0Zm18.9 19.38a21.62 21.62 0 0 1-10.46 2.32c-.39-.01-.66-.87-.6-1.9l.29-5.28c.05-1.03.3-1.85.55-1.84h.45c1.7 0 3.33-.33 4.82-.94.95-.4 2.12-.13 2.68.73l2.88 4.44c.56.87.32 2.01-.6 2.48Zm5.09-3.55c-.72.67-1.87.51-2.52-.28l-3.35-4.12c-.66-.79-.81-1.71-.4-2.1.4-.37 1.34-.16 2.11.52L42.85 41c.78.68.88 1.83.17 2.5Z"/>
    `;

    Spicetify.Player.addEventListener("onplaypause", () => {
        isPlaying = Spicetify.Player.isPlaying();
        $icon.classList.toggle(`${NAMESPACE}--playing`, isPlaying);
    });

    $existingBackButton.before($button);
})();
