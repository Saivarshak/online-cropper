            //////upload based video trimmer//////
// document.addEventListener("DOMContentLoaded", () => {
//   const API = "https://video-trimmer-backend.onrender.com";

//   const preview = document.getElementById("preview");
//   const trimmedVideo = document.getElementById("trimmedvideo");
//   const uploadInput = document.getElementById("UploadInput");
//   const videoUrlInput = document.getElementById("videoUrlInput");

//   const startRange = document.getElementById("startRange");
//   const endRange = document.getElementById("endRange");
//   const startBubble = document.getElementById("startBubble");
//   const endBubble = document.getElementById("endBubble");

//   const trimBtn = document.getElementById("trimBtn");
//   const resetBtn = document.getElementById("resetBtn");
//   const loadUrlBtn = document.getElementById("loadUrlBtn");
//   const downloadBtn = document.getElementById("downloadBtn");

//   const loading = document.getElementById("loading");
//   const timelineWrap = document.getElementById("timelineWrap");
//   const startHandle = document.querySelector(".start-handle");
//   const endHandle = document.querySelector(".end-handle");

//   let selectedFile = null;
//   let uploadedFilename = null;
//   let previewURL = null;
//   let activeHandle = null;

//   downloadBtn.disabled = true;

//   function showSpinner() {
//     loading.style.display = "flex";
//   }

//   function hideSpinner() {
//     loading.style.display = "none";
//   }

//   function formatTime(t) {
//     const m = Math.floor(t / 60);
//     const s = Math.floor(t % 60);
//     return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
//   }

//   function updateBubbles() {
//     startBubble.textContent = formatTime(startRange.value);
//     endBubble.textContent = formatTime(endRange.value);
//   }

//   function valueToPercent(v) {
//     return (v / startRange.max) * 100;
//   }

//   function percentToValue(p) {
//     return (p / 100) * startRange.max;
//   }

//   function updateHandles() {
//     startHandle.style.left = `${valueToPercent(startRange.value)}%`;
//     endHandle.style.left = `${valueToPercent(endRange.value)}%`;
//   }

//   startHandle.addEventListener("mousedown", () => activeHandle = "start");
//   endHandle.addEventListener("mousedown", () => activeHandle = "end");

//   document.addEventListener("mousemove", e => {
//     if (!activeHandle) return;

//     const rect = timelineWrap.getBoundingClientRect();
//     let percent = ((e.clientX - rect.left) / rect.width) * 100;
//     percent = Math.max(0, Math.min(100, percent));
//     const value = percentToValue(percent);

//     if (activeHandle === "start" && value < endRange.value) {
//       startRange.value = value;
//     }

//     if (activeHandle === "end" && value > startRange.value) {
//       endRange.value = value;
//     }

//     updateBubbles();
//     updateHandles();
//   });

//   document.addEventListener("mouseup", () => activeHandle = null);

//   // ------------ FILE UPLOAD ------------
//   uploadInput.addEventListener("change", e => {
//     const file = e.target.files[0];
//     if (!file) return;

//     selectedFile = file;
//     uploadedFilename = null;

//     const videoElement = document.getElementById("trimmedvideo");
//     videoElement.src = "";

//     if (previewURL) URL.revokeObjectURL(previewURL);
//     previewURL = URL.createObjectURL(file);

//     showSpinner();

//     preview.src = previewURL;
//     preview.style.display = "block";
//     preview.controls = true;

//     trimmedVideo.style.display = "none";
//     downloadBtn.disabled = true;

//     preview.onloadedmetadata = () => {
//       startRange.max = preview.duration;
//       endRange.max = preview.duration;
//       startRange.value = 0;
//       endRange.value = preview.duration;
//       updateBubbles();
//       updateHandles();
//       hideSpinner();
//     };
//   });

//   // ------------ URL LOAD ------------
//   loadUrlBtn.addEventListener("click", async () => {
//     const url = videoUrlInput.value.trim();
//     if (!url) return alert("Paste a video URL");

//     try {
//       showSpinner();

//       selectedFile = null;
//       uploadedFilename = null;

//       const res = await fetch(`${API}/download-url`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ url })
//       });

//       if (!res.ok) throw new Error("Failed to load video");

