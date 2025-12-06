document.addEventListener("DOMContentLoaded", () => {

    const API = "https://video-trimmer-backend.onrender.com";

    // =========================
    // ELEMENTS
    // =========================
    const preview = document.getElementById("preview");
    const trimmedVideo = document.getElementById("trimmedvideo");
    const timelineWrap = document.getElementById("timelineWrap");
    const thumbStrip = document.getElementById("thumbStrip");
    const startHandle = document.getElementById("startHandle");
    const endHandle = document.getElementById("endHandle");
    const startBubble = document.getElementById("startBubble");
    const endBubble = document.getElementById("endBubble");

    const trimBtn = document.getElementById("trimBtn");
    const resetBtn = document.getElementById("resetBtn");
    const downloadTrimBtn = document.getElementById("downloadTrimBtn");

    let videoDuration = 0;
    let startTime = 0;
    let endTime = 0;
    let lastUploadedFilename = null;
    let lastTrimmedFilename = null;

    // =========================
    // FILE UPLOAD
    // =========================

    const inputBoxes = document.querySelectorAll(".url-input");

    inputBoxes.forEach(box => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/mp4,video/webm";
        input.style.width = "100%";
        input.style.cursor = "pointer";

        box.appendChild(input);

        input.addEventListener("change", async () => {
            const file = input.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("video", file);

            const res = await fetch(`${API}/upload`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                lastUploadedFilename = data.filename;

                const videoURL = `${API}/uploads/${data.filename}`;
                preview.src = videoURL;

                // auto scroll to preview
                preview.scrollIntoView({ behavior: "smooth" });

                preview.onloadedmetadata = () => {
                    videoDuration = preview.duration;
                    endTime = videoDuration;
                    generateThumbnails();
                    updateBubbles();
                };
            }
        });
    });

    // =========================
    // TIMELINE + HANDLES
    // =========================

    function updateBubbles() {
        startBubble.textContent = formatTime(startTime);
        endBubble.textContent = formatTime(endTime);
    }

    function formatTime(t) {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function makeDraggable(handle, isStartHandle) {
        handle.addEventListener("mousedown", e => {
            e.preventDefault();
            const rect = timelineWrap.getBoundingClientRect();
            const timelineWidth = rect.width;

            const onMove = evt => {
                let x = evt.clientX - rect.left;
                if (x < 0) x = 0;
                if (x > timelineWidth) x = timelineWidth;

                const pct = x / timelineWidth;
                const time = pct * videoDuration;

                if (isStartHandle) {
                    if (time >= endTime) return;
                    startTime = time;
                    handle.style.left = `${pct * 100}%`;
                } else {
                    if (time <= startTime) return;
                    endTime = time;
                    handle.style.left = `${pct * 100}%`;
                }

                updateBubbles();
            };

            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    }

    makeDraggable(startHandle, true);
    makeDraggable(endHandle, false);

    // =========================
    // THUMBNAILS
    // =========================

    async function generateThumbnails() {
        thumbStrip.innerHTML = "";
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const count = 20; 
        const width = timelineWrap.offsetWidth / count;
        canvas.width = 120; 
        canvas.height = 70;

        for (let i = 0; i <= count; i++) {
            const time = (videoDuration / count) * i;
            preview.currentTime = time;

            await new Promise(resolve => {
                preview.onseeked = () => {
                    ctx.drawImage(preview, 0, 0, 120, 70);
                    const img = document.createElement("img");
                    img.src = canvas.toDataURL("image/png");
                    img.style.width = `${width}px`;
                    img.style.height = "70px";
                    thumbStrip.appendChild(img);
                    resolve();
                };
            });
        }
    }

    // =========================
    // TRIM VIDEO
    // =========================

    trimBtn.addEventListener("click", async () => {
        if (!lastUploadedFilename) return alert("Upload a video first.");

        const res = await fetch(`${API}/trim`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: lastUploadedFilename,
                start: startTime,
                end: endTime
            })
        });

        const data = await res.json();

        if (data.success) {
            lastTrimmedFilename = data.output;

            const trimmedURL = `${API}/output/${data.output}`;
            trimmedVideo.src = trimmedURL;

            trimmedVideo.scrollIntoView({ behavior: "smooth" });

            trimmedVideo.onended = () => {
                downloadTrimBtn.style.display = "block";
            };
        }
    });

    // =========================
    // DOWNLOAD TRIMMED VIDEO
    // =========================

    downloadTrimBtn.addEventListener("click", () => {
        if (!lastTrimmedFilename) return;

        const url = `${API}/output/${lastTrimmedFilename}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = lastTrimmedFilename;
        a.click();
    });

    // =========================
    // RESET BUTTON
    // =========================

    resetBtn.addEventListener("click", () => {
        startTime = 0;
        endTime = videoDuration;

        startHandle.style.left = "0";
        endHandle.style.left = "100%";

        updateBubbles();
    });

});
