import { createFFmpeg, fetchFile } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.3/dist/ffmpeg.min.js';

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  console.log("FFmpeg loaded!");


document.addEventListener("DOMContentLoaded", () => {
  const API = "https://video-trimmer-backend.onrender.com";

  // =========================
  // ELEMENT REFERENCES
  // =========================
  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const fileInput = document.getElementById("upload");
  const startRange = document.getElementById("startRange");
  const endRange = document.getElementById("endRange");
  const trimBtn = document.getElementById("trimBtn");
  const timelineWrap = document.getElementById("timelineWrap");
  const thumbStrip = document.getElementById("thumbStrip");

  let selectedFile = null;

  // =========================
  // LOAD VIDEO PREVIEW
  // =========================
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;

    const url = URL.createObjectURL(file);
    preview.src = url;

    preview.addEventListener("loadedmetadata", () => {
      startRange.max = preview.duration;
      endRange.max = preview.duration;
      endRange.value = preview.duration;

      generateThumbs(file);
    });
  });

  // =========================
  // GENERATE TIMELINE THUMBNAILS
  // =========================
  function generateThumbs(file) {
    thumbStrip.innerHTML = "";
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
        generate();
      });

      generate();
    });
  }

  // =========================
  // TRIM VIDEO
  // =========================
  trimBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      alert("Upload a video first");
      return;
    }

    const start = parseFloat(startRange.value);
    const end = parseFloat(endRange.value);

    if (start >= end) {
      alert("Start time must be less than end time");
      return;
    }

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("start", start);
    formData.append("end", end);

    try {
      const res = await fetch(`${API}/trim`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        alert("Trimming failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      trimmedVideo.src = url;
      trimmedVideo.load();
      trimmedVideo.style.display = "block";

    } catch (err) {
      console.error(err);
      alert("Error occurred while trimming");
    }
  });
});

})();