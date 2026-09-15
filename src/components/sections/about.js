import React from 'react';
import styled from 'styled-components';

const StyledAboutSection = styled.section`
  --section-padding-block: 64px;

  @media (max-width: 768px) {
    --section-padding-block: 48px;
  }

  .about-grid {
    display: grid;
    grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.25fr);
    gap: 82px;
    align-items: start;

    @media (max-width: 800px) {
      grid-template-columns: 1fr;
      gap: 34px;
    }
  }

  .about-lead {
    position: relative;
    margin: 0;
    text-wrap: balance;
    padding-left: 24px;
    color: var(--ink);
    font-family: var(--font-serif);
    font-size: 34px;
    font-style: italic;
    line-height: 1.23;

    &:before {
      content: '';
      position: absolute;
      top: 0.15em;
      bottom: 0.15em;
      left: 0;
      width: 3px;
      background: var(--warm);
    }

    @media (max-width: 600px) {
      font-size: 28px;
    }
  }

  .about-copy {
    p {
      margin: 0 0 20px;
      color: var(--text);
      font-size: var(--fz-lg);
      line-height: 1.7;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .toolkit {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 42px;
    align-items: start;
    margin-top: 34px;

    @media (max-width: 700px) {
      grid-template-columns: 1fr;
      gap: 18px;
    }
  }

  .toolkit-label {
    margin: 0;
    color: var(--ink);
    font-size: var(--fz-sm);
    font-weight: 600;
    text-transform: uppercase;
  }

  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
    padding: 0;
    margin: 0;
    list-style: none;

    li {
      position: relative;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: var(--fz-xs);

      &:not(:last-child):after {
        content: '/';
        position: absolute;
        right: -14px;
        color: var(--warm);
      }
    }
  }
`;

const skills = [
  'JavaScript/TypeScript',
  'React/React Native',
  'Node.js/Go',
  'GraphQL/REST APIs',
  'Python/TensorFlow/Keras',
  'MCP & LLM Integration',
  'OpenAI & Anthropic APIs',
  'Azure AI Foundry',
];

const About = () => (
  <StyledAboutSection id="about">
    <h2 className="numbered-heading">About me</h2>

    <div className="about-grid">
      <p className="about-lead">Work across products, systems, and AI.</p>

      <div className="about-copy">
        <p>
          At Microsoft, I’ve worked on React Native features used by millions, native Android
          integrations, and notification systems for Teams. These projects have involved product
          development, API design, performance, and reliability.
        </p>
        <p>
          My experience also includes the AI Harness for spec-driven development, the Obsidian MCP
          server, and deep-learning work at Samsung Research. I focus on understanding the problem,
          learning what’s needed, and working with others to find an approach that fits.
        </p>
      </div>
    </div>

    <div className="toolkit">
      <p className="toolkit-label">Technologies</p>
      <ul className="skills-list">
        {skills.map(skill => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </div>
  </StyledAboutSection>
);

export default About;
