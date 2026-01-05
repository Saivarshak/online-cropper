document.addEventListener("DOMContentLoaded", () => {
  const API = "https://video-trimmer-backend.onrender.com";

  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const fileInput = document.getElementById("upload");
  const startRange = document.getElementById("startRange");
  const endRange = document.getElementById("endRange");
  const trimBtn = document.getElementById("trimBtn");
  const thumbStrip = document.getElementById("thumbStrip");
  const loading = document.getElementById("loading");

  let selectedFile = null;
  let previewURL = null;
  let thumbVideo = null;

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
      const count = 6; // reduced thumbnails
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

  trimBtn.addEventListener("click", async () => {
    if (!selectedFile) return alert("Upload a video first");

    const start = Number(startRange.value);
    const end = Number(endRange.value);

    if (start >= end) return alert("Start time must be less than end time");

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("startTime", start);
    formData.append("endTime", end);

    try {
      loading.style.display = "block";
      trimBtn.disabled = true;

      const res = await fetch(`${API}/trim`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Trim failed");

      const blob = await res.blob();
      const outputURL = URL.createObjectURL(blob);

      trimmedVideo.src = outputURL;
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
