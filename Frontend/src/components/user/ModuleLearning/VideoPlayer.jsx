import React, { useRef, useEffect, useState } from 'react';

const VideoPlayer = ({ src, onProgressUpdate }) => {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };
    
    const handleTimeUpdate = () => {
      if (duration > 0) {
        const progress = Math.round((videoElement.currentTime / duration) * 100);
        onProgressUpdate(progress);
      }
    };
    
    const handleEnded = () => {
      onProgressUpdate(100);
    };
    
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);
    
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [duration, onProgressUpdate]);
  
  return (
    <div className="video-player-container">
      <video 
        ref={videoRef}
        src={src}
        controls
        className="video-player"
      />
    </div>
  );
};

export default VideoPlayer;