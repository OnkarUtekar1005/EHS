import React, { useEffect, useRef } from 'react';

const ComparisonChart = ({ preScore, postScore }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Chart settings
    const barWidth = 80;
    const spacing = 40;
    const startX = (width - (barWidth * 2 + spacing)) / 2;
    const maxBarHeight = height - 100;
    
    // Draw pre-assessment bar
    const preBarHeight = (preScore / 100) * maxBarHeight;
    ctx.fillStyle = '#4d8edb';
    ctx.fillRect(
      startX, 
      height - 50 - preBarHeight, 
      barWidth, 
      preBarHeight
    );
    
    // Draw post-assessment bar
    const postBarHeight = (postScore / 100) * maxBarHeight;
    ctx.fillStyle = '#28a745';
    ctx.fillRect(
      startX + barWidth + spacing, 
      height - 50 - postBarHeight, 
      barWidth, 
      postBarHeight
    );
    
    // Labels
    ctx.fillStyle = '#212529';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // Pre-assessment label
    ctx.fillText(
      'Pre-Assessment', 
      startX + barWidth / 2, 
      height - 25
    );
    ctx.fillText(
      `${preScore}%`, 
      startX + barWidth / 2, 
      height - 50 - preBarHeight - 10
    );
    
    // Post-assessment label
    ctx.fillText(
      'Post-Assessment', 
      startX + barWidth + spacing + barWidth / 2, 
      height - 25
    );
    ctx.fillText(
      `${postScore}%`, 
      startX + barWidth + spacing + barWidth / 2, 
      height - 50 - postBarHeight - 10
    );
    
    // Y-axis
    ctx.beginPath();
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let i = 0; i <= 100; i += 20) {
      const y = height - 50 - (i / 100) * maxBarHeight;
      ctx.moveTo(20, y);
      ctx.lineTo(width - 20, y);
      ctx.fillText(`${i}%`, 15, y + 5);
    }
    
    ctx.stroke();
    
  }, [preScore, postScore]);
  
  return (
    <canvas 
      ref={canvasRef}
      width={400}
      height={300}
      className="comparison-canvas"
    />
  );
};

export default ComparisonChart;