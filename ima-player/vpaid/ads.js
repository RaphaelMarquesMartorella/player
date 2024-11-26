const vastTagUrl = 'https://metrike-vast4-response.vercel.app/vast.xml'; // VAST URL
const adContainer = document.getElementById('ad-container'); // Ad container element
const videoElement = document.getElementById('ad-video'); // Main video element
const playButton = document.getElementById('play-button'); // Play button

const floatingContainer = document.getElementById('floating-video-container'); // Floating video container
const floatingVideo = document.getElementById('floating-video'); // Floating video element
const closeFloating = document.getElementById('close-floating'); // Close button for floating video

let isFloating = false;

// Parse VAST and extract the media file URL
async function fetchVast() {
  console.log('Fetching VAST tag...');
  try {
    const response = await fetch(vastTagUrl);
    const vastXml = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(vastXml, 'text/xml');

    // Extract the MediaFile URL
    const mediaFile = xmlDoc.querySelector('MediaFile');
    if (!mediaFile) {
      throw new Error('MediaFile not found in VAST tag.');
    }
    const videoUrl = mediaFile.textContent.trim();
    console.log('Media file URL extracted:', videoUrl);

    return videoUrl;
  } catch (error) {
    console.error('Error fetching or parsing VAST tag:', error);
  }
}

// Load and play the ad video
async function loadAd() {
  try {
    const videoUrl = await fetchVast();
    if (videoUrl) {
      videoElement.src = videoUrl; // Set the video source
      floatingVideo.src = videoUrl; // Set the floating video source
      console.log('Ad video loaded.');
    } else {
      console.error('No video URL available.');
    }
  } catch (error) {
    console.error('Error loading ad video:', error);
  }
}

// Play Button Logic
playButton.addEventListener('click', async () => {
  console.log('Play button clicked.');
  playButton.style.display = 'none'; // Hide the play button
  await loadAd();
  videoElement.play(); // Start video playback
});

// Floating Video Logic
function enableFloatingPlayer() {
  isFloating = true;
  floatingContainer.style.display = 'block'; // Show floating video container
  floatingVideo.currentTime = videoElement.currentTime; // Sync time with main video
  floatingVideo.play();
  videoElement.pause(); // Pause the main video
}

function disableFloatingPlayer() {
  isFloating = false;
  floatingContainer.style.display = 'none'; // Hide floating video container
  videoElement.currentTime = floatingVideo.currentTime; // Sync time with floating video
  videoElement.play(); // Resume main video
  floatingVideo.pause();
}

// Synchronize main video with floating video
function syncMainVideo() {
  videoElement.currentTime = floatingVideo.currentTime;
  videoElement.play();
  floatingVideo.pause(); // Pause floating video when switching back
}

// Synchronize floating video with main video
function syncFloatingVideo() {
  floatingVideo.currentTime = videoElement.currentTime;
  floatingVideo.play();
  videoElement.pause(); // Pause main video when switching to floating
}

// Close button for floating video
closeFloating.addEventListener('click', () => {
  disableFloatingPlayer();
});

// IntersectionObserver for scroll tracking
const observer = new IntersectionObserver((entries) => {
  const entry = entries[0];
  if (!entry.isIntersecting && !isFloating) {
    enableFloatingPlayer(); // Switch to floating player
  } else if (entry.isIntersecting && isFloating) {
    disableFloatingPlayer(); // Switch back to main player
  }
});

// Observe the main video element
observer.observe(videoElement);

// Playback state management
videoElement.addEventListener('play', () => {
  if (isFloating) {
    floatingVideo.pause();
  }
  console.log('Main video started.');
});

videoElement.addEventListener('pause', () => {
  console.log('Main video paused.');
});

floatingVideo.addEventListener('play', () => {
  if (!isFloating) {
    floatingVideo.pause(); // Ensure floating video doesn't play when main video is active
  } else {
    videoElement.pause();
  }
  console.log('Floating video started.');
});

floatingVideo.addEventListener('pause', () => {
  console.log('Floating video paused.');
});

videoElement.addEventListener('timeupdate', () => {
  if (!isFloating) {
    floatingVideo.currentTime = videoElement.currentTime; // Sync floating video time
  }
});

floatingVideo.addEventListener('timeupdate', () => {
  if (isFloating) {
    videoElement.currentTime = floatingVideo.currentTime; // Sync main video time
  }
});

videoElement.addEventListener('ended', () => {
  console.log('Ad ended.');
  disableFloatingPlayer();
});
