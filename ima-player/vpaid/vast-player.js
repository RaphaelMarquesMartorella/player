(function () {
    // Locate the container
    const playerContainer = document.getElementById('vast-video-player');
    if (!playerContainer) {
      console.error('VAST Video Player: Missing container with id "vast-video-player".');
      return;
    }

    // Add styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      body {
      margin: 0;
      display: flex;
      height: 200vh;
      flex-direction: column;
      align-items: center;
      background-color: #f0f0f0;
    }

    /* Responsive container for the video */
    #ad-container {
      width: 100%; /* Take full width of the screen */
      max-width: 640px; /* Limit to a max width */
      aspect-ratio: 16 / 9; /* Maintain 16:9 aspect ratio */
      background-color: black;
      position: relative;
      margin-top: 20px;
    }

    /* Make the video fill the container */
    #ad-video {
      width: 100%; /* Full width of the container */
      height: 100%; /* Full height of the container */
      object-fit: contain; /* Scale the video without cropping */
    }

    .play-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
    }

    .play-button svg {
      fill: white;
      width: 40px;
      height: 40px;
    }

    #floating-video-container {
      display: none;
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 300px;
      height: 170px;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      background-color: black;
      overflow: hidden;
    }

    #floating-video-container video {
      width: 100%;
      height: 100%;
    }

    #close-floating {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 24px;
      height: 24px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      color: white;
      font-size: 16px;
      line-height: 24px;
      text-align: center;
      cursor: pointer;
    }
    `;
    document.head.appendChild(style);

    // Add HTML structure
    playerContainer.innerHTML = `
      <div id="ad-container">
    <video id="ad-video" controls playsinline poster="https://via.placeholder.com/640x360.png?text=Loading+Video"></video>
    <div class="play-button" id="play-button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  </div>
  <div id="floating-video-container">
    <video id="floating-video" controls playsinline></video>
    <div id="close-floating">✕</div>
  </div>
    `;

    const vastTagUrl = 'https://metrike-vast4-response.vercel.app/vast.xml'; // VAST URL
    const adContainer = document.getElementById('ad-container'); // Ad container element
    const videoElement = document.getElementById('ad-video'); // Main video element
    const playButton = document.getElementById('play-button'); // Play button

    const floatingContainer = document.getElementById('floating-video-container'); // Floating video container
    const floatingVideo = document.getElementById('floating-video'); // Floating video element
    const closeFloating = document.getElementById('close-floating'); // Close button for floating video

    let isFloating = false; // Tracks whether PiP is active
    let trackingFired = {
    start: false,
    firstQuartile: false,
    midpoint: false,
    thirdQuartile: false,
    complete: false,
    };

    // Parse VAST and extract the media file URL and tracking URLs
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

        // Extract tracking events
        const trackingEvents = {};
        xmlDoc.querySelectorAll('Tracking').forEach((tracking) => {
        const event = tracking.getAttribute('event');
        trackingEvents[event] = tracking.textContent.trim();
        });

        console.log('Media file URL:', videoUrl);
        console.log('Tracking URLs:', trackingEvents);

        return { videoUrl, trackingEvents };
    } catch (error) {
        console.error('Error fetching or parsing VAST tag:', error);
    }
    }

    // Fire VAST Tracking Events
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

    // Load and play the ad video
    async function loadAd() {
    try {
        const { videoUrl, trackingEvents } = await fetchVast();
        if (videoUrl) {
        videoElement.src = videoUrl;
        floatingVideo.src = videoUrl;

        // Bind tracking to both players
        bindTracking(videoElement, trackingEvents);
        bindTracking(floatingVideo, trackingEvents);

        console.log('Ad video loaded.');
        } else {
        console.error('No video URL available.');
        }
    } catch (error) {
        console.error('Error loading ad video:', error);
    }
    }

    // Bind VAST Tracking Events to a Video Element
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

    // Play Button Logic
    playButton.addEventListener('click', async () => {
    console.log('Play button clicked.');
    playButton.style.display = 'none'; // Hide the play button
    await loadAd();
    videoElement.play(); // Start video playback
    });

    // Enable PiP Player
    function enableFloatingPlayer() {
    if (videoElement.paused) {
        console.log("Can't enter PiP when video is paused.");
        return; // Only activate PiP if the main video is playing
    }

    isFloating = true;
    floatingContainer.style.display = 'block'; // Show floating video container
    floatingVideo.currentTime = videoElement.currentTime + 0.2; // Sync current time
    floatingVideo.volume = videoElement.volume; // Sync volume
    floatingVideo.muted = videoElement.muted; // Sync mute state
    floatingVideo.play(); // Continue playback in PiP
    videoElement.pause(); // Pause main video
    }

    // Disable PiP Player
    function disableFloatingPlayer() {
    isFloating = false;
    floatingContainer.style.display = 'none'; // Hide floating video container
    videoElement.currentTime = floatingVideo.currentTime + 0.2; // Sync current time
    videoElement.volume = floatingVideo.volume; // Sync volume
    videoElement.muted = floatingVideo.muted; // Sync mute state

    if (!floatingVideo.paused) {
        videoElement.play(); // Resume playback in main video if PiP was playing
    } else {
        videoElement.pause(); // Keep main video paused if PiP was paused
    }
    floatingVideo.pause(); // Pause floating video
    }

    // Close Floating Video
    closeFloating.addEventListener('click', () => {
    disableFloatingPlayer();
    });

    // IntersectionObserver for PiP Activation
    const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry.isIntersecting && !isFloating && !videoElement.paused) {
        enableFloatingPlayer(); // Activate PiP
    } else if (entry.isIntersecting && isFloating) {
        disableFloatingPlayer(); // Deactivate PiP
    }
    });

    // Observe the main video element
    observer.observe(videoElement);

    // Synchronize Play/Pause and Volume/Mute Across Players
    floatingVideo.addEventListener('play', () => {
    if (isFloating) {
        videoElement.currentTime = floatingVideo.currentTime;
        videoElement.pause();
    }
    });

    floatingVideo.addEventListener('pause', () => {
    if (isFloating) videoElement.pause();
    });

    videoElement.addEventListener('play', () => {
    if (!isFloating) {
        floatingVideo.currentTime = videoElement.currentTime;
        floatingVideo.pause();
    }
    });

    videoElement.addEventListener('pause', () => {
    if (!isFloating) floatingVideo.pause();
    });

    floatingVideo.addEventListener('volumechange', () => {
    videoElement.volume = floatingVideo.volume;
    videoElement.muted = floatingVideo.muted;
    });

    videoElement.addEventListener('volumechange', () => {
    floatingVideo.volume = videoElement.volume;
    floatingVideo.muted = videoElement.muted;
    });

  })();