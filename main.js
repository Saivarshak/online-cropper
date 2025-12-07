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

  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    preview.src = URL.createObjectURL(file);
    trimmedVideo.style.display = "none";
    trimmedVideo.src = "";
    thumbStrip.innerHTML = "";

    preview.addEventListener("loadedmetadata", () => {
      startRange.max = preview.duration;
      endRange.max = preview.duration;
      endRange.value = preview.duration;

      generateThumbs(file);
    }, { once: true });
  });

  function generateThumbs(file) {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      const interval = duration / 8;
      let current = 0;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const generate = () => {
        if (current > duration) return;
        video.currentTime = current;
      };

      video.addEventListener("seeked", () => {
        canvas.width = 120;
        canvas.height = 70;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const img = document.createElement("img");
        img.src = canvas.toDataURL();
        img.className = "thumb";
        thumbStrip.appendChild(img);

        current += interval;
        setTimeout(generate, 0);
      });

      generate();
    });
  }

  trimBtn.addEventListener("click", async () => {
    if (!selectedFile) return alert("Upload a video first");

    const start = parseFloat(startRange.value);
    const end = parseFloat(endRange.value);

    if (start >= end) return alert("Start time must be less than end time");

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("start", start);
    formData.append("end", end);

    try {
      // Show loading indicator
      loading.style.display = "block";
      trimBtn.disabled = true;

      const res = await fetch(`${API}/trim`, { method: "POST", body: formData });
      if (!res.ok) {
        alert("Trimming failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      trimmedVideo.src = url;
      trimmedVideo.controls = true;
      trimmedVideo.load();
      trimmedVideo.style.display = "block";
      trimmedVideo.play().catch(() => {});

    } catch (err) {
      console.error(err);
      alert("Error occurred while trimming");
    } finally {
      // Hide loading indicator
      loading.style.display = "none";
      trimBtn.disabled = false;
    }
  });
});
