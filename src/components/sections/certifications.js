import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import styled from 'styled-components';
import { Icon } from '@components/icons';

const StyledCertificationsSection = styled.section`
  .numbered-heading {
    margin-bottom: 48px;
  }
`;

const StyledCredentialsList = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding: 0;
  margin: 0;
  list-style: none;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCredential = styled.li`
  position: relative;
  min-width: 0;
  padding: 24px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--ink);
  border-radius: var(--radius-sm);
  box-shadow: 7px 7px 0 ${({ index }) => (index % 2 === 0 ? 'var(--accent)' : 'var(--warm)')};

  &:before {
    content: '';
    position: absolute;
    inset: 7px;
    border: 1px solid var(--line);
    pointer-events: none;
  }

  &:after {
    content: '';
    position: absolute;
    top: -26px;
    right: -26px;
    width: 72px;
    height: 72px;
    background: ${({ index }) =>
      index % 2 === 0 ? 'var(--accent-tint-strong)' : 'var(--warm-tint)'};
    transform: rotate(45deg);
  }

  @media (max-width: 600px) {
    min-height: 0;
    padding: 24px;
  }

  article {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .certificate-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  .certificate-type {
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    text-transform: uppercase;
  }

  .certificate-type {
    color: var(--accent-strong);
    font-weight: 600;
  }

  .credential-heading {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    margin-top: 26px;
  }

  .credential-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    background: var(--paper);
    border: 1px solid var(--accent);
    border-radius: 50%;
    color: var(--accent-strong);

    svg {
      width: 22px;
      height: 22px;
    }
  }

  .credential-title {
    margin: 5px 0 0;
    color: var(--ink);
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.16;
  }

  .credential-issuer {
    display: block;
    margin: 0;
    color: var(--accent-strong);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    font-weight: 600;
    text-transform: uppercase;
  }

  .credential-description {
    margin-top: 18px;
    color: var(--text);
    font-size: var(--fz-sm);
    line-height: 1.55;

    p {
      margin: 0;
    }
  }

  .certificate-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: auto;
    padding-top: 18px;
    border-top: 1px solid var(--line);
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    text-transform: uppercase;
  }
`;

const Certifications = () => {
  const data = useStaticQuery(graphql`
    query {
      certifications: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/certifications/" } }
        sort: { fields: [frontmatter___date], order: DESC }
      ) {
        edges {
          node {
            frontmatter {
              date
              title
              issuer
              icon
            }
            html
          }
        }
      }
    }
  `);

  const credentials = data.certifications.edges;

  return (
    <StyledCertificationsSection id="certifications">
      <h2 className="numbered-heading">Learning beyond the day job</h2>

      <StyledCredentialsList>
        {credentials.map(({ node }, index) => {
          const { frontmatter, html } = node;
          const { title, issuer, icon, date } = frontmatter;
          const formattedDate = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            timeZone: 'UTC',
          });

          return (
            <StyledCredential key={title} index={index}>
              <article aria-label={`${title}, ${issuer}`}>
                <div className="certificate-top">
                  <span className="certificate-type">Coursework</span>
                </div>

                <div className="credential-heading">
                  <span className="credential-icon" aria-hidden="true">
                    <Icon name={icon || 'Certificate'} />
                  </span>
                  <div>
                    <span className="credential-issuer">{issuer}</span>
                    <h3 className="credential-title">{title}</h3>
                  </div>
                </div>
                <div
                  className="credential-description"
                  dangerouslySetInnerHTML={{ __html: html }}
                />

                <footer className="certificate-footer">
                  <span>Date</span>
                  <time dateTime={date}>{formattedDate}</time>
                </footer>
              </article>
            </StyledCredential>
          );
        })}
      </StyledCredentialsList>
    </StyledCertificationsSection>
  );
};

export default Certifications;
