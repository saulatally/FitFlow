// Costanti
const PREP_TIME = 5;
const WORK_TIME = 40;
const PAUSE_TIME = 15;
const TOTAL_CYCLES = 3;

let interval = null;
let totalTime = 0;
let elapsed = 0;
let paused = false;
let selectedVideos = [];

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "it-IT";
    speechSynthesis.speak(msg);
}

function beep() {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 900;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

function countdownBeep() {
    let count = 3;
    let interval = setInterval(() => {
        beep();
        speak(count.toString());
        count--;
        if (count === 0) clearInterval(interval);
    }, 700);
}

function updateCircle() {
    const ring = document.getElementById("progressRing");
    const circumference = 754;
    const progress = (elapsed / totalTime) * circumference;
    ring.style.strokeDashoffset = circumference - progress;
}

function updateTimerText(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    document.getElementById("timerText").innerText = `${m}:${s}`;
}

// Selezione mini-video per routine libera
function toggleVideo(name, el) {
    const idx = selectedVideos.indexOf(name);
    if (idx === -1) {
        selectedVideos.push(name);
        el.classList.add("selected");
    } else {
        selectedVideos.splice(idx, 1);
        el.classList.remove("selected");
    }
}

// Mostra video grande
function openExercise(src) {
    const vid = document.getElementById("exerciseVideo");
    vid.src = src;
    vid.play();
}

// Anteprima del prossimo esercizio (durante pausa)
function showNextPreview(nextVideo) {
    const vid = document.getElementById("exerciseVideo");
    vid.src = nextVideo;
    vid.play();
}

// Lettore musicale
function toggleMusic() {
    const m = document.getElementById("musicPlayer");
    if (m.paused) m.play();
    else m.pause();
}

// Pausa / Avvio manuale
function pauseTimer() {
    paused = true;
    clearInterval(interval);
}

function resumeTimer() {
    if (!paused) return;
    paused = false;

    interval = setInterval(() => {
        elapsed++;
        updateTimerText(totalTime - elapsed);
        updateCircle();

        if (elapsed >= totalTime) {
            clearInterval(interval);
        }
    }, 1000);
}

// Fase preparazione
function runPreparation(callback) {
    document.getElementById("phaseText").innerText = "Preparazione";
    document.getElementById("roundText").innerText = "";
    document.getElementById("progressRing").style.stroke = "#FFA500";
    speak("Preparazione");

    totalTime = PREP_TIME;
    elapsed = 0;
    updateTimerText(totalTime);
    updateCircle();

    clearInterval(interval);
    interval = setInterval(() => {
        elapsed++;
        updateTimerText(totalTime - elapsed);
        updateCircle();

        if (totalTime - elapsed <= 3 && totalTime - elapsed > 0) {
            beep();
        }

        if (elapsed >= totalTime) {
            clearInterval(interval);
            callback();
        }
    }, 1000);
}

// Fase lavoro
function runWork(label, duration, roundInfo, callback) {
    document.getElementById("phaseText").innerText = label;
    document.getElementById("roundText").innerText = roundInfo || "";
    document.getElementById("progressRing").style.stroke = "#4CAF50";
    speak(label);

    totalTime = duration;
    elapsed = 0;
    updateTimerText(duration);
    updateCircle();

    clearInterval(interval);
    interval = setInterval(() => {
        elapsed++;
        updateTimerText(totalTime - elapsed);
        updateCircle();

        if (elapsed >= totalTime) {
            clearInterval(interval);
            countdownBeep();
            setTimeout(callback, 2500);
        }
    }, 1000);
}

// Fase pausa (con anteprima già impostata)
function runPause(callback) {
    document.getElementById("phaseText").innerText = "Pausa";
    document.getElementById("progressRing").style.stroke = "#0078ff";
    speak("Pausa");

    totalTime = PAUSE_TIME;
    elapsed = 0;
    updateTimerText(totalTime);
    updateCircle();

    clearInterval(interval);
    interval = setInterval(() => {
        elapsed++;
        updateTimerText(totalTime - elapsed);
        updateCircle();

        if (elapsed >= totalTime) {
            clearInterval(interval);
            callback();
        }
    }, 1000);
}

// Un solo blocco di lavoro (40s)
function runSingleWorkBlock(done) {
    runWork("Lavoro", WORK_TIME, "", done);
}

// Tre blocchi di lavoro (3×40s con pausa tra i round)
function runThreeWorkBlocks(done) {
    let round = 1;
    const totalRounds = 3;

    function nextRound() {
        if (round > totalRounds) {
            done();
            return;
        }

        runWork("Lavoro", WORK_TIME, `Round ${round} di ${totalRounds}`, () => {
            if (round < totalRounds) {
                showNextPreview(document.getElementById("exerciseVideo").src);
                runPause(() => {
                    round++;
                    nextRound();
                });
            } else {
                done();
            }
        });
    }

    nextRound();
}

// ROUTINE 1 – Libera (lista selezionata, ogni esercizio 3×40s)
function startFreeRoutine() {
    if (selectedVideos.length === 0) {
        speak("Seleziona almeno un esercizio");
        return;
    }

    let index = 0;

    function nextExercise() {
        if (index >= selectedVideos.length) {
            speak("Routine libera completata");
            return;
        }

        const current = selectedVideos[index];
        openExercise(current);

        runPreparation(() => {
            runThreeWorkBlocks(() => {
                const next = selectedVideos[(index + 1) % selectedVideos.length];
                showNextPreview(next);
                runPause(() => {
                    index++;
                    nextExercise();
                });
            });
        });
    }

    nextExercise();
}

// ROUTINE 2 – Tutti gli esercizi, 1×40s ciascuno, ciclo ripetuto
function startAllRoutine() {
    const allVideos = [
        "Es1.mp4","Es2.mp4","Es3.mp4","Es4.mp4","Es5.mp4",
        "Es6.mp4","Es7.mp4","Es8.mp4","Es9.mp4","Es10.mp4"
    ];

    let cycle = 1;

    function runCycle() {
        if (cycle > TOTAL_CYCLES) {
            speak("Routine completa");
            return;
        }

        let index = 0;

        function nextExercise() {
            if (index >= allVideos.length) {
                cycle++;
                runCycle();
                return;
            }

            const current = allVideos[index];
            const next = allVideos[(index + 1) % allVideos.length];

            openExercise(current);

            runPreparation(() => {
                runSingleWorkBlock(() => {
                    showNextPreview(next);
                    runPause(() => {
                        index++;
                        nextExercise();
                    });
                });
            });
        }

        nextExercise();
    }

    runCycle();
}

// ROUTINE 3 – Ogni esercizio 3×40s, ciclo ripetuto
function startSequentialRoutine() {
    const seqVideos = [
        "Es1.mp4","Es2.mp4","Es3.mp4","Es4.mp4","Es5.mp4",
        "Es6.mp4","Es7.mp4","Es8.mp4","Es9.mp4","Es10.mp4"
    ];

    let cycle = 1;

    function runCycle() {
        if (cycle > TOTAL_CYCLES) {
            speak("Routine completa");
            return;
        }

        let index = 0;

        function nextExercise() {
            if (index >= seqVideos.length) {
                cycle++;
                runCycle();
                return;
            }

            const current = seqVideos[index];
            const next = seqVideos[(index + 1) % seqVideos.length];

            openExercise(current);

            runPreparation(() => {
                runThreeWorkBlocks(() => {
                    showNextPreview(next);
                    runPause(() => {
                        index++;
                        nextExercise();
                    });
                });
            });
        }

        nextExercise();
    }

    runCycle();
}

// Reset
function resetTimer() {
    clearInterval(interval);
    elapsed = 0;
    updateTimerText(0);
    document.getElementById("progressRing").style.strokeDashoffset = 754;
    document.getElementById("phaseText").innerText = "Fase";
    document.getElementById("roundText").innerText = "Round";
}
