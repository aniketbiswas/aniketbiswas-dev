import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Link } from 'gatsby';
import styled from 'styled-components';
import { navLinks } from '@config';
import { KEY_CODES } from '@utils';
import { useOnClickOutside } from '@hooks';

const StyledMenu = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const StyledHamburgerButton = styled.button`
  display: none;

  @media (max-width: 768px) {
    ${({ theme }) => theme.mixins.flexCenter};
    position: relative;
    z-index: 10;
    gap: 12px;
    margin-right: -15px;
    padding: 15px;
    border: 0;
    background-color: transparent;
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: var(--fz-md);
    font-weight: 600;
    line-height: 1;
    text-transform: none;
    transition-timing-function: linear;
    transition-duration: 0.15s;
    transition-property: opacity, filter;
  }

  .ham-box {
    display: inline-block;
    position: relative;
    width: var(--hamburger-width);
    height: 24px;
  }

  .ham-box-inner {
    position: absolute;
    top: 50%;
    right: 0;
    width: var(--hamburger-width);
    height: 2px;
    border-radius: var(--border-radius);
    background-color: var(--ink);
    transition-duration: 0.22s;
    transition-property: transform;
    transition-delay: ${props => (props.menuOpen ? `0.12s` : `0s`)};
    transform: rotate(${props => (props.menuOpen ? `225deg` : `0deg`)});
    transition-timing-function: cubic-bezier(
      ${props => (props.menuOpen ? `0.215, 0.61, 0.355, 1` : `0.55, 0.055, 0.675, 0.19`)}
    );
    &:before,
    &:after {
      content: '';
      display: block;
      position: absolute;
      left: auto;
      right: 0;
      width: var(--hamburger-width);
      height: 2px;
      border-radius: 4px;
      background-color: var(--ink);
      transition-timing-function: ease;
      transition-duration: 0.15s;
      transition-property: transform;
    }
    &:before {
      width: ${props => (props.menuOpen ? `100%` : `120%`)};
      top: ${props => (props.menuOpen ? `0` : `-10px`)};
      opacity: ${props => (props.menuOpen ? 0 : 1)};
      transition: ${({ menuOpen }) =>
        menuOpen ? 'var(--ham-before-active)' : 'var(--ham-before)'};
    }
    &:after {
      width: ${props => (props.menuOpen ? `100%` : `80%`)};
      bottom: ${props => (props.menuOpen ? `0` : `-10px`)};
      transform: rotate(${props => (props.menuOpen ? `-90deg` : `0`)});
      transition: ${({ menuOpen }) => (menuOpen ? 'var(--ham-after-active)' : 'var(--ham-after)')};
    }
  }
`;

const StyledSidebar = styled.aside`
  display: none;

  @media (max-width: 768px) {
    ${({ theme }) => theme.mixins.flexCenter};
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 96px 30px 32px;
    width: min(86vw, 420px);
    height: 100vh;
    height: 100dvh;
    overflow-y: auto;
    outline: 0;
    background-color: var(--surface);
    border-left: 1px solid var(--line-strong);
    box-shadow: -10px 0px 30px -15px var(--navy-shadow);
    z-index: 9;
    transform: translateX(${props => (props.menuOpen ? 0 : 100)}vw);
    visibility: ${props => (props.menuOpen ? 'visible' : 'hidden')};
    transition: var(--transition);
  }

  nav {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    color: var(--ink);
    font-family: var(--font-sans);
    text-align: left;
  }

  ol {
    padding: 0;
    margin: 0;
    list-style: none;
    width: 100%;

    li {
      position: relative;
      margin: 0;
      border-top: 1px solid var(--line);
      font-size: 30px;
      font-weight: 600;

      &:last-child {
        border-bottom: 1px solid var(--line);
      }
    }

    a {
      ${({ theme }) => theme.mixins.link};
      width: 100%;
      padding: 15px 0 12px;

      &[aria-current='location'] {
        color: var(--accent-strong);
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 6px;
      }
    }
  }

  .resume-link {
    ${({ theme }) => theme.mixins.bigButton};
    padding: 16px 28px;
    margin: 34px 0 0;
    width: max-content;
  }
`;

const Menu = ({ activeSection = '' }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const buttonRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const focusables = [buttonRef.current, ...navRef.current.querySelectorAll('a')];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first.focus();

    const onKeyDown = event => {
      if ([KEY_CODES.ESCAPE, KEY_CODES.ESCAPE_IE11].includes(event.key)) {
        event.preventDefault();
        setMenuOpen(false);
        buttonRef.current.focus();
      } else if (event.key === KEY_CODES.TAB) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const wrapperRef = useRef();
  useOnClickOutside(wrapperRef, () => setMenuOpen(false));

  return (
    <StyledMenu>
      <Helmet>
        <body className={menuOpen ? 'blur' : ''} />
      </Helmet>

      <div
        ref={wrapperRef}
        role={menuOpen ? 'dialog' : undefined}
        aria-modal={menuOpen ? 'true' : undefined}
        aria-label={menuOpen ? 'Navigation menu' : undefined}>
        <StyledHamburgerButton
          onClick={toggleMenu}
          menuOpen={menuOpen}
          ref={buttonRef}
          aria-label={menuOpen ? 'Close sections menu' : 'Open sections menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation">
          <span>Sections</span>
          <div className="ham-box" aria-hidden="true">
            <div className="ham-box-inner" />
          </div>
        </StyledHamburgerButton>

        <StyledSidebar menuOpen={menuOpen} aria-hidden={!menuOpen} tabIndex={-1}>
          <nav id="mobile-navigation" ref={navRef} aria-label="Mobile navigation">
            {navLinks && (
              <ol>
                {navLinks.map(({ url, name }) => (
                  <li key={url}>
                    <Link
                      to={url}
                      aria-current={activeSection === url.split('#')[1] ? 'location' : undefined}
                      onClick={() => setMenuOpen(false)}>
                      {name}
                    </Link>
                  </li>
                ))}
              </ol>
            )}

            <a
              href="/resume.pdf"
              className="resume-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}>
              Resume
            </a>
          </nav>
        </StyledSidebar>
      </div>
    </StyledMenu>
  );
};

Menu.propTypes = {
  activeSection: PropTypes.string,
};

export default Menu;
