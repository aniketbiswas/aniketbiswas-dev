/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path');
const { assertPortfolioTree } = require('./scripts/portfolio-release.cjs');

// Define schema for custom fields
exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  const typeDefs = `
    type MarkdownRemarkFrontmatter {
      title: String
      date: Date @dateformat
      priority: Int
      company: String
      currentTeam: String
      location: String
      range: String
      url: String
      github: String
      external: String
      tech: [String]
      showInProjects: Boolean
      ios: String
      android: String
      cover: File @fileByRelativePath
      cta: String
    }
  `;
  createTypes(typeDefs);
};

exports.onPreBootstrap = () => assertPortfolioTree(path.join(__dirname, 'static'));

exports.onPostBuild = () => assertPortfolioTree(path.join(__dirname, 'public'));

// https://www.gatsbyjs.org/docs/node-apis/#onCreateWebpackConfig
exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  // https://www.gatsbyjs.org/docs/debugging-html-builds/#fixing-third-party-modules
  if (stage === 'build-html' || stage === 'develop-html') {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /miniraf/,
            use: loaders.null(),
          },
          {
            test: /@chenglou[\\/]pretext/,
            use: loaders.null(),
          },
        ],
      },
    });
  }

  actions.setWebpackConfig({
    resolve: {
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@fonts': path.resolve(__dirname, 'src/fonts'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@images': path.resolve(__dirname, 'src/images'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },
  });
};