//       const data = await res.json();
//       uploadedFilename = data.filename;

//       const fileUrl = data.url.startsWith("/")
//         ? `${API}${data.url}`
//         : `${API}/${data.url}`;

//       preview.src = fileUrl;
//       preview.style.display = "block";
//       preview.controls = true;
//       preview.load();

//       trimmedVideo.style.display = "none";
//       downloadBtn.disabled = true;

//       preview.onloadedmetadata = () => {
//         startRange.max = preview.duration;
//         endRange.max = preview.duration;
//         startRange.value = 0;
//         endRange.value = preview.duration;
//         updateBubbles();
//         updateHandles();
//         hideSpinner();
//       };
//     } catch (err) {
//       alert(err.message);
//       hideSpinner();
//     }
//   });

//   // ------------ TRIM ------------
//   trimBtn.addEventListener("click", async () => {
//     const start = Number(startRange.value);
//     const end = Number(endRange.value);

//     if (start >= end) return alert("Invalid trim range");

//     try {
//       showSpinner();
//       trimBtn.disabled = true;
//       downloadBtn.disabled = true;

//       if (selectedFile && !uploadedFilename) {
//         const fd = new FormData();
//         fd.append("video", selectedFile);

//         const uploadRes = await fetch(`${API}/upload`, {
//           method: "POST",
//           body: fd
//         });

//         if (!uploadRes.ok) throw new Error("Upload failed");

//         const uploadData = await uploadRes.json();
//         uploadedFilename = uploadData.filename;
//       }

//       const trimRes = await fetch(`${API}/trim`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ filename: uploadedFilename, start, end })
//       });

//       if (!trimRes.ok) throw new Error("Trim failed");

//       const trimData = await trimRes.json();

//       const outUrl = trimData.url.startsWith("/")
//         ? `${API}${trimData.url}`
//         : `${API}/${trimData.url}`;

//       trimmedVideo.src = outUrl;
//       trimmedVideo.style.display = "block";
//       trimmedVideo.controls = true;

//       trimmedVideo.onloadeddata = async () => {
//         downloadBtn.disabled = false;

//         // auto download
//         try {
//           const res = await fetch(outUrl);
//           const blob = await res.blob();
//           const blobUrl = URL.createObjectURL(blob);

//           const a = document.createElement("a");
//           a.href = blobUrl;
//           a.download = "trimmed-video.mp4";
//           document.body.appendChild(a);
//           a.click();
//           document.body.removeChild(a);

//           URL.revokeObjectURL(blobUrl);
//         } catch {}

//         hideSpinner();
//       };
//     } catch (err) {
//       alert(err.message);
//       hideSpinner();
//     } finally {
//       trimBtn.disabled = false;
//     }
//   });

//   // ------------ DIRECT DOWNLOAD BUTTON ------------
//   downloadBtn.addEventListener("click", async () => {
//     try {
//       if (!trimmedVideo.src) return;

//       const res = await fetch(trimmedVideo.src);
//       const blob = await res.blob();
//       const blobUrl = URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = blobUrl;
//       a.download = "trimmed-video.mp4";
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);

//       URL.revokeObjectURL(blobUrl);
//     } catch {
//       alert("Download failed");
//     }
//   });

//   // ------------ RESET ------------
//   resetBtn.addEventListener("click", () => {
//     selectedFile = null;
//     uploadedFilename = null;

//     preview.src = "";
//     trimmedVideo.src = "";
//     trimmedVideo.style.display = "none";

//     downloadBtn.disabled = true;

//     startRange.value = 0;
//     endRange.value = 0;

//     updateBubbles();
//     updateHandles();
//   });
// });

// console.log("Server Started...");


            /// URL based video trimmer////

