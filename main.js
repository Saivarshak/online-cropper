document.addEventListener("DOMContentLoaded", () => {
  const API = "https://www.videotrimmer.online/";

  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const uploadInput = document.getElementById("UploadInput");
  const startRange = document.getElementById("startRange");
  const endRange = document.getElementById("endRange");
  const trimBtn = document.getElementById("trimBtn");
  const resetBtn = document.getElementById("resetBtn");
  const thumbStrip = document.getElementById("thumbStrip");
  const loading = document.getElementById("loading");
  const startBubble = document.getElementById("startBubble");
  const endBubble = document.getElementById("endBubble");

  let selectedFile = null;
  let previewURL = null;
  let thumbVideo = null;

  // ===============================
  // File selection + preview
  // ===============================
  uploadInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    console.log(file.name);

    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(file);

    preview.src = previewURL;
    trimmedVideo.style.display = "none";
    trimmedVideo.src = "";
    thumbStrip.innerHTML = "";

    preview.onloadedmetadata = () => {
      startRange.max = preview.duration;
      endRange.max = preview.duration;
      startRange.value = 0;
      endRange.value = preview.duration;

      updateBubbles();
      generateThumbs(preview);
    };
  });

  // ===============================
  // Update time bubbles
  // ===============================
  function updateBubbles() {
    const formatTime = t => {
      const min = Math.floor(t / 60);
      const sec = Math.floor(t % 60);
      return `${min.toString().padStart(2, "0")}:${sec
        .toString()
        .padStart(2, "0")}`;
    };

    startBubble.textContent = formatTime(startRange.value);
    endBubble.textContent = formatTime(endRange.value);
  }

  startRange.addEventListener("input", updateBubbles);
  endRange.addEventListener("input", updateBubbles);

  // ===============================
  // Thumbnail generation
  // ===============================
  function generateThumbs(videoSource) {
    if (thumbVideo) {
      thumbVideo.src = "";
      thumbVideo.remove();
    }

    thumbVideo = document.createElement("video");
    thumbVideo.src = videoSource.src;
    thumbVideo.muted = true;

    thumbVideo.onloadedmetadata = () => {
      const duration = thumbVideo.duration;
      const count = 6;
      const interval = duration / count;
      let index = 0;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const capture = () => {
        if (index > count) return;
        thumbVideo.currentTime = interval * index;
      };

      thumbVideo.onseeked = () => {
        canvas.width = 120;
        canvas.height = 70;
        ctx.drawImage(thumbVideo, 0, 0, canvas.width, canvas.height);

        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/jpeg", 0.6);
        img.className = "thumb";
        thumbStrip.appendChild(img);

        index++;
        requestAnimationFrame(capture);
      };

      capture();
    };
  }

  // ===============================
  // Upload + Trim video
  // ===============================
  trimBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      alert("Upload a video first");
      return;
    }

    const start = Number(startRange.value);
    const end = Number(endRange.value);

    if (start >= end) {
      alert("Start time must be less than end time");
      return;
    }

    try {
      loading.style.display = "block";
      trimBtn.disabled = true;

      // Upload
      const uploadData = new FormData();
      uploadData.append("video", selectedFile);

      const uploadRes = await fetch(`${API}/upload`, {
        method: "POST",
        body: uploadData
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const uploadJson = await uploadRes.json();
      const filename = uploadJson.filename;

      // Trim
      const trimRes = await fetch(`${API}/trim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, start, end })
      });

      if (!trimRes.ok) throw new Error("Trim failed");

      const trimJson = await trimRes.json();

      // Play trimmed video
      trimmedVideo.src = API + trimJson.url;
      trimmedVideo.controls = true;
      trimmedVideo.style.display = "block";

      trimmedVideo.onerror = () => {
        alert("Trimmed video not available. Try again.");
        trimmedVideo.style.display = "none";
      };

      await trimmedVideo.play().catch(() => {});
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      loading.style.display = "none";
      trimBtn.disabled = false;
    }
  });

  // ===============================
  // Reset
  // ===============================
  resetBtn.addEventListener("click", () => {
    selectedFile = null;
    preview.src = "";
    trimmedVideo.src = "";
    trimmedVideo.style.display = "none";
    thumbStrip.innerHTML = "";
    startRange.value = 0;
    endRange.value = 0;
    updateBubbles();
  });
});
