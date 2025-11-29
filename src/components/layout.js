import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled, { ThemeProvider } from 'styled-components';
import { Head, Loader, Nav, Social, Email, Footer } from '@components';
import { GlobalStyle, theme } from '@styles';

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Layout = ({ children, location }) => {
  const isHome = location.pathname === '/';
  const [isLoading, setIsLoading] = useState(isHome);

  // Failsafe: Ensure loading state is cleared after maximum timeout
  useEffect(() => {
    if (isLoading) {
      const maxLoadingTimeout = setTimeout(() => {
        console.warn('Loading timeout reached, forcing content display');
        setIsLoading(false);
      }, 5000); // Maximum 5 seconds loading time

      return () => clearTimeout(maxLoadingTimeout);
    }
  }, [isLoading]);

  // Sets target="_blank" rel="noopener noreferrer" on external links
  const handleExternalLinks = () => {
    const allLinks = Array.from(document.querySelectorAll('a'));
    if (allLinks.length > 0) {
      allLinks.forEach(link => {
        if (link.host !== window.location.host) {
          link.setAttribute('rel', 'noopener noreferrer');
          link.setAttribute('target', '_blank');
        }
      });
    }
  };

  useEffect(() => {
    // Only handle external links and hash navigation when loading is complete
    if (isLoading) {
      return;
    }

    if (location.hash) {
      const id = location.hash.substring(1); // location.hash without the '#'
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView();
          el.focus();
        }
      }, 0);
    }

    handleExternalLinks();
  }, [isLoading]);

  // Cursor halo effect
  useEffect(() => {
    let isMouseMoving = false;

    const handleMouseMove = e => {
      // Use requestAnimationFrame for smooth performance
      if (!isMouseMoving) {
        isMouseMoving = true;
        requestAnimationFrame(() => {
          document.body.style.setProperty('--cursor-x', `${e.clientX}px`);
          document.body.style.setProperty('--cursor-y', `${e.clientY}px`);
          document.body.classList.add('cursor-visible');
          isMouseMoving = false;
        });
      }
    };

    const handleMouseLeave = () => {
      document.body.classList.remove('cursor-visible');
    };

    const handleMouseEnter = () => {
      document.body.classList.add('cursor-visible');
    };

    // Add event listeners with passive option for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.body.classList.remove('cursor-visible');
    };
  }, []);

  return (
    <>
      <Head />

      <div id="root">
        <ThemeProvider theme={theme}>
          <GlobalStyle />

          <a className="skip-to-content" href="#content">
            Skip to Content
          </a>

          {isLoading && isHome ? (
            <Loader finishLoading={() => setIsLoading(false)} />
          ) : (
            <StyledContent>
              <Nav isHome={isHome} />
              <Social isHome={isHome} />
              <Email isHome={isHome} />

              <div id="content">
                {children}
                <Footer />
              </div>
            </StyledContent>
          )}
        </ThemeProvider>
      </div>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
};

export default Layout;
