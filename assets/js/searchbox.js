// -----------------------------
// CLEAN VIDEO TRIMMER JS (IDs Unchanged)
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {

    const API = "https://video-trimmer-backend.onrender.com";

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
    const uploadBtn = document.getElementById("openFile");

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

    const formatTime = sec => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const updateBubbles = () => {
        startBubble.textContent = formatTime(startTime);
        endBubble.textContent = formatTime(endTime);
    };

    const scrollToPreview = () => {
        preview.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const setStatus = msg => console.log(msg || "");

    // -----------------------------
    // OVERLAY MASKS
    // -----------------------------
    const leftMask = document.createElement("div");
    const rightMask = document.createElement("div");
    const selectionOverlay = document.createElement("div");

    [leftMask, rightMask, selectionOverlay].forEach(el => {
        el.style.position = "absolute";
        el.style.top = 0;
        el.style.bottom = 0;
        el.style.pointerEvents = "none";
    });

    leftMask.style.background = "rgba(0,0,0,0.65)";
    rightMask.style.background = "rgba(0,0,0,0.65)";
    selectionOverlay.style.border = "4px solid rgba(0,123,255,0.95)";
    selectionOverlay.style.borderRadius = "12px";

    if (getComputedStyle(timelineWrap).position === "static") {
        timelineWrap.style.position = "relative";
    }

    timelineWrap.append(leftMask, rightMask, selectionOverlay);

    const updateMasks = () => {
        const rect = timelineWrap.getBoundingClientRect();
        const width = rect.width || 0;

        const startPx = parseFloat(startHandle.style.left) || 0;
        const endPx = parseFloat(endHandle.style.left) || width;

        leftMask.style.left = 0;
        leftMask.style.width = `${startPx}px`;

        rightMask.style.left = `${endPx}px`;
        rightMask.style.width = `${Math.max(0, width - endPx)}px`;

        const selW = Math.max(0, endPx - startPx);
        selectionOverlay.style.left = `${startPx}px`;
        selectionOverlay.style.width = `${selW}px`;
        selectionOverlay.style.opacity = selW < 8 ? "0" : "1";
    };

    // -----------------------------
    // HANDLE DRAGGING
    // -----------------------------
    const makeDraggable = (handle, isStart) => {
        handle.addEventListener("mousedown", e => {
            e.preventDefault();
            const offset = e.clientX - handle.getBoundingClientRect().left;

            const move = ev => {
                const rect = timelineWrap.getBoundingClientRect();
                let x = ev.clientX - rect.left - offset + handle.offsetWidth / 2;
                x = Math.max(0, Math.min(x, rect.width));

                if (isStart) {
                    const endX = parseFloat(endHandle.style.left) || rect.width;
                    x = Math.min(x, endX);
                    startTime = (x / rect.width) * videoDuration;
                    startHandle.style.left = x + "px";
                } else {
                    const startX = parseFloat(startHandle.style.left) || 0;
                    x = Math.max(x, startX);
                    endTime = (x / rect.width) * videoDuration;
                    endHandle.style.left = x + "px";
                }

                updateBubbles();
                updateMasks();
            };

            const up = () => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            };

            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    };

    makeDraggable(startHandle, true);
    makeDraggable(endHandle, false);

    // -----------------------------
    // FILE UPLOAD
    // -----------------------------
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", e => loadVideo(e.target.files[0]));

    const loadVideo = async file => {
        if (!file) return;

        currentFileObject = file;
        preview.src = URL.createObjectURL(file);
        preview.load();

        preview.onloadedmetadata = () => {
            videoDuration = preview.duration;
            startTime = 0;
            endTime = videoDuration;
            startHandle.style.left = "0px";
            endHandle.style.left = timelineWrap.clientWidth - 14 + "px";
            updateBubbles();
            updateMasks();
            scrollToPreview();
        };

        generateThumbnails(preview.src);

        isUploadComplete = false;

        try {
            setStatus("Uploading...");
            const fd = new FormData();
            fd.append("video", file);

            const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
            const data = await res.json();

            lastUploadedFilename = data.filename;
            isUploadComplete = true;
            setStatus("Upload complete");
        } catch {
            setStatus("Upload failed");
            isUploadComplete = false;
        }
    };

    // -----------------------------
    // THUMBNAILS
    // -----------------------------
    const generateThumbnails = async src => {
        thumbStrip.innerHTML = "";

        const width = timelineWrap.clientWidth || 600;
        const height = 70;

        thumbnailsCanvas = document.createElement("canvas");
        thumbnailsCanvas.width = width;
        thumbnailsCanvas.height = height;
        thumbnailsCanvas.style.width = "100%";
        thumbnailsCanvas.style.height = height + "px";
        thumbnailsCtx = thumbnailsCanvas.getContext("2d");

        thumbStrip.appendChild(thumbnailsCanvas);

        const temp = document.createElement("video");
        temp.muted = true;
        temp.src = src;

        await new Promise(r => temp.addEventListener("loadedmetadata", r));

        const num = Math.max(4, Math.floor(width / 80));
        const step = temp.duration / (num - 1);

        for (let i = 0; i < num; i++) {
            const t = i * step;
            await new Promise(r => {
                temp.currentTime = t;
                temp.addEventListener("seeked", r, { once: true });
            });

            const w = Math.floor(width / num);
            const x = i * w;

            try {
                thumbnailsCtx.drawImage(temp, x, 0, w, height);
            } catch {}
        }
    };

    // -----------------------------
    // TRIM
    // -----------------------------
    trimBtn.addEventListener("click", async () => {
        if (!currentFileObject) return alert("No video loaded.");

        const rect = timelineWrap.getBoundingClientRect();
        const w = rect.width;

        startTime = (parseFloat(startHandle.style.left) || 0) / w * videoDuration;
        endTime = (parseFloat(endHandle.style.left) || w) / w * videoDuration;

        if (startTime >= endTime) return alert("Start must be before end.");

        trimmedVideo.src = preview.src;
        trimmedVideo.currentTime = startTime;
        trimmedVideo.play().catch(() => {});
        trimmedVideo.scrollIntoView({ behavior: "smooth", block: "center" });

        if (isUploadComplete && lastUploadedFilename) {
            try {
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
                if (!data.success) return alert("Trim failed: " + data.error);

                lastTrimmedUrl = `${API}${data.url}`;
                console.log("Trimmed file:", lastTrimmedUrl);
            } catch (err) {
                console.error("Server trim failed:", err);
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

            const link = URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = link;
            a.download = "trimmed_video.mp4";
            a.click();

            URL.revokeObjectURL(link);
        } catch (err) {
            alert("Download failed: " + err.message);
        }
    });

    // -----------------------------
    // RESET
    // -----------------------------
    resetBtn.addEventListener("click", () => {
        startHandle.style.left = "0px";
        endHandle.style.left = timelineWrap.clientWidth - 14 + "px";

        startTime = 0;
        endTime = videoDuration;

        updateBubbles();
        updateMasks();
    });

    // -----------------------------
    // TIMELINE CLICK SEEK
    // -----------------------------
    timelineWrap.addEventListener("click", e => {
        const rect = timelineWrap.getBoundingClientRect();
        const pos = e.clientX - rect.left;
        const pct = pos / rect.width;
        preview.currentTime = pct * videoDuration;
    });

    requestAnimationFrame(updateMasks);
});