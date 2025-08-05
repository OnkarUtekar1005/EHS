import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MarqueeText from './MarqueeText';

describe('MarqueeText Component', () => {
  it('renders text without marquee when not overflowing', () => {
    render(<MarqueeText text="Short text" />);
    expect(screen.getByText('Short text')).toBeInTheDocument();
  });

  it('shows ellipsis when text overflows and not hovered', () => {
    const longText = 'This is a very long course name that will definitely overflow the container width';
    const { container } = render(<MarqueeText text={longText} />);
    
    const typography = container.querySelector('.MuiTypography-root');
    expect(typography).toHaveStyle({
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    });
  });

  it('applies marquee animation on hover when text overflows', () => {
    const longText = 'This is a very long course name that will definitely overflow the container width';
    const { container } = render(<MarqueeText text={longText} />);
    
    const box = container.firstChild;
    
    // Simulate hover
    fireEvent.mouseEnter(box);
    
    // Check if marquee animation is applied
    const typography = container.querySelector('.MuiTypography-root');
    expect(typography).toHaveStyle({
      animation: expect.stringContaining('marquee')
    });
    
    // Simulate mouse leave
    fireEvent.mouseLeave(box);
  });
});