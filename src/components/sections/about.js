import React from 'react';
import styled from 'styled-components';

const StyledAboutSection = styled.section`
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
    margin-top: 54px;

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
  'MCP & LLM Integration',
  'OpenAI & Anthropic APIs',
  'Azure AI Foundry',
  'Python/TensorFlow/Keras',
  'JavaScript/TypeScript',
  'React/React Native',
  'Node.js/Go',
  'GraphQL/REST APIs',
];

const About = () => (
  <StyledAboutSection id="about">
    <h2 className="numbered-heading">About me</h2>

    <div className="about-grid">
      <p className="about-lead">AI-assisted SDLC and developer tooling.</p>

      <div className="about-copy">
        <p>
          I build developer tooling for an AI-assisted software development lifecycle (SDLC). At
          Microsoft, I authored the AI Harness, a contract-driven framework for spec-validated
          LLM-assisted engineering.
        </p>
        <p>
          I also developed the Obsidian Model Context Protocol (MCP) server for AI-assisted note
          management. My earlier deep-learning work at Samsung Research used TensorFlow and Keras
          for an RNN-based wearable-controller calibration model.
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
