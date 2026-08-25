// Mini-video disponibili
const videos = [
    "es1.mp4", "es2.mp4", "es3.mp4", "es4.mp4", "es5.mp4",
    "es6.mp4", "es7.mp4", "es8.mp4", "es9.mp4", "es10.mp4"
];

let selectedVideos = [];
let currentIndex = 0;
let phase = "idle";
let timer;
let workSeconds = 40;
let restSeconds = 10;

// Genera mini preview
const gallery = document.getElementById("videoGallery");
videos.forEach(v => {
    const vid = document.createElement("video");
    vid.src = v;
    vid.className = "thumb";
    vid.muted = true;
    vid.loop = true;
    vid.onclick = () => toggleSelect(v, vid);
    gallery.appendChild(vid);
});

function toggleSelect(src, element) {
    if (selectedVideos.includes(src)) {
        selectedVideos = selectedVideos.filter(v => v !== src);
        element.style.border = "none";
    } else {
        selectedVideos.push(src);
        element.style.border = "3px solid #00ff88";
    }
}

// Timer circolare
function updateRing(total, remaining) {
    const circleLength = 565;
    const progress = (remaining / total) * circleLength;
    document.getElementById("ring").style.strokeDashoffset = progress;
    document.getElementById("countdownText").innerText = remaining;
}

// Beep 3-2-1
function beepCountdown() {
    let count = 3;
    const interval = setInterval(() => {
        console.log(count);
        count--;
        if (count === 0) clearInterval(interval);
    }, 1000);
}

// Cambia video
function showVideo(src) {
    const vid = document.getElementById("exerciseVideo");
    vid.src = src;
    vid.play();
}

// Timer generico
function startTimer(seconds, callback) {
    let remaining = seconds;
    updateRing(seconds, remaining);

    timer = setInterval(() => {
        remaining--;
        updateRing(seconds, remaining);

        if (remaining === 3) beepCountdown();

        if (remaining <= 0) {
            clearInterval(timer);
            callback();
        }
    }, 1000);
}

// ROUTINE 1 — Libera
function routine1() {
    if (currentIndex >= selectedVideos.length) {
        alert("Routine completata!");
        return;
    }

    const currentVideo = selectedVideos[currentIndex];
    const nextVideo = selectedVideos[currentIndex + 1];

    // Preparazione
    showVideo(currentVideo);
    startTimer(5, () => {
        // 3×40s lavoro
        let round = 1;
        function doRound() {
            showVideo(currentVideo);
            startTimer(workSeconds, () => {
                if (round < 3) {
                    showVideo(nextVideo || currentVideo);
                    startTimer(restSeconds, () => {
                        round++;
                        doRound();
                    });
                } else {
                    currentIndex++;
                    routine1();
                }
            });
        }
        doRound();
    });
}

// ROUTINE 2 — Tutti gli esercizi (1×40s)
function routine2() {
    const currentVideo = videos[currentIndex];
    const nextVideo = videos[(currentIndex + 1) % videos.length];

    showVideo(currentVideo);

    startTimer(5, () => {
        startTimer(workSeconds, () => {
            showVideo(nextVideo);
            startTimer(restSeconds, () => {
                currentIndex++;
                if (currentIndex >= videos.length) {
                    currentIndex = 0;
                }
                routine2();
            });
        });
    });
}

// ROUTINE 3 — Ogni esercizio 3 volte
function routine3() {
    const currentVideo = videos[currentIndex];
    const nextVideo = videos[(currentIndex + 1) % videos.length];

    showVideo(currentVideo);

    startTimer(5, () => {
        let round = 1;
        function doRound() {
            showVideo(currentVideo);
            startTimer(workSeconds, () => {
                if (round < 3) {
                    showVideo(nextVideo);
                    startTimer(restSeconds, () => {
                        round++;
                        doRound();
                    });
                } else {
                    currentIndex++;
                    if (currentIndex >= videos.length) currentIndex = 0;
                    routine3();
                }
            });
        }
        doRound();
    });
}

// Avvio routine
function startRoutine(n) {
    workSeconds = parseInt(document.getElementById("workInput").value);
    restSeconds = parseInt(document.getElementById("restInput").value);

    currentIndex = 0;

    if (n === 1) routine1();
    if (n === 2) routine2();
    if (n === 3) routine3();
}
