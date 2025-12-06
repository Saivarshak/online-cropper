document.addEventListener("DOMContentLoaded", () => {

  const API = "https://video-trimmer-backend.onrender.com";

  // =========================
  // ELEMENT REFERENCES
  // =========================
  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const timelineWrap = document.getElementById("timelineWrap");
  const thumbStrip = document.getElementById("thumbStrip");
  const startHandle = document.getElementById("startHandle");
  const endHandle = document.getElementById("endHandle");
  const startBubble = document.getElementById("startBubble");
  const endBubble = document.getElementById("endBubble");

  const fileInput = document.getElementById("openFile");
  const urlInput = document.getElementById("loadBtn");
  const loadUrlBtn = document.getElementById("loadVideoBtn");

  const trimBtn = document.getElementById("trimBtn");
  const resetBtn = document.getElementById("resetBtn");
  const downloadTrimBtn = document.getElementById("downloadTrimBtn");

  if (!preview || !timelineWrap || !startHandle || !endHandle) {
    console.error("Required elements missing in HTML!");
    return;
  }

  // =========================
  // INTERNAL STATE
  // =========================
  let videoDuration = 0;
  let startTime = 0;
  let endTime = 0;
  let currentFileObject = null;
  let lastUploadedFilename = null;
  let lastTrimmedUrl = null;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const fmt = sec => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

  const setStatus = msg => console.log("[trimmer] " + msg);

  // =========================
  // MASK OVERLAYS
  // =========================
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

  // =========================
  // UPDATE UI HELPERS
  // =========================
  function updateBubbles() {
    if (startBubble) startBubble.textContent = fmt(startTime);
    if (endBubble) endBubble.textContent = fmt(endTime);

    if (startBubble && startHandle) {
      startBubble.style.left = (parseFloat(startHandle.style.left) + 4) + "px";
    }
    if (endBubble && endHandle) {
      endBubble.style.left = (parseFloat(endHandle.style.left) - 40) + "px";
    }
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

  // =========================
  // DRAGGING SYSTEM
  // =========================
  function makeDraggable(handle, isStart) {
    handle.style.position = "absolute";

    const startDrag = (clientX) => {
      const rect = timelineWrap.getBoundingClientRect();
      const initialLeft = parseFloat(handle.style.left) || 0;
      const offset = clientX - (rect.left + initialLeft);

      const onMove = (clientXMove) => {
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

  // =========================
  // THUMBNAILS
  // =========================
  function captureFrameAt(videoEl, time, width = 60, height = 40) {
    return new Promise(resolve => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      videoEl.currentTime = time;
      videoEl.addEventListener("seeked", () => {
        ctx.drawImage(videoEl, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg"));
      }, { once: true });
    });
  }

  async function renderThumbnails() {
    if (!thumbStrip) return;

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

  // =========================
  // AUTO-SCROLL
  // =========================
  function autoScrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "smooth" });
  }

  // =========================
  // FILE UPLOAD
  // =========================
  async function uploadFile(file) {
    if (!file) return;

    try {
      setStatus("Uploading...");
      const fd = new FormData();
      fd.append("video", file);

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: fd
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");

      lastUploadedFilename = data.filename;
      setStatus("Upload complete");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  }

  // When user selects local file
  if (fileInput) {
    fileInput.addEventListener("change", e => {
      const f = e.target.files[0];
      if (!f) return;

      currentFileObject = f;
      preview.src = URL.createObjectURL(f);
      preview.load();

      preview.addEventListener("loadedmetadata", () => autoScrollTo("preview"), { once: true });

      uploadFile(f);
    });

    // Preview click opens file picker
    preview.style.cursor = "pointer";
    preview.addEventListener("click", () => fileInput.click());
  }

  // =========================
  // LOAD VIDEO FROM URL
  // =========================
  if (loadUrlBtn) {
    loadUrlBtn.addEventListener("click", async () => {
      const url = urlInput.value.trim();
      if (!url) return alert("Paste a video URL");

      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], "remote.mp4", { type: blob.type || "video/mp4" });

        currentFileObject = file;
        preview.src = URL.createObjectURL(file);
        preview.load();

        preview.addEventListener("loadedmetadata", () => autoScrollTo("preview"), { once: true });

        uploadFile(file);
      } catch {
        preview.src = url;
        currentFileObject = null;
        alert("CORS may block server trimming for remote URL");
      }
    });
  }

  // =========================
  // TRIM VIDEO
  // =========================
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
      trimmedVideo.src = lastTrimmedUrl;
      trimmedVideo.currentTime = 0;
      trimmedVideo.play().catch(() => {});
    } catch (err) {
      alert("Trim failed: " + err.message);
    }
  });

  // =========================
  // RESET RANGE
  // =========================
  resetBtn.addEventListener("click", () => {
    startTime = 0;
    endTime = videoDuration;
    syncHandlesToTimes();
    renderThumbnails();
  });

  // =========================
  // DOWNLOAD TRIMMED
  // =========================
  downloadTrimBtn.addEventListener("click", async () => {
    if (!lastTrimmedUrl) return alert("Trim the video first.");

    const r = await fetch(lastTrimmedUrl);
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trimmed_video.mp4";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // =========================
  // WHEN VIDEO METADATA LOADS
  // =========================
  preview.addEventListener("loadedmetadata", () => {
    videoDuration = preview.duration;
    startTime = 0;
    endTime = videoDuration;

    syncHandlesToTimes();
    renderThumbnails();
  });

});


