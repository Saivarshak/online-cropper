function loadVideo() {
  const url = document.getElementById("videoUrl").value;
  const video = document.getElementById("originalVideo");

  if (!url) return alert("Enter video URL");

  video.src = url;
  document.getElementById("previewBox").style.display = "block";

  // Scroll to preview section
  document.getElementById("previewBox").scrollIntoView({ behavior: "smooth" });
}

function trimVideo() {
  const video = document.getElementById("originalVideo");
  const start = parseInt(document.getElementById("startTime").value);
  const end = parseInt(document.getElementById("endTime").value);

  if (end <= start) {
    alert("End time must be greater than start time");
    return;
  }

  const stream = video.captureStream();
  const recorder = new MediaRecorder(stream);
  let chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/mp4" });
    const url = URL.createObjectURL(blob);

    document.getElementById("trimmedVideo").src = url;
    document.getElementById("downloadLink").href = url;

    document.getElementById("trimBox").style.display = "block";
    document.getElementById("trimBox").scrollIntoView({ behavior: "smooth" });
  };

  video.currentTime = start;

  video.onseeked = () => {
    recorder.start();
    video.play();

    setTimeout(() => {
      recorder.stop();
      video.pause();
    }, (end - start) * 1000);
  };
}

function trimSelectedVideo() {
  const file = document.getElementById("videoupload").files[0];
  if (!file) return alert("Upload a video");

  const url = URL.createObjectURL(file);
  const video = document.getElementById("originalVideo");

  video.src = url;

  document.getElementById("previewBox").style.display = "block";
  document.getElementById("previewBox").scrollIntoView({ behavior: "smooth" });
}

