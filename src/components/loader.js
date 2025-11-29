import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import anime from 'animejs';
import styled from 'styled-components';

const StyledLoader = styled.div`
  ${({ theme }) => theme.mixins.flexCenter};
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: var(--dark-navy);
  z-index: 99;

  .loader-wrapper {
    width: max-content;
    max-width: 150px;
    transition: var(--transition);
    opacity: ${props => (props.isMounted ? 1 : 0)};

    img {
      display: block;
      width: 100%;
      height: auto;
      margin: 0 auto;
      user-select: none;
      animation: pulse 1.2s ease-in-out infinite alternate;
    }
  }

  @keyframes pulse {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.1);
    }
  }
`;

const Loader = ({ finishLoading }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const mountTimeout = setTimeout(() => {
      setIsMounted(true);
    }, 10);

    // Fallback timeout - ensure loading completes even if animation fails
    const fallbackTimeout = setTimeout(() => {
      finishLoading();
    }, 4000); // Maximum 4 seconds for loader

    // Animation timeout
    const animationTimeout = setTimeout(() => {
      try {
        const loader = anime.timeline({
          complete: () => {
            clearTimeout(fallbackTimeout); // Clear fallback if animation completes
            finishLoading();
          },
        });

        loader
          .add({
            targets: '.loader-gif',
            delay: 0,
            duration: 500,
            easing: 'easeInOutQuart',
            opacity: 0,
            scale: 0.8,
          })
          .add({
            targets: '.loader',
            duration: 200,
            easing: 'easeInOutQuart',
            opacity: 0,
            zIndex: -1,
          });
      } catch (error) {
        console.error('Animation error:', error);
        finishLoading(); // Fallback if animation throws
      }
    }, 2500);

    return () => {
      clearTimeout(mountTimeout);
      clearTimeout(fallbackTimeout);
      clearTimeout(animationTimeout);
    };
  }, [finishLoading]);

  return (
    <StyledLoader className="loader" isMounted={isMounted}>
      <Helmet bodyAttributes={{ class: `hidden` }} />

      <div className="loader-wrapper">
        <img src="/images/pixel-duck.gif" alt="Loading Animation" className="loader-gif" />
      </div>
    </StyledLoader>
  );
};

Loader.propTypes = {
  finishLoading: PropTypes.func.isRequired,
};

export default Loader;
