// -----------------------------
// VIDEO TRIMMER JS (Clean & Single Block)
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------
    // ELEMENTS
    // -----------------------------
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
    const downloadBtn = document.getElementById("downloadTrimBtn");
    const uploadBtn = document.getElementById("openFile"); // button to open file input

    // -----------------------------
    // STATE
    // -----------------------------
    let videoDuration = 0;
    let startTime = 0;
    let endTime = 0;
    let thumbnailsCanvas = null;
    let thumbnailsCtx = null;
    let lastUploadedFilename = null;
    let lastTrimmedUrl = null;
    let currentFileObject = null;
    let isUploadComplete = false;

    // -----------------------------
    // HELPERS
    // -----------------------------
    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }

    function updateBubbles() {
        startBubble.textContent = formatTime(startTime);
        endBubble.textContent = formatTime(endTime);
    }

    function scrollToPreview() {
        preview.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function setStatus(msg) {
        console.log(msg || "");
    }

    // -----------------------------
    // MASKS + SELECTION
    // -----------------------------
    const leftMask = document.createElement("div");
    const rightMask = document.createElement("div");
    const selectionOverlay = document.createElement("div");

    [leftMask, rightMask, selectionOverlay].forEach(el => {
        el.style.position = "absolute";
        el.style.top = "0";
        el.style.bottom = "0";
        el.style.pointerEvents = "none";
    });

    leftMask.style.background = "rgba(0,0,0,0.65)";
    rightMask.style.background = "rgba(0,0,0,0.65)";
    selectionOverlay.style.background = "transparent";
    selectionOverlay.style.border = "4px solid rgba(0,123,255,0.95)";
    selectionOverlay.style.boxShadow = "0 0 8px rgba(0,123,255,0.25)";
    selectionOverlay.style.borderRadius = "12px";

    if (getComputedStyle(timelineWrap).position === "static") timelineWrap.style.position = "relative";

    timelineWrap.appendChild(leftMask);
    timelineWrap.appendChild(rightMask);
    timelineWrap.appendChild(selectionOverlay);

    function updateMasks() {
        const rect = timelineWrap.getBoundingClientRect();
        const timelineW = rect.width || 0;
        const startPx = parseFloat(startHandle.style.left) || 0;
        const endPx = parseFloat(endHandle.style.left) || timelineW;

        leftMask.style.left = "0px";
        leftMask.style.width = `${startPx}px`;

        rightMask.style.left = `${endPx}px`;
        rightMask.style.width = `${Math.max(0, timelineW - endPx)}px`;

        const selLeft = startPx;
        const selWidth = Math.max(0, endPx - startPx);
        selectionOverlay.style.left = `${selLeft}px`;
        selectionOverlay.style.width = `${selWidth}px`;
        selectionOverlay.style.opacity = selWidth < 8 ? "0" : "1";
    }

    // -----------------------------
    // DRAG HANDLES
    // -----------------------------
    function makeDraggable(handle, isStart) {
        handle.addEventListener("mousedown", (e) => {
            e.preventDefault();
            const grabOffset = e.clientX - handle.getBoundingClientRect().left;

            function onMove(ev) {
                const rect = timelineWrap.getBoundingClientRect();
                let pos = ev.clientX - rect.left - grabOffset + (handle.offsetWidth / 2);
                pos = Math.max(0, Math.min(pos, rect.width));

                if (isStart) {
                    const endPx = parseFloat(endHandle.style.left) || rect.width;
                    pos = Math.min(pos, endPx);
                    startTime = (pos / rect.width) * videoDuration;
                    startHandle.style.left = pos + "px";
                } else {
                    const startPx = parseFloat(startHandle.style.left) || 0;
                    pos = Math.max(pos, startPx);
                    endTime = (pos / rect.width) * videoDuration;
                    endHandle.style.left = pos + "px";
                }

                updateBubbles();
                updateMasks();
            }

            function onUp() {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            }

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    }

    makeDraggable(startHandle, true);
    makeDraggable(endHandle, false);

    // -----------------------------
    // FILE INPUT
    // -----------------------------
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    if (uploadBtn) uploadBtn.addEventListener("click", () => fileInput.click());

    async function loadVideoFromFile(file) {
        if (!file) return;
        currentFileObject = file;

        // Preview
        preview.src = URL.createObjectURL(file);
        preview.load();
        preview.onloadedmetadata = () => {
            videoDuration = preview.duration;
            startTime = 0;
            endTime = videoDuration;
            startHandle.style.left = "0px";
            endHandle.style.left = (timelineWrap.getBoundingClientRect().width - 14) + "px";
            updateBubbles();
            updateMasks();
            scrollToPreview();
        };

        // Generate thumbnails
        generateThumbnails(preview.src);

        // Upload to server
        isUploadComplete = false;
        try {
            setStatus("Uploading...");
            const fd = new FormData();
            fd.append("video", file);
            const res = await fetch("http://localhost:5000/upload", { method: "POST", body: fd });
            const data = await res.json();
            lastUploadedFilename = data.videoPath || data.url || null;
            isUploadComplete = true;
            setStatus("Upload complete");
        } catch (err) {
            console.error("Upload failed:", err);
            setStatus("Upload failed");
            isUploadComplete = false;
        }
    }

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        loadVideoFromFile(file);
    });

    // -----------------------------
    // GENERATE THUMBNAILS
    // -----------------------------
    async function generateThumbnails(videoSrc) {
        if (!thumbStrip) return;
        thumbStrip.innerHTML = "";
        const width = Math.max(200, timelineWrap.clientWidth || 600);
        const thumbHeight = Math.max(48, Math.floor((timelineWrap.clientHeight || 80) * 0.95));
        thumbnailsCanvas = document.createElement("canvas");
        thumbnailsCanvas.width = width;
        thumbnailsCanvas.height = thumbHeight;
        thumbnailsCanvas.style.width = "100%";
        thumbnailsCanvas.style.height = thumbHeight + "px";
        thumbnailsCtx = thumbnailsCanvas.getContext("2d");
        thumbStrip.appendChild(thumbnailsCanvas);

        const desiredThumbW = 80;
        const numThumbs = Math.max(4, Math.floor(width / desiredThumbW));
        const actualThumbW = Math.floor(width / numThumbs);

        const tempVideo = document.createElement("video");
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.crossOrigin = "anonymous";
        tempVideo.src = videoSrc;

        await new Promise((res, rej) => {
            tempVideo.addEventListener("loadedmetadata", res, { once: true });
            tempVideo.addEventListener("error", rej, { once: true });
        });

        const duration = tempVideo.duration || videoDuration;
        const times = Array.from({ length: numThumbs }, (_, i) => (i / (numThumbs - 1)) * duration);

        for (let i = 0; i < times.length; i++) {
            await new Promise(resolve => {
                tempVideo.currentTime = Math.min(times[i], tempVideo.duration - 0.001);
                tempVideo.addEventListener("seeked", resolve, { once: true });
                setTimeout(resolve, 1000); // fallback
            });
            const dx = i * actualThumbW;
            const dy = 0;
            const dw = actualThumbW;
            const dh = thumbHeight;
            thumbnailsCtx.fillStyle = "#123a66";
            thumbnailsCtx.fillRect(dx, dy, dw, dh);
            try {
                const videoRatio = tempVideo.videoWidth / tempVideo.videoHeight;
                const canvasRatio = dw / dh;
                let drawW, drawH, drawX, drawY;
                if (videoRatio > canvasRatio) {
                    drawH = dh; drawW = dh * videoRatio; drawX = dx - (drawW - dw) / 2; drawY = 0;
                } else {
                    drawW = dw; drawH = dw / videoRatio; drawX = dx; drawY = -(drawH - dh) / 2;
                }
                thumbnailsCtx.drawImage(tempVideo, drawX, drawY, drawW, drawH);
            } catch (err) { }
        }
    }

    // -----------------------------
    // TRIM & PREVIEW
    // -----------------------------
    trimBtn.addEventListener("click", async () => {
        if (!currentFileObject) return alert("No video loaded.");

        const rect = timelineWrap.getBoundingClientRect();
        const timelineWidth = rect.width || 1;
        startTime = (parseFloat(startHandle.style.left) || 0) / timelineWidth * videoDuration;
        endTime = (parseFloat(endHandle.style.left) || timelineWidth) / timelineWidth * videoDuration;

        if (startTime >= endTime) return alert("Start must be before end.");

        // Local preview
        trimmedVideo.src = preview.src;
        trimmedVideo.currentTime = startTime;
        trimmedVideo.play().catch(() => { });
        trimmedVideo.scrollIntoView({ behavior: "smooth", block: "center" });

        // Server trim
        if (isUploadComplete && lastUploadedFilename) {
            try {
                const res = await fetch("http://localhost:5000/trim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ inputPath: lastUploadedFilename, start: startTime, end: endTime })
                });
                const data = await res.json();
                lastTrimmedUrl = "http://localhost:5000/" + (data.output || data.url);
                setStatus("Trim complete. Preview below.");
            } catch (err) {
                console.error("Server trim failed:", err);
                setStatus("Trim failed");
            }
        }
    });

    // -----------------------------
    // DOWNLOAD
    // -----------------------------
    downloadBtn.addEventListener("click", async () => {
        if (!lastTrimmedUrl) return alert("No trimmed video to download.");
        try {
            const res = await fetch(lastTrimmedUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "trimmed_video.mp4";
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert("Download failed: " + err.message);
        }
    });

    // -----------------------------
    // RESET
    // -----------------------------
    resetBtn.addEventListener("click", () => {
        startHandle.style.left = "0px";
        endHandle.style.left = (timelineWrap.getBoundingClientRect().width - 14) + "px";
        startTime = 0;
        endTime = videoDuration;
        updateBubbles();
        updateMasks();
        setStatus("Ready");
    });

    // -----------------------------
    // TIMELINE CLICK SEEK
    // -----------------------------
    timelineWrap.addEventListener("click", (e) => {
        const rect = timelineWrap.getBoundingClientRect();
        const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const t = (pos / rect.width) * videoDuration;
        if (isFinite(t)) preview.currentTime = t;
    });

    requestAnimationFrame(updateMasks);
});



