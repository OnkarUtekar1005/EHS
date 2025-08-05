import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const MarqueeText = ({ text, variant = "h6", sx = {}, ...props }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const isOverflow = textRef.current.scrollWidth > containerRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  const marqueeStyles = isOverflowing && isHovered ? {
    '@keyframes marquee': {
      '0%': { transform: 'translateX(0%)' },
      '100%': { transform: 'translateX(-100%)' }
    },
    animation: 'marquee 10s linear infinite',
    paddingRight: '50px',
    display: 'inline-block',
    whiteSpace: 'nowrap'
  } : {};

  return (
    <Box
      ref={containerRef}
      sx={{
        overflow: 'hidden',
        width: '100%',
        position: 'relative',
        ...sx.container
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Typography
        ref={textRef}
        variant={variant}
        {...props}
        sx={{
          ...sx,
          whiteSpace: isOverflowing && !isHovered ? 'nowrap' : 'normal',
          overflow: isOverflowing && !isHovered ? 'hidden' : 'visible',
          textOverflow: isOverflowing && !isHovered ? 'ellipsis' : 'clip',
          ...marqueeStyles
        }}
      >
        {text}
        {isOverflowing && isHovered && (
          <span style={{ paddingLeft: '50px' }}>{text}</span>
        )}
      </Typography>
    </Box>
  );
};

export default MarqueeText;