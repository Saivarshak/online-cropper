document.addEventListener("DOMContentLoaded", () => {
  const API = "https://video-trimmer-backend.onrender.com";
  

  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const uploadInput = document.getElementById("UploadInput");
  const videoUrlInput = document.getElementById("videoUrlInput");

  const startRange = document.getElementById("startRange");
  const endRange = document.getElementById("endRange");
  const startBubble = document.getElementById("startBubble");
  const endBubble = document.getElementById("endBubble");

  const trimBtn = document.getElementById("trimBtn");
  const resetBtn = document.getElementById("resetBtn");
  const loadUrlBtn = document.getElementById("loadUrlBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  const thumbStrip = document.getElementById("thumbStrip");
  const loading = document.getElementById("loading");

  const timelineWrap = document.getElementById("timelineWrap");
  const startHandle = document.querySelector(".start-handle");
  const endHandle = document.querySelector(".end-handle");

  let selectedFile = null;
  let uploadedFilename = null;
  let previewURL = null;
  let thumbVideo = null;
  let activeHandle = null;

  downloadBtn.disabled = true;

  // ======================
  // Time helpers
  // ======================
  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }

  function updateBubbles() {
    startBubble.textContent = formatTime(startRange.value);
    endBubble.textContent = formatTime(endRange.value);
  }

  function valueToPercent(value) {
    return (value / startRange.max) * 100;
  }

  function percentToValue(percent) {
    return (percent / 100) * startRange.max;
  }

  function updateHandlesFromRanges() {
    startHandle.style.left = `${valueToPercent(startRange.value)}%`;
    endHandle.style.left = `${valueToPercent(endRange.value)}%`;
  }

  // ======================
  // Handle dragging
  // ======================
  startHandle.addEventListener("mousedown", () => {
    activeHandle = "start";
  });

  endHandle.addEventListener("mousedown", () => {
    activeHandle = "end";
  });

  document.addEventListener("mousemove", e => {
    if (!activeHandle) return;

    const rect = timelineWrap.getBoundingClientRect();
    let percent = ((e.clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    const value = percentToValue(percent);

    if (activeHandle === "start" && value < endRange.value) {
      startRange.value = value;
    }

    if (activeHandle === "end" && value > startRange.value) {
      endRange.value = value;
    }

    updateBubbles();
    updateHandlesFromRanges();
  });

  document.addEventListener("mouseup", () => {
    activeHandle = null;
  });

  // ======================
  // Click-to-seek on timeline
  // ======================
  timelineWrap.addEventListener("click", e => {
    if (e.target.closest(".handle")) return;

    const rect = timelineWrap.getBoundingClientRect();
    let percent = ((e.clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    const value = percentToValue(percent);

    const distToStart = Math.abs(value - startRange.value);
    const distToEnd = Math.abs(value - endRange.value);

    if (distToStart < distToEnd && value < endRange.value) {
      startRange.value = value;
    } else if (value > startRange.value) {
      endRange.value = value;
    }

    updateBubbles();
    updateHandlesFromRanges();

    if (!isNaN(preview.duration)) {
      preview.currentTime = value;
    }
  });

  startRange.addEventListener("input", () => {
    updateBubbles();
    updateHandlesFromRanges();
  });

  endRange.addEventListener("input", () => {
    updateBubbles();
    updateHandlesFromRanges();
  });

  // ======================
  // Thumbnails
  // ======================
  function generateThumbs(videoEl) {
    thumbStrip.innerHTML = "";
    if (thumbVideo) thumbVideo.remove();

    thumbVideo = document.createElement("video");
    thumbVideo.src = videoEl.src;
    thumbVideo.muted = true;

    thumbVideo.onloadedmetadata = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const count = 6;
      const interval = thumbVideo.duration / count;
      let i = 0;

      thumbVideo.onseeked = () => {
        canvas.width = 120;
        canvas.height = 70;
        ctx.drawImage(thumbVideo, 0, 0, canvas.width, canvas.height);

        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/jpeg", 0.6);
        img.className = "thumb";
        thumbStrip.appendChild(img);

        i++;
        if (i <= count) thumbVideo.currentTime = i * interval;
      };

      thumbVideo.currentTime = 0;
    };
  }

  // ======================
  // Upload file
  // ======================
  uploadInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    uploadedFilename = null;

    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(file);

    preview.src = previewURL;
    trimmedVideo.style.display = "none";
    downloadBtn.disabled = true;

    preview.onloadedmetadata = () => {
      startRange.max = preview.duration;
      endRange.max = preview.duration;
      startRange.value = 0;
      endRange.value = preview.duration;
      updateBubbles();
      updateHandlesFromRanges();
      generateThumbs(preview);
    };
  });
// ======================
// Load URL
// ======================
loadUrlBtn.addEventListener("click", async () => {
  const url = videoUrlInput.value.trim();
  if (!url) return alert("Paste a direct MP4 / WEBM URL");

  try {
    loading.style.display = "block";

    const res = await fetch(`${API}/download-url`, {  // <-- added single slash
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!res.ok) throw new Error("Failed to load video");

    const data = await res.json();
    uploadedFilename = data.filename;

    preview.src = `${API}${data.url.startsWith("/") ? "" : "/"}${data.url}`; // <-- fix double slash
    preview.load();

    preview.onloadedmetadata = () => {
      startRange.max = preview.duration;
      endRange.max = preview.duration;
      startRange.value = 0;
      endRange.value = preview.duration;
      updateBubbles();
      updateHandlesFromRanges();
      generateThumbs(preview);
    };
  } catch (err) {
    alert(err.message);
  } finally {
    loading.style.display = "none";
  }
});

// ======================
// Trim
// ======================
trimBtn.addEventListener("click", async () => {
  const start = Number(startRange.value);
  const end = Number(endRange.value);

  if (start >= end) return alert("Invalid trim range");

  try {
    loading.style.display = "block";
    trimBtn.disabled = true;
    downloadBtn.disabled = true;

    if (selectedFile && !uploadedFilename) {
      const fd = new FormData();
      fd.append("video", selectedFile);

      const uploadRes = await fetch(`${API}/upload`, {  // <-- added single slash
        method: "POST",
        body: fd
      });

      const uploadData = await uploadRes.json();
      uploadedFilename = uploadData.filename;
    }

    const trimRes = await fetch(`${API}/trim`, {  // <-- added single slash
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: uploadedFilename, start, end })
    });

    const trimData = await trimRes.json();

    trimmedVideo.src = `${API}${trimData.url.startsWith("/") ? "" : "/"}${trimData.url}`; // <-- fix double slash
    trimmedVideo.style.display = "block";
    trimmedVideo.controls = true;

    trimmedVideo.onloadeddata = () => {
      downloadBtn.disabled = false;
    };
  } catch (err) {
    alert(err.message);
  } finally {
    loading.style.display = "none";
    trimBtn.disabled = false;
  }
});

  // ======================
  // Download
  // ======================
  downloadBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = trimmedVideo.src;
    a.download = "trimmed-video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // ======================
  // Reset
  // ======================
  resetBtn.addEventListener("click", () => {
    selectedFile = null;
    uploadedFilename = null;
    preview.src = "";
    trimmedVideo.src = "";
    trimmedVideo.style.display = "none";
    downloadBtn.disabled = true;
    thumbStrip.innerHTML = "";
    startRange.value = 0;
    endRange.value = 0;
    updateBubbles();
    updateHandlesFromRanges();
  });
});

console.log("Frontend loaded");