const video = document.getElementById("trimmedvideo");
const timeline = document.getElementById("timelineContainer");
const startHandle = document.getElementById("startHandle");
const endHandle = document.getElementById("endHandle");
const selection = document.getElementById("selection");

let dragging = null;
let startTime = 0;
let endTime = 0;

// Update handle positions and selection overlay
function updateHandles() {
  const width = timeline.clientWidth;
  startHandle.style.left = (startTime / video.duration * width) + "px";
  endHandle.style.left = (endTime / video.duration * width) + "px";
  selection.style.left = startHandle.style.left;
  selection.style.width = (parseFloat(endHandle.style.left) - parseFloat(startHandle.style.left)) + "px";
}

// Initialize after video metadata loads
video.addEventListener("loadedmetadata", () => {
  endTime = video.duration;
  updateHandles();
});

// Start dragging
timeline.addEventListener("mousedown", (e) => {
  if (e.target === startHandle) dragging = "start";
  else if (e.target === endHandle) dragging = "end";
});

// Drag movement
window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const rect = timeline.getBoundingClientRect();
  let pos = e.clientX - rect.left;
  pos = Math.max(0, Math.min(pos, timeline.clientWidth));
  const time = pos / timeline.clientWidth * video.duration;

  if (dragging === "start") startTime = Math.min(time, endTime - 0.1);
  else if (dragging === "end") endTime = Math.max(time, startTime + 0.1);

  updateHandles();
});

// Stop dragging
window.addEventListener("mouseup", () => dragging = null);

// Clamp playback to trimmed segment
video.addEventListener("timeupdate", () => {
  if (video.currentTime < startTime) video.currentTime = startTime;
  if (video.currentTime > endTime) video.pause();
});

// Start playing from startTime if outside segment
video.addEventListener("play", () => {
  if (video.currentTime < startTime || video.currentTime > endTime) {
    video.currentTime = startTime;
  }
});