(function(){
  // Elements
  const comboInput = document.getElementById('comboInput');
  const fileInput = document.getElementById('fileInput');
  const openFile = document.getElementById('openFile');
  const loadBtn = document.getElementById('loadBtn');
  const preview = document.getElementById('preview');
  const thumbStrip = document.getElementById('thumbStrip');
  const startHandle = document.getElementById('startHandle');
  const endHandle = document.getElementById('endHandle');
  const startBubble = document.getElementById('startBubble');
  const endBubble = document.getElementById('endBubble');
  const trimBtn = document.getElementById('trimBtn');
  const resetBtn = document.getElementById('resetBtn');
  const status = document.getElementById('status');
  const timelineWrap = document.getElementById('timelineWrap');

  let videoDuration = 0;
  let dragging = null; // "start" | "end" | null
  let startPercent = 0;
  let endPercent = 1;
  let generatedThumbnails = false;
  let currentFileUrl = null;

  // Helpers
  function formatTime(t){
    if (!isFinite(t)) return '00:00';
    t = Math.max(0, Math.floor(t));
    const m = Math.floor(t/60);
    const s = t % 60;
    return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }

  function setStatus(text){
    status.textContent = text;
  }

  // Combined input handlers
  openFile.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    comboInput.value = f.name;
    loadVideoFromFile(f);
  });

  loadBtn.addEventListener('click', ()=>{
    const val = comboInput.value.trim();
    if (!val){
      setStatus('Paste a URL or upload a file first.');
      return;
    }
    // If input looks like a URL -> try to load
    if (/^https?:\/\//i.test(val)){
      loadVideoFromUrl(val);
    } else {
      setStatus('If you pasted text that is not a URL, upload a local file instead.');
    }
  });

  // Loaders
  function revokeOld(){
    if (currentFileUrl){ URL.revokeObjectURL(currentFileUrl); currentFileUrl = null; }
  }

  function loadVideoFromFile(file){
    revokeOld();
    const url = URL.createObjectURL(file);
    currentFileUrl = url;
    preparePreview(url);
  }

  function loadVideoFromUrl(url){
    revokeOld();
    // set src to url directly -- CORS may block thumbnail extraction later
    preparePreview(url);
  }

  function preparePreview(src){
    generatedThumbnails = false;
    thumbStrip.innerHTML = '';
    preview.src = '';
    preview.pause();
    preview.removeAttribute('src');
    preview.src = src;
    preview.load();
    setStatus('Loading video metadata...');
    preview.onloadedmetadata = () => {
      videoDuration = preview.duration || 0;
      setStatus('Video loaded: ' + formatTime(videoDuration));
      // set end bubble to duration
      endBubble.textContent = formatTime(videoDuration);
      startBubble.textContent = '00:00';
      startPercent = 0; endPercent = 1;
      positionHandles();
      // attempt thumbnails
      generateThumbnails().catch(err=>{
        console.warn('thumb error',err);
        setStatus('Video loaded but thumbnails blocked by CORS or not supported.');
      });
    };
    preview.onerror = (e) => {
      setStatus('Failed to load video. Check URL or file.');
    };
  }

  // Thumbnail generation using offscreen canvas and setting currentTime for frames
  async function generateThumbnails(){
    // Quick guard
    if (!preview || !preview.duration || preview.readyState < 1) {
      // wait a bit
      await new Promise(r => setTimeout(r,300));
    }
    const steps = 12; // number of thumbs
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = 160, h = 90;
    canvas.width = w; canvas.height = h;

    // try capturing frames: some remote sources will block
    for (let i = 0; i < steps; i++){
      const t = Math.min(preview.duration, (i/ (steps-1)) * preview.duration);
      try{
        await seekVideo(thisOr(preview), t);
        ctx.drawImage(preview, 0, 0, w, h);
        const img = document.createElement('img');
        img.className = 'thumb';
        img.src = canvas.toDataURL('image/jpeg',0.6);
        thumbStrip.appendChild(img);
      } catch(err){
        // fallback: show poster-style blank
        const ph = document.createElement('div');
        ph.className = 'thumb';
        ph.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))';
        thumbStrip.appendChild(ph);
      }
    }
    generatedThumbnails = true;
  }

  // helper to ensure video is seeked to requested time, resolve on seeked event
  function seekVideo(v, time){
    return new Promise((resolve, reject)=>{
      function onseek(){
        v.removeEventListener('seeked', onseek);
        resolve();
      }
      v.addEventListener('seeked', onseek);
      // set a timeout to avoid hanging if seek never happens
      const to = setTimeout(()=> {
        v.removeEventListener('seeked', onseek);
        reject(new Error('seek timeout'));
      }, 3000);
      // try to set time
      try { v.currentTime = Math.min(Math.max(0, time), v.duration || time); }
      catch(e){ clearTimeout(to); v.removeEventListener('seeked', onseek); reject(e); }
    });
  }

  // Drag logic for handles (mouse + touch)
  function positionHandles(){
    const wrapRect = timelineWrap.getBoundingClientRect();
    const totalW = wrapRect.width;
    startHandle.style.left = (startPercent * totalW - startHandle.offsetWidth/2) + 'px';
    endHandle.style.left = (endPercent * totalW - endHandle.offsetWidth/2) + 'px';
    startBubble.textContent = formatTime(startPercent * videoDuration);
    endBubble.textContent = formatTime(endPercent * videoDuration);
  }

  function clientXToPercent(clientX){
    const rect = timelineWrap.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    return x / rect.width;
  }

  function startDrag(which, e){
    dragging = which;
    document.body.style.userSelect = 'none';
    if (e.type === 'touchstart') e = e.touches[0];
    // one move handler
    function onMove(ev){
      if (!dragging) return;
      if (ev.type === 'touchmove') ev = ev.touches[0];
      const p = clientXToPercent(ev.clientX);
      if (dragging === 'start'){
        startPercent = Math.min(p, endPercent - 0.01);
      } else {
        endPercent = Math.max(p, startPercent + 0.01);
      }
      positionHandles();
    }
    function onUp(){
      dragging = null;
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove,{passive:false});
    window.addEventListener('touchend', onUp);
  }

  startHandle.addEventListener('mousedown', e => startDrag('start', e));
  endHandle.addEventListener('mousedown', e => startDrag('end', e));
  startHandle.addEventListener('touchstart', e => startDrag('start', e));
  endHandle.addEventListener('touchstart', e => startDrag('end', e));

  // Clicking on timeline moves nearest handle
  timelineWrap.addEventListener('click', (ev)=>{
    const p = clientXToPercent(ev.clientX);
    // choose which handle is closer
    if (Math.abs(p - startPercent) < Math.abs(p - endPercent)){
      startPercent = Math.min(p, endPercent - 0.01);
    } else {
      endPercent = Math.max(p, startPercent + 0.01);
    }
    positionHandles();
  });

  // Trim logic using captureStream + MediaRecorder
  trimBtn.addEventListener('click', async ()=>{
    if (!preview.src) { setStatus('Load a video first.'); return; }
    if (!videoDuration || !isFinite(videoDuration)) { setStatus('Video not ready.'); return; }
    const s = startPercent * videoDuration;
    const e = endPercent * videoDuration;
    if (e - s < 0.2){ setStatus('Segment too short (min 0.2s).'); return; }

    setStatus('Preparing to trim...');

    // try to get a stream of the video playback
    let stream;
    try {
      stream = preview.captureStream ? preview.captureStream() : preview.mozCaptureStream ? preview.mozCaptureStream() : null;
    } catch(err){}
    if (!stream){
      setStatus('Browser does not support captureStream() for trimming.');
      return;
    }

    // Prepare recorder
    let options = {mimeType: ''};
    // choose a supported mimeType
    const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    for (const c of candidates){
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)){
        options.mimeType = c; break;
      }
    }
    setStatus('Recording segment ('+formatTime(s)+' → '+formatTime(e)+')...');
    const recorder = new MediaRecorder(stream, options.mimeType ? {mimeType: options.mimeType} : undefined);
    const chunks = [];
    recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, {type: recorder.mimeType || 'video/webm'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trimmed_video.' + (recorder.mimeType && recorder.mimeType.includes('mp4') ? 'mp4' : 'webm');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus('Trim complete. Download started.');
      // cleanup
      setTimeout(()=> URL.revokeObjectURL(url), 60000);
    };

    // Seek video to start, play, and record for duration
    try {
      await seekVideo(preview, s);
      // small delay to ensure frames ready
      await new Promise(r=>setTimeout(r,150));
      recorder.start();
      // play the video (muted to avoid audio autoplay block)
      const mutedBefore = preview.muted;
      preview.muted = true;
      await preview.play();
      // schedule stop
      const stopAt = e;
      const onTimeUpdate = () => {
        if (preview.currentTime >= stopAt - 0.03){
          preview.pause();
          preview.muted = mutedBefore;
          recorder.stop();
          preview.removeEventListener('timeupdate', onTimeUpdate);
        }
      };
      preview.addEventListener('timeupdate', onTimeUpdate);
      // fallback timeout
      setTimeout(()=> {
        if (recorder.state === 'recording') { preview.pause(); recorder.stop(); }
      }, Math.max(3000, (e - s + 1) * 1000));
    } catch(err){
      console.error(err);
      setStatus('Trimming failed. Possibly blocked by CORS or browser limitations.');
    }
  });

  resetBtn.addEventListener('click', ()=>{
    comboInput.value = '';
    fileInput.value = '';
    preview.pause();
    preview.removeAttribute('src');
    preview.load();
    thumbStrip.innerHTML = '';
    startPercent = 0; endPercent = 1;
    setStatus('Reset');
    revokeOld();
    positionHandles();
  });

  // initial position update on resize
  window.addEventListener('resize', positionHandles);

  // small helper used by generateThumbnails (to keep call stable)
  function thisOr(v){ return v; }

  // position handles when video element ready size
  preview.addEventListener('loadeddata', positionHandles);
})();