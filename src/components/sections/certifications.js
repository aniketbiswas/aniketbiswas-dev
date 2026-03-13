import React, { useEffect, useRef } from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import styled from 'styled-components';
import { srConfig } from '@config';
import sr from '@utils/sr';
import { usePrefersReducedMotion } from '@hooks';
import { Icon } from '@components/icons';

const StyledCertificationsSection = styled.section`
  max-width: 1000px;

  .certifications-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-gap: 25px;
    margin-top: 50px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
`;

const StyledCertification = styled.div`
  cursor: default;
  transition: var(--transition);

  &:hover,
  &:focus-within {
    transform: translateY(-5px);

    .cert-inner {
      box-shadow: 0 20px 30px -15px var(--navy-shadow);
    }

    .cert-icon {
      color: var(--green);
    }
  }

  .cert-inner {
    ${({ theme }) => theme.mixins.boxShadow};
    ${({ theme }) => theme.mixins.flexBetween};
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    height: 100%;
    padding: 2rem 1.75rem;
    border-radius: var(--border-radius);
    background-color: var(--light-navy);
    transition: var(--transition);
  }

  .cert-top {
    ${({ theme }) => theme.mixins.flexBetween};
    width: 100%;
    margin-bottom: 20px;
  }

  .cert-icon {
    color: var(--slate);
    transition: var(--transition);

    svg {
      width: 40px;
      height: 40px;
    }
  }

  .cert-links {
    display: flex;
    align-items: center;
    margin-right: -10px;
    color: var(--light-slate);

    a {
      ${({ theme }) => theme.mixins.flexCenter};
      padding: 5px 7px;
      transition: var(--transition);

      &:hover {
        color: var(--green);
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }
  }

  .cert-title {
    margin: 0 0 15px;
    color: var(--lightest-slate);
    font-size: 24px;
    font-weight: 600;
    line-height: 1.25;

    a {
      ${({ theme }) => theme.mixins.inlineLink};
    }
  }

  .cert-issuer {
    color: var(--green);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    margin-bottom: 15px;
  }

  .cert-description {
    color: var(--light-slate);
    font-size: var(--fz-md);
    line-height: 1.6;

    p {
      margin: 0;
    }
  }

  .cert-date {
    color: var(--light-slate);
    font-family: var(--font-mono);
    font-size: var(--fz-xxs);
    margin-top: 20px;
  }
`;

const Certifications = () => {
  const data = useStaticQuery(graphql`
    query {
      certifications: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/certifications/" } }
        sort: { fields: [frontmatter___date], order: ASC }
      ) {
        edges {
          node {
            frontmatter {
              date
              title
              issuer
              icon
              credentialUrl
            }
            html
          }
        }
      }
    }
  `);

  const certificationsData = data.certifications.edges;
  const revealContainer = useRef(null);
  const revealCerts = useRef([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    sr.reveal(revealContainer.current, srConfig());
    revealCerts.current.forEach((ref, i) => sr.reveal(ref, srConfig(i * 100)));
  }, []);

  return (
    <StyledCertificationsSection id="certifications" ref={revealContainer}>
      <h2 className="numbered-heading">Certifications</h2>

      <div className="certifications-grid">
        {certificationsData &&
          certificationsData.map(({ node }, i) => {
            const { frontmatter, html } = node;
            const { title, issuer, icon, credentialUrl, date } = frontmatter;

            return (
              <StyledCertification key={i} ref={el => (revealCerts.current[i] = el)}>
                <div className="cert-inner">
                  <header>
                    <div className="cert-top">
                      <div className="cert-icon">
                        <Icon name={icon || 'Certificate'} />
                      </div>
                      <div className="cert-links">
                        {credentialUrl && (
                          <a
                            href={credentialUrl}
                            aria-label="View Credential"
                            target="_blank"
                            rel="noreferrer">
                            <Icon name="External" />
                          </a>
                        )}
                      </div>
                    </div>

                    <h3 className="cert-title">
                      {credentialUrl ? (
                        <a href={credentialUrl} target="_blank" rel="noreferrer">
                          {title}
                        </a>
                      ) : (
                        title
                      )}
                    </h3>

                    <div className="cert-issuer">{issuer}</div>

                    <div className="cert-description" dangerouslySetInnerHTML={{ __html: html }} />
                  </header>

                  <footer>
                    <div className="cert-date">
                      {new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </footer>
                </div>
              </StyledCertification>
            );
          })}
      </div>
    </StyledCertificationsSection>
  );
};

export default Certifications;
