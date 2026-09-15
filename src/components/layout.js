import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import styled, { ThemeProvider } from 'styled-components';
import { Head, Nav, Footer } from '@components';
import { GlobalStyle, theme } from '@styles';

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Layout = ({ children, location, title, description, image }) => {
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const timeout = window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView();
          el.setAttribute('tabindex', '-1');
          el.focus({ preventScroll: true });
        }
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [location.hash]);

  return (
    <>
      <Head title={title} description={description} image={image} />

      <div id="root">
        <ThemeProvider theme={theme}>
          <GlobalStyle />

          <a className="skip-to-content" href="#content">
            Skip to Content
          </a>

          <StyledContent>
            <Nav isHome={isHome} />

            <div id="content" tabIndex={-1}>
              {children}
              <Footer />
            </div>
          </StyledContent>
        </ThemeProvider>
      </div>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
};

export default Layout;
