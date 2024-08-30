// NAME: Reeeeewwwwinnnddd
// AUTHOR: Nick Colley
// DESCRIPTION: Let you rewind like you're doing a boiler room set.

(async function RewindPlugin() {
	if (!Spicetify.Player) {
		setTimeout(RewindPlugin, 1000);
		return;
	}

	const NAMESPACE = "spicetify-rewind-plugin";
    // From https://samplefocus.com/samples/vinyl-rewind
    const REWIND_AUDIO_URL = "https://cdn.jsdelivr.net/gh/NickColley/spicetify-rewind/rewind.mp3";
    const REWIND_AUDIO_START_TIME = 0.612; // in seconds
    const REWIND_AUDIO_END_TIME = 2.8; // in seconds
    
    function addStylesToPage (styles) {
        const $style = document.createElement("style");
        $style.textContent = styles;
        document.head.appendChild($style);
    }

    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    function stopAudio (audio) {
        audio.pause()
        audio.currentTime = REWIND_AUDIO_START_TIME;
    }

    // Initialise
    addStylesToPage(`
        .${NAMESPACE}--playing {
          animation: ${NAMESPACE}-playing 1s linear infinite;
        }
        .${NAMESPACE}--rewind {
          animation: ${NAMESPACE}-rewind ${REWIND_AUDIO_END_TIME}s;
        }
        @keyframes ${NAMESPACE}-playing {
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes ${NAMESPACE}-rewind {
          100% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(-10000deg);
          }
        }
    `);

    // Find existing elements in the player controls UI
    const $rewindButton = await waitForElement(".player-controls button[aria-label='Previous']");
    const $rewindButtonIconWrapper = $rewindButton.querySelector("span");
    const $rewindButtonIcon = $rewindButtonIconWrapper.querySelector("svg");

    const audioClip = new Audio(REWIND_AUDIO_URL);
    audioClip.currentTime = REWIND_AUDIO_START_TIME;

    const $button = document.createElement("button");
    $button.classList = $rewindButton.classList;
    let audioTimer = null;
    $button.addEventListener("click", () => {
        // Allow spamming of the button by resetting the audio clip.
        if (audioTimer) {
            stopAudio(audioClip);
            clearTimeout(audioTimer);
        }
        audioClip.play();
        Spicetify.Player.pause();
        Spicetify.Player.seek(0);
        $icon.classList.add(`${NAMESPACE}--rewind`);
        audioTimer = window.setTimeout(() => {
            stopAudio(audioClip);
            Spicetify.Player.play();
            $icon.classList.remove(`${NAMESPACE}--rewind`);
        }, REWIND_AUDIO_END_TIME * 1000);
    });
    const $iconWrapper = document.createElement("span");
    $iconWrapper.classList = $rewindButtonIconWrapper.classList;
    // From https://www.svgrepo.com/svg/81024/vinyl-record
    $iconWrapper.innerHTML = `
    <svg class="${$rewindButtonIcon.classList}" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 55.33 55.33">
      <circle cx="28.16" cy="27.67" r="3.37"/>
      <path d="M28.16 1.89a25.78 25.78 0 1 0-.99 51.55 25.78 25.78 0 0 0 .99-51.55Zm-9.83 6.4a21.63 21.63 0 0 1 10.44-2.32c.34 0 .58.85.53 1.88l-.27 5.29c-.05 1.02-.27 1.85-.48 1.84h-.4c-1.86 0-3.63.4-5.21 1.12-.94.42-2.07.17-2.6-.72l-2.7-4.57a1.79 1.79 0 0 1 .69-2.51Zm-1.06 9.72-3.98-3.5a1.73 1.73 0 0 1-.06-2.6 1.7 1.7 0 0 1 2.54.24l3.26 4.17c.64.81.78 1.77.37 2.16-.42.4-1.35.2-2.13-.47Zm1.76 9.66a9.12 9.12 0 1 1 18.25 0 9.12 9.12 0 0 1-18.25 0Zm18.9 19.38a21.62 21.62 0 0 1-10.46 2.32c-.39-.01-.66-.87-.6-1.9l.29-5.28c.05-1.03.3-1.85.55-1.84h.45c1.7 0 3.33-.33 4.82-.94.95-.4 2.12-.13 2.68.73l2.88 4.44c.56.87.32 2.01-.6 2.48Zm5.09-3.55c-.72.67-1.87.51-2.52-.28l-3.35-4.12c-.66-.79-.81-1.71-.4-2.1.4-.37 1.34-.16 2.11.52L42.85 41c.78.68.88 1.83.17 2.5Z"/>
    </svg>
    `;
    const $icon = $iconWrapper.querySelector("svg");

	Spicetify.Player.addEventListener("onplaypause", () => {
        const isPlaying = Spicetify.Player.isPlaying();
        $icon.classList.toggle(`${NAMESPACE}--playing`, isPlaying);
        if (isPlaying && !audioClip.paused) {
            stopAudio(audioClip);
        }
    });

    $button.append($iconWrapper);
    console.log($rewindButton);
    $rewindButton.before($button);
})();
