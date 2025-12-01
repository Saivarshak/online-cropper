// Full main JS including black-transparent mask effect + bounded selection highlight + server-side trimming
document.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.getElementById("loadBtn"); 
    const loadBtn = document.querySelector("button#loadBtn");
    const uploadBtn = document.getElementById("openFile");
    const preview = document.getElementById("preview");

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";

    const timelineWrap = document.getElementById("timelineWrap");
    const thumbStrip = document.getElementById("thumbStrip");
    const startHandle = document.getElementById("startHandle");
    const endHandle = document.getElementById("endHandle");
    const startBubble = document.getElementById("startBubble");
    const endBubble = document.getElementById("endBubble");
    const trimBtn = document.getElementById("trimBtn");
    const resetBtn = document.getElementById("resetBtn");
    const status = document.getElementById("status");

    let videoDuration = 0;
    let startTime = 0;
    let endTime = 0;
    let thumbnailsCanvas = null;
    let thumbnailsCtx = null;

    function setStatus(msg) {
        if (status) status.textContent = msg || "";
    }

    function scrollToPreview() {
        preview.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function formatTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function updateBubbles() {
        startBubble.textContent = formatTime(startTime);
        endBubble.textContent = formatTime(endTime);
    }

    // -----------------------------
    // MASKS + BOUNDED SELECTION HIGHLIGHT
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
    leftMask.style.zIndex = "20";

    rightMask.style.background = "rgba(0,0,0,0.65)";
    rightMask.style.zIndex = "20";

    selectionOverlay.style.background = "transparent";
    selectionOverlay.style.border = "4px solid rgba(0,123,255,0.95)";
    selectionOverlay.style.boxShadow = "0 0 8px rgba(0,123,255,0.25)";
    selectionOverlay.style.borderRadius = "12px";
    selectionOverlay.style.zIndex = "25";

    leftMask.id = "leftMask";
    rightMask.id = "rightMask";
    selectionOverlay.id = "selectionOverlay";

    if (getComputedStyle(timelineWrap).position === "static") {
        timelineWrap.style.position = "relative";
    }
    timelineWrap.appendChild(leftMask);
    timelineWrap.appendChild(rightMask);
    timelineWrap.appendChild(selectionOverlay);

    function updateMasks() {
        const rect = timelineWrap.getBoundingClientRect();
        const timelineW = rect.width || 0;

        const startPx = Math.max(0, Math.min(timelineW, parseFloat(startHandle.style.left) || 0));
        const endPxCandidate = parseFloat(endHandle.style.left);
        const endPx = isFinite(endPxCandidate) ? Math.max(0, Math.min(timelineW, endPxCandidate)) : timelineW;

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

    // ----------------------------------

    function loadVideoFromURL() {
        const val = (urlInput && urlInput.value) ? urlInput.value.trim() : "";
        if (!val) return;
        setStatus("Loading video...");
        preview.crossOrigin = "anonymous";
        preview.src = val;
        preview.load();

        preview.onloadedmetadata = () => {
            videoDuration = preview.duration || 0;
            startTime = 0;
            endTime = videoDuration;
            updateBubbles();
            scrollToPreview();
            requestAnimationFrame(() => {
                startHandle.style.left = "0px";
                const rect = timelineWrap.getBoundingClientRect();
                endHandle.style.left = Math.max(0, rect.width - 14) + "px";
                updateMasks();
            });
            generateThumbnails(preview.src).catch(() => setStatus("Ready"));
            setStatus("Ready");
        };
    }

    function loadVideoFromFile(file) {
        if (!file) return;
        setStatus("Loading video...");
        const url = URL.createObjectURL(file);
        preview.src = url;
        if (urlInput) urlInput.value = url;
        preview.removeAttribute("crossorigin");
        preview.load();

        preview.onloadedmetadata = () => {
            videoDuration = preview.duration || 0;
            startTime = 0;
            endTime = videoDuration;
            updateBubbles();
            scrollToPreview();
            requestAnimationFrame(() => {
                startHandle.style.left = "0px";
                const rect = timelineWrap.getBoundingClientRect();
                endHandle.style.left = Math.max(0, rect.width - 14) + "px";
                updateMasks();
            });
            generateThumbnails(preview.src).catch(() => setStatus("Ready"));
            setStatus("Ready");
        };
    }

    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", e => {
        const file = e.target.files[0];
        if (file) loadVideoFromFile(file);
    });

    if (loadBtn) loadBtn.addEventListener("click", loadVideoFromURL);

    function makeDraggable(handle, isStart) {
        handle.addEventListener("mousedown", (e) => {
            e.preventDefault();
            const handleRect = handle.getBoundingClientRect();
            const grabOffset = e.clientX - handleRect.left;

            function onMove(ev) {
                const rect = timelineWrap.getBoundingClientRect();
                let pos = ev.clientX - rect.left - grabOffset + (handleRect.width / 2);
                pos = Math.max(0, Math.min(pos, rect.width));
                const percent = pos / rect.width;

                if (isStart) {
                    startTime = videoDuration * percent;
                    startHandle.style.left = pos + "px";
                } else {
                    endTime = videoDuration * percent;
                    endHandle.style.left = pos + "px";
                }

                if (startTime > endTime) {
                    if (isStart) {
                        startTime = endTime;
                        startHandle.style.left = endHandle.style.left;
                    } else {
                        endTime = startTime;
                        endHandle.style.left = startHandle.style.left;
                    }
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

        handle.addEventListener("touchstart", (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const handleRect = handle.getBoundingClientRect();
            const grabOffset = touch.clientX - handleRect.left;

            function onTouchMove(ev) {
                const t = ev.touches[0];
                const rect = timelineWrap.getBoundingClientRect();
                let pos = t.clientX - rect.left - grabOffset + (handleRect.width / 2);
                pos = Math.max(0, Math.min(pos, rect.width));
                const percent = pos / rect.width;

                if (isStart) {
                    startTime = videoDuration * percent;
                    startHandle.style.left = pos + "px";
                } else {
                    endTime = videoDuration * percent;
                    endHandle.style.left = pos + "px";
                }

                if (startTime > endTime) {
                    if (isStart) {
                        startTime = endTime;
                        startHandle.style.left = endHandle.style.left;
                    } else {
                        endTime = startTime;
                        endHandle.style.left = startHandle.style.left;
                    }
                }

                updateBubbles();
                updateMasks();
            }

            function onTouchEnd() {
                document.removeEventListener("touchmove", onTouchMove);
                document.removeEventListener("touchend", onTouchEnd);
            }

            document.addEventListener("touchmove", onTouchMove, { passive: false });
            document.addEventListener("touchend", onTouchEnd);
        });
    }

    makeDraggable(startHandle, true);
    makeDraggable(endHandle, false);

    async function generateThumbnails(videoSrc) {
        setStatus("Generating thumbnails...");
        thumbStrip.innerHTML = "";

        const width = Math.max(200, timelineWrap.clientWidth || 600);
        const thumbHeight = Math.max(48, Math.floor((timelineWrap.clientHeight || 80) * 0.95));
        thumbnailsCanvas = document.createElement("canvas");
        thumbnailsCanvas.width = width;
        thumbnailsCanvas.height = thumbHeight;
        thumbnailsCanvas.style.width = "100%";
        thumbnailsCanvas.style.height = thumbHeight + "px";
        thumbnailsCanvas.style.display = "block";
        thumbnailsCanvas.style.objectFit = "cover";
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
        const times = [];

        for (let i = 0; i < numThumbs; i++) {
            times.push((i / (numThumbs - 1)) * duration);
        }

        function seekTo(time) {
            return new Promise((resolve) => {
                tempVideo.currentTime = Math.min(time, tempVideo.duration - 0.001);
                tempVideo.addEventListener("seeked", resolve, { once: true });
                setTimeout(resolve, 2000);
            });
        }

        for (let i = 0; i < times.length; i++) {
            await seekTo(times[i]);
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
                    drawH = dh;
                    drawW = dh * videoRatio;
                    drawX = dx - (drawW - dw) / 2;
                    drawY = 0;
                } else {
                    drawW = dw;
                    drawH = dw / videoRatio;
                    drawX = dx;
                    drawY = -(drawH - dh) / 2;
                }

                thumbnailsCtx.drawImage(tempVideo, drawX, drawY, drawW, drawH);
            } catch (err) {}
        }

        requestAnimationFrame(() => {
            const rect = timelineWrap.getBoundingClientRect();
            endHandle.style.left = Math.max(0, rect.width - 14) + "px";
            updateMasks();
        });

        setStatus("Ready");
    }

    // --------------------------
    // SERVER-SIDE TRIM INTEGRATION
    // --------------------------
    trimBtn.addEventListener("click", async () => {
        if (!preview.src) {
            alert("Load a video first");
            return;
        }

        setStatus("Trimming…");

        const rect = timelineWrap.getBoundingClientRect();
        const timelineWidth = rect.width || 1;
        const startLeft = parseFloat(startHandle.style.left) || 0;
        const endLeft = parseFloat(endHandle.style.left) || timelineWidth;
        const computedStart = (startLeft / timelineWidth) * videoDuration;
        const computedEnd = (endLeft / timelineWidth) * videoDuration;

        startTime = Math.max(0, Math.min(videoDuration, computedStart));
        endTime = Math.max(0, Math.min(videoDuration, computedEnd));

        if (startTime >= endTime) {
            alert("Start must be before end");
            setStatus("Ready");
            return;
        }

        let filename = "";
        if (preview.src.includes("/backend/uploads/")) {
            filename = preview.src.split("/backend/uploads/")[1];
        } else {
            alert("Uploaded video not recognized for server trim.");
            setStatus("Ready");
            return;
        }

        try {
            const formData = new URLSearchParams({
                filename,
                start: startTime,
                end: endTime
            });

            const response = await fetch("https://videotrimmer.online/backend/trim.php", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                preview.src = "https://videotrimmer.online/backend/" + data.url;
                preview.load();
                setStatus("Trim complete!");
            } else {
                alert("Trimming failed: " + (data.error || "Unknown error"));
                setStatus("Ready");
            }
        } catch (err) {
            alert("Server error: " + err.message);
            setStatus("Ready");
        }
    });

    resetBtn.addEventListener("click", () => {
        startTime = 0;
        endTime = videoDuration;
        startHandle.style.left = "0px";

        requestAnimationFrame(() => {
            const rect = timelineWrap.getBoundingClientRect();
            endHandle.style.left = Math.max(0, rect.width - 14) + "px";
            updateMasks();
        });

        updateBubbles();
    });

    window.addEventListener("resize", () => {
        requestAnimationFrame(() => {
            const rect = timelineWrap.getBoundingClientRect();
            const percent = videoDuration ? endTime / videoDuration : 1;
            endHandle.style.left = Math.max(0, rect.width * percent - 14) + "px";
            updateMasks();

            if (preview.src) {
                if (window._thumbResizeTimer) clearTimeout(window._thumbResizeTimer);
                window._thumbResizeTimer = setTimeout(() => {
                    generateThumbnails(preview.src);
                }, 300);
            }
        });
    });

    if (preview && preview.src) {
        preview.addEventListener("loadedmetadata", () => {
            videoDuration = preview.duration;
            startTime = 0;
            endTime = videoDuration;
            updateBubbles();
            updateMasks();
            generateThumbnails(preview.src);
        }, { once: true });
    }

    timelineWrap.addEventListener("click", (e) => {
        const rect = timelineWrap.getBoundingClientRect();
        const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const t = (pos / rect.width) * videoDuration;
        if (isFinite(t)) preview.currentTime = t;
    });

    requestAnimationFrame(updateMasks);
});
