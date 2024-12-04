const vastTagUrl = 'https://metrike-vast4-response.vercel.app/vast.xml';
const adContainer = document.getElementById('ad-container');
const videoElement = document.getElementById('ad-video');
const floatingContainer = document.getElementById('floating-video-container');
const floatingVideo = document.getElementById('floating-video');
const closeFloating = document.getElementById('close-floating');

let isFloating = false;
let trackingFired = {
  start: false,
  firstQuartile: false,
  midpoint: false,
  thirdQuartile: false,
  complete: false,
};

async function fetchVast() {
  console.log('Fetching VAST tag...');
  try {
    const response = await fetch(vastTagUrl);
    const vastXml = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(vastXml, 'text/xml');

    const mediaFile = xmlDoc.querySelector('MediaFile');
    const clickThrough = xmlDoc.querySelector('ClickThrough');

    if (!mediaFile) {
      throw new Error('MediaFile not found in VAST tag.');
    }

    const videoUrl = mediaFile.textContent.trim();
    const clickThroughUrl = clickThrough ? clickThrough.textContent.trim() : null;

    const trackingEvents = {};
    xmlDoc.querySelectorAll('Tracking').forEach((tracking) => {
      const event = tracking.getAttribute('event');
      trackingEvents[event] = tracking.textContent.trim();
    });

    console.log('Media file URL:', videoUrl);
    console.log('ClickThrough URL:', clickThroughUrl);
    console.log('Tracking URLs:', trackingEvents);

    return { videoUrl, clickThroughUrl, trackingEvents };
  } catch (error) {
    console.error('Error fetching or parsing VAST tag:', error);
  }
}

function fireTrackingEvent(eventName, trackingUrls) {
  if (!trackingUrls[eventName] || trackingFired[eventName]) return;
  console.log(`Firing ${eventName} tracking URL:`, trackingUrls[eventName]);
  fetch(trackingUrls[eventName])
    .then(() => {
      console.log(`${eventName} event tracked successfully.`);
      trackingFired[eventName] = true;
    })
    .catch((error) => console.error(`Error tracking ${eventName} event:`, error));
}

async function loadAd() {
  try {
    const { videoUrl, clickThroughUrl, trackingEvents } = await fetchVast();
    const loadingOverlay = document.getElementById('loading-overlay');

    loadingOverlay.style.display = 'flex';

    if (videoUrl) {
      videoElement.src = videoUrl;
      floatingVideo.src = videoUrl;

      bindTracking(videoElement, trackingEvents);
      bindTracking(floatingVideo, trackingEvents);

      if (clickThroughUrl) {
        videoElement.addEventListener('click', (e) => {
          const rect = videoElement.getBoundingClientRect();
          const isControlArea = e.clientY > rect.bottom - 50;
          if (!isControlArea) {
            window.open(clickThroughUrl, '_blank');
          }
        });

        floatingVideo.addEventListener('click', (e) => {
          const rect = floatingVideo.getBoundingClientRect();
          const isControlArea = e.clientY > rect.bottom - 30;
          if (!isControlArea) {
            window.open(clickThroughUrl, '_blank');
          }
        });
      }

      videoElement.addEventListener('loadeddata', () => {
        loadingOverlay.style.display = 'none';
      });

      console.log('Ad video loaded.');
    } else {
      console.error('No video URL available.');
    }
  } catch (error) {
    console.error('Error loading ad video:', error);
    document.getElementById('loading-overlay').style.display = 'none';
  }
}

function bindTracking(video, trackingUrls) {
  video.addEventListener('play', () => fireTrackingEvent('start', trackingUrls));
  video.addEventListener('timeupdate', () => {
    const quartile = video.currentTime / video.duration;
    if (quartile >= 0.25 && !trackingFired.firstQuartile) {
      fireTrackingEvent('firstQuartile', trackingUrls);
    }
    if (quartile >= 0.5 && !trackingFired.midpoint) {
      fireTrackingEvent('midpoint', trackingUrls);
    }
    if (quartile >= 0.75 && !trackingFired.thirdQuartile) {
      fireTrackingEvent('thirdQuartile', trackingUrls);
    }
  });
  video.addEventListener('ended', () => fireTrackingEvent('complete', trackingUrls));
  video.addEventListener('volumechange', () => {
    const event = video.muted ? 'mute' : 'unmute';
    fireTrackingEvent(event, trackingUrls);
  });
  video.addEventListener('pause', () => fireTrackingEvent('pause', trackingUrls));
}

async function initialize() {
  await loadAd();
  videoElement.play();
}

function enableFloatingPlayer() {
  if (videoElement.paused) {
    console.log("Can't enter PiP when video is paused.");
    return;
  }

  isFloating = true;
  floatingContainer.style.display = 'block';
  floatingVideo.currentTime = videoElement.currentTime;
  floatingVideo.volume = videoElement.volume;
  floatingVideo.muted = videoElement.muted;
  floatingVideo.play();
  videoElement.pause();
}

function disableFloatingPlayer() {
  isFloating = false;
  floatingContainer.style.display = 'none';
  videoElement.currentTime = floatingVideo.currentTime;
  videoElement.volume = floatingVideo.volume;
  videoElement.muted = floatingVideo.muted;

  if (!floatingVideo.paused) {
    videoElement.play();
  } else {
    videoElement.pause();
  }
  floatingVideo.pause();
}

function synchronizeVideos(sourceVideo, targetVideo) {
  targetVideo.currentTime = sourceVideo.currentTime;
  targetVideo.muted = sourceVideo.muted;
  targetVideo.volume = sourceVideo.volume;
}

videoElement.addEventListener('timeupdate', () => {
  if (isFloating && Math.abs(videoElement.currentTime - floatingVideo.currentTime) > 0.1) {
    synchronizeVideos(videoElement, floatingVideo);
  }
});

floatingVideo.addEventListener('timeupdate', () => {
  if (isFloating && Math.abs(floatingVideo.currentTime - videoElement.currentTime) > 0.1) {
    synchronizeVideos(floatingVideo, videoElement);
  }
});

closeFloating.addEventListener('click', () => {
  disableFloatingPlayer();
  videoElement.pause();
});

const observer = new IntersectionObserver((entries) => {
  const entry = entries[0];
  if (!entry.isIntersecting && !isFloating && !videoElement.paused) {
    enableFloatingPlayer();
  } else if (entry.isIntersecting && isFloating) {
    disableFloatingPlayer();
  }
});

observer.observe(videoElement);

initialize();
