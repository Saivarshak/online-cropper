document.addEventListener("DOMContentLoaded", () => {
  const API = "https://video-trimmer-backend.onrender.com";

  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const fileInput = document.getElementById("fileInput");
  const startRange = document.getElementById("startRange");
  const endRange = document.getElementById("endRange");
  const trimBtn = document.getElementById("trimBtn");
  const thumbStrip = document.getElementById("thumbStrip");
  const loading = document.getElementById("loading");

  let selectedFile = null;
  let previewURL = null;
  let thumbVideo = null;

  // ===============================
  // File selection + preview
  // ===============================
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;

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

      generateThumbs(preview);
    };
  });

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
  // Upload + Trim (FIXED FLOW)
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

      // STEP 1: Upload video
      const uploadData = new FormData();
      uploadData.append("video", selectedFile);

      const uploadRes = await fetch(`${API}/upload`, {
        method: "POST",
        body: uploadData
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const uploadJson = await uploadRes.json();
      const filename = uploadJson.filename;

      // STEP 2: Trim video
      const trimRes = await fetch(`${API}/trim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename,
          start,
          end
        })
      });

      if (!trimRes.ok) throw new Error("Trim failed");

      const trimJson = await trimRes.json();

      // STEP 3: Play trimmed video
      trimmedVideo.src = API + trimJson.url;
      trimmedVideo.controls = true;
      trimmedVideo.style.display = "block";
      trimmedVideo.play().catch(() => {});
    } catch (err) {
      console.error(err);
      alert("Error occurred while trimming");
    } finally {
      loading.style.display = "none";
      trimBtn.disabled = false;
    }
  });
});
