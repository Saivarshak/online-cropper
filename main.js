document.addEventListener("DOMContentLoaded", () => {

  const API = "https://video-trimmer-backend.onrender.com";

  // ============================================
  // ELEMENT REFERENCES
  // ============================================
  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const timelineWrap = document.getElementById("timelineWrap");
  const thumbStrip = document.getElementById("thumbStrip");
  const startHandle = document.getElementById("startHandle");
  const endHandle = document.getElementById("endHandle");
  const startBubble = document.getElementById("startBubble");
  const endBubble = document.getElementById("endBubble");

  const fileInput = document.getElementById("openFile");
  const trimBtn = document.getElementById("trimBtn");
  const resetBtn = document.getElementById("resetBtn");
  const downloadTrimBtn = document.getElementById("downloadTrimBtn");

  // ============================================
  // INTERNAL STATE
  // ============================================
  let videoDuration = 0;
  let startTime = 0;
  let endTime = 0;
  let currentFileObject = null;
  let lastUploadedFilename = null;
  let lastTrimmedUrl = null;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const fmt = sec => 
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

  // ============================================
  // OVERLAY MASKS
  // ============================================
  const leftMask = document.createElement("div");
  const rightMask = document.createElement("div");
  const selectionOverlay = document.createElement("div");

  [leftMask, rightMask, selectionOverlay].forEach(el => {
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.bottom = "0";
    el.style.pointerEvents = "none";
  });

  leftMask.style.background = rightMask.style.background = "rgba(0,0,0,0.65)";
  selectionOverlay.style.border = "4px solid rgba(0,123,255,0.95)";
  selectionOverlay.style.borderRadius = "10px";

  if (getComputedStyle(timelineWrap).position === "static") {
    timelineWrap.style.position = "relative";
  }

  timelineWrap.append(leftMask, rightMask, selectionOverlay);

  // ============================================
  // UI HELPERS
  // ============================================
  function updateBubbles() {
    startBubble.textContent = fmt(startTime);
    endBubble.textContent = fmt(endTime);

    startBubble.style.left = parseFloat(startHandle.style.left) + "px";
    endBubble.style.left = (parseFloat(endHandle.style.left) - 40) + "px";
  }

  function updateMasks() {
    const w = timelineWrap.clientWidth;
    const s = clamp(parseFloat(startHandle.style.left) || 0, 0, w);
    const e = clamp(parseFloat(endHandle.style.left) || w, 0, w);

    leftMask.style.width = s + "px";
    rightMask.style.left = e + "px";
    rightMask.style.width = (w - e) + "px";

    selectionOverlay.style.left = s + "px";
    selectionOverlay.style.width = (e - s) + "px";
  }

  function syncHandlesToTimes() {
    const w = timelineWrap.clientWidth;

    startHandle.style.left = (startTime / videoDuration) * w + "px";
    endHandle.style.left = (endTime / videoDuration) * w + "px";

    updateMasks();
    updateBubbles();
  }

  // ============================================
  // DRAGGING HANDLES
  // ============================================
  function makeDraggable(handle, isStart) {
    handle.style.position = "absolute";

    const startDrag = clientX => {
      const rect = timelineWrap.getBoundingClientRect();
      const initial = parseFloat(handle.style.left) || 0;
      const offset = clientX - (rect.left + initial);

      const onMove = clientXMove => {
        const r = timelineWrap.getBoundingClientRect();
        let x = clamp(clientXMove - r.left - offset, 0, r.width);

        if (isStart) {
          x = Math.min(x, parseFloat(endHandle.style.left) || r.width);
          startHandle.style.left = x + "px";
          startTime = (x / r.width) * videoDuration;
        } else {
          x = Math.max(x, parseFloat(startHandle.style.left) || 0);
          endHandle.style.left = x + "px";
          endTime = (x / r.width) * videoDuration;
        }

        updateMasks();
        updateBubbles();
        renderThumbnails();
      };

      const mouseMove = e => onMove(e.clientX);
      const touchMove = e => onMove(e.touches[0].clientX);

      const stop = () => {
        document.removeEventListener("mousemove", mouseMove);
        document.removeEventListener("mouseup", stop);
        document.removeEventListener("touchmove", touchMove);
        document.removeEventListener("touchend", stop);
      };

      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", stop);
      document.addEventListener("touchmove", touchMove);
      document.addEventListener("touchend", stop);
    };

    handle.addEventListener("mousedown", e => startDrag(e.clientX));
    handle.addEventListener("touchstart", e => startDrag(e.touches[0].clientX), { passive: true });
  }

  makeDraggable(startHandle, true);
  makeDraggable(endHandle, false);

  // ============================================
  // THUMBNAILS
  // ============================================
  function captureFrameAt(videoEl, time, width = 60, height = 40) {
    return new Promise(resolve => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      videoEl.currentTime = time;
      videoEl.addEventListener(
        "seeked",
        () => {
          ctx.drawImage(videoEl, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg"));
        },
        { once: true }
      );
    });
  }

  async function renderThumbnails() {
    thumbStrip.innerHTML = "";
    if (!videoDuration || endTime <= startTime) return;

    const count = 12;
    const segment = (endTime - startTime) / count;

    for (let i = 0; i < count; i++) {
      const t = startTime + segment * i;
      const dataURL = await captureFrameAt(preview, t);

      const img = document.createElement("img");
      img.src = dataURL;
      img.style.width = "60px";
      img.style.height = "40px";

      thumbStrip.appendChild(img);
    }
  }

  // ============================================
  // FILE UPLOAD
  // ============================================
  async function uploadFile(file) {
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append("video", file);

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: fd
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");

      lastUploadedFilename = data.filename;
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  }

  // File picker
  fileInput.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;

    currentFileObject = f;

    preview.src = URL.createObjectURL(f);
    preview.load();

    uploadFile(f);
  });

  // Click preview to open file
  preview.style.cursor = "pointer";
  preview.addEventListener("click", () => fileInput.click());

  // ============================================
  // TRIM VIDEO
  // ============================================
  trimBtn.addEventListener("click", async () => {
    if (!lastUploadedFilename) return alert("Upload a video first.");

    const rect = timelineWrap.getBoundingClientRect();
    const width = rect.width;

    startTime = (parseFloat(startHandle.style.left) / width) * videoDuration;
    endTime = (parseFloat(endHandle.style.left) / width) * videoDuration;

    if (startTime >= endTime) return alert("Invalid trim range");

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
      if (!data.success) throw new Error(data.error || "Trim failed");

      lastTrimmedUrl = `${API}${data.url}`;

      // Load trimmed video
      trimmedVideo.src = lastTrimmedUrl;
      trimmedVideo.currentTime = 0;

      trimmedVideo.play().catch(() => {});
    } catch (err) {
      alert("Trim failed: " + err.message);
    }
  });

  // ============================================
  // RESET
  // ============================================
  resetBtn.addEventListener("click", () => {
    startTime = 0;
    endTime = videoDuration;
    syncHandlesToTimes();
    renderThumbnails();
  });

  // ============================================
  // DOWNLOAD TRIMMED
  // ============================================
  downloadTrimBtn.addEventListener("click", async () => {
    if (!lastTrimmedUrl) return alert("Trim first.");

    const r = await fetch(lastTrimmedUrl);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trimmed_video.mp4";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ============================================
  // VIDEO LOADED
  // ============================================
  preview.addEventListener("loadedmetadata", () => {
    videoDuration = preview.duration;
    startTime = 0;
    endTime = videoDuration;

    syncHandlesToTimes();
    renderThumbnails();
  });
});

  // ============================================
  // SERVER TRIM → PREVIEW BLOB VIDEO
  // ============================================

  // Replace existing trim logic below with this block if needed
  trimBtn.addEventListener("click", async () => {
    if (!currentFileObject) {
      alert("Please upload a video first.");
      return;
    }

    const rect = timelineWrap.getBoundingClientRect();
    const width = rect.width;

    // Calculate trim times
    startTime = (parseFloat(startHandle.style.left) / width) * videoDuration;
    endTime = (parseFloat(endHandle.style.left) / width) * videoDuration;

    if (startTime >= endTime) {
      alert("Invalid selection range.");
      return;
    }

    try {
      const form = new FormData();
      form.append("video", currentFileObject);
      form.append("start", startTime);
      form.append("end", endTime);

      const res = await fetch(`${API}/trim`, {
        method: "POST",
        body: form
      });

      if (!res.ok) {
        alert("Trim failed. Check backend.");
        return;
      }

      // Blob from server
      const blob = await res.blob();

      // Local preview file
      const url = URL.createObjectURL(blob);

      trimmedVideo.src = url;
      trimmedVideo.currentTime = 0;
      trimmedVideo.play().catch(() => {});

      lastTrimmedUrl = url; // store for download
    } catch (err) {
      alert("Trim failed: " + err.message);
    }
  });

  // ============================================
  // DOWNLOADING TRIM RESULT
  // ============================================
  downloadTrimBtn.addEventListener("click", () => {
    if (!lastTrimmedUrl) {
      alert("Trim a video first.");
      return;
    }

    const a = document.createElement("a");
    a.href = lastTrimmedUrl;
    a.download = "trimmed_video.mp4";
    a.click();
  });

