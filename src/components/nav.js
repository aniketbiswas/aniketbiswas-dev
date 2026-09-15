import React, { useEffect, useState } from 'react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { navLinks } from '@config';
import { Menu } from '@components';
import pixelComputer from '@images/pixel-computer.png';

const StyledHeader = styled.header`
  position: fixed;
  top: 0;
  z-index: 11;
  width: 100%;
  height: var(--nav-height);
  background: rgba(243, 241, 235, 0.9);
  border-bottom: 1px solid var(--line-frame);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
`;

const StyledNav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: var(--content-max);
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--frame-pad);

  @media (max-width: 900px) {
    padding: 0 40px;
  }

  @media (max-width: 768px) {
    padding: 0 var(--frame-pad-sm);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: var(--ink);

    &:hover,
    &:focus-visible {
      color: var(--ink);
    }
  }

  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;

    img {
      width: 52px;
      height: 52px;
      max-width: none;
      transition: transform 0.2s var(--easing);
    }
  }

  .brand:hover .brand-mark img,
  .brand:focus-visible .brand-mark img {
    transform: translate(-2px, -2px);
  }

  .brand-name {
    font-size: var(--fz-md);
    font-weight: 600;

    @media (max-width: 900px) {
      display: none;
    }
  }
`;

const StyledLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    display: none;
  }

  ol {
    display: flex;
    align-items: center;
    gap: 26px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  li a {
    padding: 10px 0;
    color: var(--text);
    font-size: var(--fz-sm);
    font-weight: 500;

    &:after {
      content: '';
      position: absolute;
      right: 0;
      bottom: 5px;
      left: 0;
      height: 2px;
      background: var(--accent);
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.25s var(--easing);
    }

    &:hover,
    &:focus-visible,
    &.active {
      color: var(--ink);

      &:after {
        transform: scaleX(1);
        transform-origin: left;
      }
    }
  }

  .resume-button {
    ${({ theme }) => theme.mixins.smallButton};
    padding: 0.75rem 1rem;
  }
`;

const Nav = ({ isHome }) => {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const ids = isHome ? navLinks.map(({ url }) => url.split('#')[1]).filter(Boolean) : [];
    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);

    const updateHeader = () => {
      if (!isHome) {
        setActiveSection('');
        return;
      }

      const isAtBottom =
        window.pageYOffset + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (isAtBottom) {
        setActiveSection(sections[sections.length - 1]?.id || '');
        return;
      }

      const marker = window.pageYOffset + Math.min(window.innerHeight * 0.35, 260);
      const currentSection = sections.reduce(
        (activeId, section) => (section.offsetTop <= marker ? section.id : activeId),
        '',
      );
      setActiveSection(currentSection);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);

    return () => {
      window.removeEventListener('scroll', updateHeader);
      window.removeEventListener('resize', updateHeader);
    };
  }, [isHome]);

  return (
    <StyledHeader>
      <StyledNav aria-label="Primary navigation">
        <Link className="brand" to="/" aria-label="Aniket Biswas, home">
          <span className="brand-mark" aria-hidden="true">
            <img src={pixelComputer} width="44" height="44" alt="" />
          </span>
          <span className="brand-name">Aniket Biswas</span>
        </Link>

        <StyledLinks>
          <ol>
            {navLinks.map(({ url, name }) => {
              const id = url.split('#')[1];
              return (
                <li key={url}>
                  <Link
                    to={url}
                    className={activeSection === id ? 'active' : ''}
                    aria-current={activeSection === id ? 'location' : undefined}>
                    {name}
                  </Link>
                </li>
              );
            })}
          </ol>
          <a className="resume-button" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
            Résumé
          </a>
        </StyledLinks>

        <Menu activeSection={activeSection} />
      </StyledNav>
    </StyledHeader>
  );
};

Nav.propTypes = {
  isHome: PropTypes.bool,
};

export default Nav;
