document.addEventListener("DOMContentLoaded", () => {
  const API = "https://video-trimmer-backend.onrender.com";

  // --- Elements (match your HTML exactly)
  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const timelineWrap = document.getElementById("timelineWrap");
  const thumbStrip = document.getElementById("thumbStrip");
  const startHandle = document.getElementById("startHandle");
  const endHandle = document.getElementById("endHandle");
  const startBubble = document.getElementById("startBubble");
  const endBubble = document.getElementById("endBubble");

  // Upload / controls
  const urlInput = document.querySelector('input#loadBtn'); // text input
  const loadUrlBtn = document.querySelector('button#loadVideoBtn'); // user changed button id to loadVideoBtn
  const fileInput = document.getElementById("openFile");
  const trimBtn = document.getElementById("trimBtn");
  const resetBtn = document.getElementById("resetBtn");
  const downloadTrimBtn = document.getElementById("downloadTrimBtn");

  // Safety check - required UI
  if (!preview || !trimmedVideo || !timelineWrap || !thumbStrip || !startHandle || !endHandle) {
    console.warn("searchbox.js: required element missing. Make sure preview, trimmedvideo, timelineWrap, thumbStrip, startHandle and endHandle exist.");
    return;
  }

  // --- State
  let videoDuration = 0;
  let startTime = 0;
  let endTime = 0;
  let currentFileObject = null; // File or Blob used for trimming/upload
  let lastTrimmedUrl = null;
  let thumbnailsCanvas = null;
  let thumbnailsCtx = null;

  const setStatus = msg => console.log("[trimmer] " + (msg || ""));

  // --- Overlay masks & selection
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
  selectionOverlay.style.border = "4px solid rgba(0,123,255,0.95)";
  selectionOverlay.style.borderRadius = "10px";

  if (getComputedStyle(timelineWrap).position === "static") timelineWrap.style.position = "relative";
  timelineWrap.append(leftMask, rightMask, selectionOverlay);

  // --- Helpers
  const fmt = sec => {
    if (!isFinite(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Update bubbles (time text and small position)
  function updateBubbles() {
    if (startBubble) startBubble.textContent = fmt(startTime);
    if (endBubble) endBubble.textContent = fmt(endTime);

    if (startBubble && startHandle) {
      const leftPx = parseFloat(startHandle.style.left) || 0;
      startBubble.style.left = Math.max(6, leftPx + 4) + "px";
    }
    if (endBubble && endHandle && timelineWrap) {
      const endPx = parseFloat(endHandle.style.left) || timelineWrap.clientWidth;
      // If bubble uses right in CSS, we'll set right; else set left
      if (getComputedStyle(endBubble).right !== "auto") {
        const wrapW = timelineWrap.clientWidth || 0;
        const fromRight = Math.max(6, wrapW - endPx + 4);
        endBubble.style.right = fromRight + "px";
      } else {
        endBubble.style.left = Math.max(6, endPx - 40) + "px";
      }
    }
  }

  function updateMasks() {
    if (!timelineWrap) return;
    const rect = timelineWrap.getBoundingClientRect();
    const width = rect.width || 0;
    const startPx = clamp(parseFloat(startHandle.style.left) || 0, 0, width);
    const endPx = clamp(parseFloat(endHandle.style.left) || width, 0, width);

    leftMask.style.left = "0px";
    leftMask.style.width = `${startPx}px`;

    rightMask.style.left = `${endPx}px`;
    rightMask.style.width = `${Math.max(0, width - endPx)}px`;

    const selW = Math.max(0, endPx - startPx);
    selectionOverlay.style.left = `${startPx}px`;
    selectionOverlay.style.width = `${selW}px`;
    selectionOverlay.style.opacity = selW < 8 ? "0" : "1";
  }

  // Draggable handles (mouse + basic touch support)
  function makeDraggable(handle, isStart) {
    handle.style.position = "absolute";

    const startDrag = (clientX) => {
      const rect = timelineWrap.getBoundingClientRect();
      const startLeft = parseFloat(handle.style.left) || 0;
      const offset = clientX - (rect.left + startLeft);

      const onMove = (clientXMove) => {
        const r = timelineWrap.getBoundingClientRect();
        let x = clientXMove - r.left - offset;
        x = clamp(x, 0, r.width);
        if (isStart) {
          const endX = parseFloat(endHandle.style.left) || r.width;
          x = Math.min(x, endX);
          handle.style.left = `${x}px`;
          startTime = (x / r.width) * videoDuration;
        } else {
          const startX = parseFloat(startHandle.style.left) || 0;
          x = Math.max(x, startX);
          handle.style.left = `${x}px`;
          endTime = (x / r.width) * videoDuration;
        }
        updateMasks();
        updateBubbles();
      };

      const onMouseMove = ev => onMove(ev.clientX);
      const onTouchMove = ev => {
        if (ev.touches && ev.touches[0]) onMove(ev.touches[0].clientX);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onTouchMove, { passive: true });
      document.addEventListener("touchend", onUp);
    };

    handle.addEventListener("mousedown", e => {
      e.preventDefault();
      startDrag(e.clientX);
    });
    handle.addEventListener("touchstart", e => {
      if (e.touches && e.touches[0]) startDrag(e.touches[0].clientX);
    }, { passive: true });
  }

  makeDraggable(startHandle, true);
  makeDraggable(endHandle, false);

  // Sync handle positions from times (use when metadata loaded or resize)
  function syncHandlesToTimes() {
    if (!timelineWrap) return;
    const w = timelineWrap.clientWidth || 0;
    const sLeft = isFinite(startTime) && videoDuration > 0 ? (startTime / videoDuration) * w : 0;
    const eLeft = isFinite(endTime) && videoDuration > 0 ? (endTime / videoDuration) * w : w;
    startHandle.style.left = `${sLeft}px`;
    endHandle.style.left = `${Math.max(0, eLeft - 0)}px`;
    updateMasks();
    updateBubbles();
  }

  // --- File & URL loading logic

  // clicking preview opens file chooser if present
  if (fileInput && preview) {
    preview.style.cursor = "pointer";
    preview.addEventListener("click", () => fileInput.click());
  }

  // file chooser handler
  if (fileInput) {
    fileInput.addEventListener("change", e => {
      const f = e.target.files && e.target.files[0];
      if (f) handleLocalFile(f);
    });
  }

  // handle local file: set preview + state
  function handleLocalFile(file) {
    currentFileObject = file;
    preview.src = URL.createObjectURL(file);
    preview.load();
    // preview "loadedmetadata" handler will set duration & sync handles
  }

  // load from URL input (button)
  if (loadUrlBtn && urlInput) {
    loadUrlBtn.addEventListener("click", async () => {
      const url = (urlInput.value || "").trim();
      if (!url) return alert("Paste an MP4/WebM URL in the input above and click Load Video.");
      // try fetch blob (may fail with CORS). If fetch works, set currentFileObject as blob file.
      try {
        setStatus("Fetching remote video (may fail due to CORS)...");
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`Failed to fetch remote video (${res.status})`);
        const blob = await res.blob();
        // create File (so FormData has a name)
        const file = new File([blob], "remote_video.mp4", { type: blob.type || "video/mp4" });
        currentFileObject = file;
        preview.src = URL.createObjectURL(file);
        preview.load();
        setStatus("Loaded remote video (fetched).");
      } catch (err) {
        // fallback: use URL directly in preview (trim on server may fail if server cannot fetch the URL)
        preview.src = url;
        preview.load();
        currentFileObject = null; // remote URL but not a fetched file
        setStatus("Loaded remote URL directly (server-side trimming may require upload due to CORS).");
      }
    });
  }

  // --- Thumbnail generation
  async function generateThumbnails(src) {
    if (!thumbStrip || !timelineWrap || !src) return;
    thumbStrip.innerHTML = "";
    const width = Math.max(400, timelineWrap.clientWidth || 600);
    const height = 64;
    thumbnailsCanvas = document.createElement("canvas");
    thumbnailsCanvas.width = width;
    thumbnailsCanvas.height = height;
    thumbnailsCanvas.style.width = "100%";
    thumbnailsCanvas.style.height = `${height}px`;
    thumbnailsCtx = thumbnailsCanvas.getContext("2d");
    thumbStrip.appendChild(thumbnailsCanvas);

    const tempV = document.createElement("video");
    tempV.muted = true;
    tempV.src = src;

    try {
      await new Promise(r => tempV.addEventListener("loadedmetadata", r));
    } catch (e) {
      return;
    }
    const num = Math.max(4, Math.floor(width / 80));
    const step = (tempV.duration || 1) / (num - 1 || 1);

    for (let i = 0; i < num; i++) {
      const t = Math.min(i * step, (tempV.duration || 0));
      try {
        await new Promise(r => {
          tempV.currentTime = t;
          tempV.addEventListener("seeked", r, { once: true });
        });
        const w = Math.floor(width / num);
        const x = i * w;
        thumbnailsCtx.drawImage(tempV, x, 0, w, height);
      } catch (err) {
        // ignore cross-origin draw errors
      }
    }
  }

  // --- Trim action (FormData with file,start,end) as requested (option A)
  if (trimBtn) {
    trimBtn.addEventListener("click", async () => {
      // compute start/end from handles
      const rect = timelineWrap.getBoundingClientRect();
      const w = rect.width || 1;
      const sPx = clamp(parseFloat(startHandle.style.left) || 0, 0, w);
      const ePx = clamp(parseFloat(endHandle.style.left) || w, 0, w);
      startTime = (sPx / w) * videoDuration;
      endTime = (ePx / w) * videoDuration;
      updateBubbles();
      if (startTime >= endTime) return alert("Start must be before end.");

      // Prepare file to send:
      // if we already have a File object (local file or fetched remote blob) use it.
      // If not, attempt to fetch preview.src as blob now.
      let fileToSend = currentFileObject;

      if (!fileToSend) {
        // try fetch preview.src to get a blob (may fail)
        try {
          setStatus("Fetching video for server trim (may fail due to CORS)...");
          const res = await fetch(preview.src, { method: "GET" });
          if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
          const blob = await res.blob();
          fileToSend = new File([blob], "video.mp4", { type: blob.type || "video/mp4" });
        } catch (err) {
          return alert("Trimming requires a local file or a fetchable URL (CORS prevents remote fetch). Please upload the file using the 'Open File' input.");
        }
      }

      // Create FormData and send to /trim
      try {
        setStatus("Sending trim request to server...");
        const fd = new FormData();
        fd.append("video", fileToSend);
        fd.append("start", String(startTime));
        fd.append("end", String(endTime));

        const res = await fetch(`${API}/trim`, { method: "POST", body: fd });
        // Heuristic: response could be JSON (with url) or binary (blob)
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          if (!data.success) {
            throw new Error(data.error || "Trim failed");
          }
          // data.url may be absolute or relative
          lastTrimmedUrl = data.url && data.url.startsWith("http") ? data.url : `${API}${data.url}`;
          trimmedVideo.src = lastTrimmedUrl;
          trimmedVideo.currentTime = 0;
          trimmedVideo.play().catch(() => {});
          setStatus("Server trimming complete");
        } else {
          // assume a video blob returned
          if (!res.ok) throw new Error(`Trim failed (${res.status})`);
          const blob = await res.blob();
          const u = URL.createObjectURL(blob);
          lastTrimmedUrl = u;
          trimmedVideo.src = u;
          trimmedVideo.currentTime = 0;
          trimmedVideo.play().catch(() => {});
          setStatus("Server returned trimmed blob");
        }
      } catch (err) {
        alert("Server trim failed: " + err.message);
        setStatus("Server trim failed: " + err.message);
      }
    });
  }

  // --- Reset
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      startTime = 0;
      endTime = videoDuration || 0;
      startHandle.style.left = "0px";
      endHandle.style.left = `${timelineWrap.clientWidth - 14}px`;
      updateMasks();
      updateBubbles();
    });
  }

  // --- Download trimmed
  if (downloadTrimBtn) {
    downloadTrimBtn.addEventListener("click", async () => {
      if (!lastTrimmedUrl) return alert("No trimmed file available to download.");
      try {
        // if lastTrimmedUrl is a blob URL or absolute URL
        const res = await fetch(lastTrimmedUrl);
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "trimmed_video.mp4";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("Download failed: " + err.message);
      }
    });
  }

  // Timeline click to seek preview
  timelineWrap.addEventListener("click", e => {
    const rect = timelineWrap.getBoundingClientRect();
    const pos = e.clientX - rect.left;
    const pct = pos / (rect.width || 1);
    preview.currentTime = pct * videoDuration;
  });

  // Keep masks updated on resize & RAF
  window.addEventListener("resize", syncHandlesToTimes);
  const rafLoop = () => {
    updateMasks();
    requestAnimationFrame(rafLoop);
  };
  requestAnimationFrame(rafLoop);

  // When preview metadata loads, set durations and initial positions and generate thumbnails
  preview.addEventListener("loadedmetadata", () => {
    videoDuration = preview.duration || 0;
    startTime = 0;
    endTime = videoDuration;
    startHandle.style.left = "0px";
    endHandle.style.left = `${timelineWrap.clientWidth - 14}px`;
    updateMasks();
    updateBubbles();
    generateThumbnails(preview.src);
  });

  // keep bubbles updated while video plays
  preview.addEventListener("timeupdate", () => {
    updateBubbles();
  });
});
