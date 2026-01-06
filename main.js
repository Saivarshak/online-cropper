document.addEventListener("DOMContentLoaded", () => {
  // Backend API (Render)
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

  let selectedFile = null;
  let uploadedFilename = null;
  let previewURL = null;
  let thumbVideo = null;

  downloadBtn.disabled = true;

  /* ===============================
     Helpers
  ================================ */
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

  startRange.addEventListener("input", updateBubbles);
  endRange.addEventListener("input", updateBubbles);

  function scrollToPreview() {
    preview.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ===============================
     Thumbnail generation
  ================================ */
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

  /* ===============================
     Upload local video
  ================================ */
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
      generateThumbs(preview);
      scrollToPreview();
    };
  });

  /* ===============================
     Load video from URL
  ================================ */
  loadUrlBtn.addEventListener("click", async () => {
    const url = videoUrlInput.value.trim();
    if (!url) return alert("Paste a video URL");

    try {
      loading.style.display = "block";

      const res = await fetch(`${API}/download-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!res.ok) throw new Error("URL load failed");

      const data = await res.json();
      uploadedFilename = data.filename;

      preview.src = API + data.url;
      preview.load();

      preview.onloadedmetadata = () => {
        startRange.max = preview.duration;
        endRange.max = preview.duration;
        startRange.value = 0;
        endRange.value = preview.duration;
        updateBubbles();
        generateThumbs(preview);
        scrollToPreview();
      };
    } catch (err) {
      alert(err.message);
    } finally {
      loading.style.display = "none";
    }
  });

  /* ===============================
     Trim video
  ================================ */
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

        const uploadRes = await fetch(`${API}/upload`, {
          method: "POST",
          body: fd
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const uploadData = await uploadRes.json();
        uploadedFilename = uploadData.filename;
      }

      const trimRes = await fetch(`${API}/trim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: uploadedFilename, start, end })
      });

      if (!trimRes.ok) throw new Error("Trim failed");

      const trimData = await trimRes.json();

      trimmedVideo.src = API + trimData.url;
      trimmedVideo.style.display = "block";
      trimmedVideo.controls = true;

      trimmedVideo.onloadeddata = () => {
        trimmedVideo.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        downloadBtn.disabled = false;
      };
    } catch (err) {
      alert(err.message);
    } finally {
      loading.style.display = "none";
      trimBtn.disabled = false;
    }
  });

  /* ===============================
     Download trimmed video
  ================================ */
  downloadBtn.addEventListener("click", () => {
    if (!trimmedVideo.src) return;

    const a = document.createElement("a");
    a.href = trimmedVideo.src;
    a.download = "trimmed-video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  /* ===============================
     Reset
  ================================ */
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
  });
});
