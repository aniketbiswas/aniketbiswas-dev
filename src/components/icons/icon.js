import React from 'react';
import PropTypes from 'prop-types';
import {
  IconAnthropic,
  IconAppStore,
  IconBookmark,
  IconCertificate,
  IconCodepen,
  IconExternal,
  IconFolder,
  IconFork,
  IconGitHub,
  IconInstagram,
  IconLinkedin,
  IconLoader,
  IconLogo,
  IconMicrosoft,
  IconPlayStore,
  IconStar,
  IconTwitter,
} from '@components/icons';
import IconLeetCode from './leetcode';

const Icon = ({ name }) => {
  switch (name) {
    case 'Anthropic':
      return <IconAnthropic />;
    case 'AppStore':
      return <IconAppStore />;
    case 'Bookmark':
      return <IconBookmark />;
    case 'Certificate':
      return <IconCertificate />;
    case 'Codepen':
      return <IconCodepen />;
    case 'External':
      return <IconExternal />;
    case 'Folder':
      return <IconFolder />;
    case 'Fork':
      return <IconFork />;
    case 'GitHub':
      return <IconGitHub />;
    case 'Instagram':
      return <IconInstagram />;
    case 'Linkedin':
      return <IconLinkedin />;
    case 'Loader':
      return <IconLoader />;
    case 'Logo':
      return <IconLogo />;
    case 'Microsoft':
      return <IconMicrosoft />;
    case 'PlayStore':
      return <IconPlayStore />;
    case 'Star':
      return <IconStar />;
    case 'Twitter':
      return <IconTwitter />;
    case 'LeetCode':
      return <IconLeetCode />;
    default:
      return <IconExternal />;
  }
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
};

export default Icon;