document.addEventListener("DOMContentLoaded", () => {
  const API = "https://video-trimmer-backend.onrender.com";

  const preview = document.getElementById("preview");
  const trimmedVideo = document.getElementById("trimmedvideo");
  const videoUrlInput = document.getElementById("videoUrlInput");

  const startRange = document.getElementById("startRange");
  const endRange = document.getElementById("endRange");
  const startBubble = document.getElementById("startBubble");
  const endBubble = document.getElementById("endBubble");

  const trimBtn = document.getElementById("trimBtn");
  const resetBtn = document.getElementById("resetBtn");
  const loadUrlBtn = document.getElementById("loadUrlBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  const loading = document.getElementById("loading");
  const timelineWrap = document.getElementById("timelineWrap");
  const startHandle = document.querySelector(".start-handle");
  const endHandle = document.querySelector(".end-handle");

  let uploadedFilename = null;
  let activeHandle = null;

  downloadBtn.disabled = true;

  function showSpinner() { loading.style.display = "flex"; }
  function hideSpinner() { loading.style.display = "none"; }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function updateBubbles() {
    startBubble.textContent = formatTime(startRange.value);
    endBubble.textContent = formatTime(endRange.value);
  }

  function valueToPercent(v) { return (v / startRange.max) * 100; }
  function percentToValue(p) { return (p / 100) * startRange.max; }

  function updateHandles() {
    startHandle.style.left = `${valueToPercent(startRange.value)}%`;
    endHandle.style.left = `${valueToPercent(endRange.value)}%`;
  }

  startHandle.addEventListener("mousedown", () => activeHandle = "start");
  endHandle.addEventListener("mousedown", () => activeHandle = "end");

  document.addEventListener("mousemove", e => {
    if (!activeHandle) return;

    const rect = timelineWrap.getBoundingClientRect();
    let percent = ((e.clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    const value = percentToValue(percent);

    if (activeHandle === "start" && value < endRange.value) startRange.value = value;
    if (activeHandle === "end" && value > startRange.value) endRange.value = value;

    updateBubbles();
    updateHandles();
  });

  document.addEventListener("mouseup", () => activeHandle = null);

  // ------------ URL LOAD ONLY ------------
  loadUrlBtn.addEventListener("click", async () => {
    const url = videoUrlInput.value.trim();
    if (!url) return alert("Paste a video URL");

    try {
      showSpinner();

      const res = await fetch(`${API}/download-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!res.ok) throw new Error("Failed to load video");

      const data = await res.json();
      uploadedFilename = data.filename;

      const fileUrl = data.url.startsWith("/")
        ? `${API}${data.url}`
        : `${API}/${data.url}`;

      preview.src = fileUrl;
      preview.style.display = "block";
      preview.controls = true;

      trimmedVideo.style.display = "none";
      downloadBtn.disabled = true;

      preview.onloadedmetadata = () => {
        startRange.max = preview.duration;
        endRange.max = preview.duration;
        startRange.value = 0;
        endRange.value = preview.duration;
        updateBubbles();
        updateHandles();
        hideSpinner();
      };
    } catch (err) {
      alert(err.message);
      hideSpinner();
    }
  });

  // ------------ TRIM ------------
  trimBtn.addEventListener("click", async () => {
    const start = Number(startRange.value);
    const end = Number(endRange.value);

    if (!uploadedFilename) return alert("Load a video URL first");
    if (start >= end) return alert("Invalid trim range");

    try {
      showSpinner();
      trimBtn.disabled = true;
      downloadBtn.disabled = true;

      const trimRes = await fetch(`${API}/trim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: uploadedFilename, start, end })
      });

      if (!trimRes.ok) throw new Error("Trim failed");

      const trimData = await trimRes.json();
      const outUrl = trimData.url.startsWith("/")
        ? `${API}${trimData.url}`
        : `${API}/${trimData.url}`;

      trimmedVideo.src = outUrl;
      trimmedVideo.style.display = "block";
      trimmedVideo.controls = true;

      trimmedVideo.onloadeddata = () => {
        downloadBtn.disabled = false;
        hideSpinner();
      };
    } catch (err) {
      alert(err.message);
      hideSpinner();
    } finally {
      trimBtn.disabled = false;
    }
  });

  // ------------ DOWNLOAD ------------
  downloadBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(trimmedVideo.src);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "trimmed-video.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);
    } catch {
      alert("Download failed");
    }
  });

  // ------------ RESET ------------
  resetBtn.addEventListener("click", () => {
    uploadedFilename = null;
    preview.src = "";
    trimmedVideo.src = "";
    trimmedVideo.style.display = "none";
    downloadBtn.disabled = true;
    startRange.value = 0;
    endRange.value = 0;
    updateBubbles();
    updateHandles();
  });
});

console.log("Server Started...");
