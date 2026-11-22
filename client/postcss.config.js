const path = require('path');

// Vite gets its PostCSS setup from ../server/vite.config.js; this file mirrors it for editor tooling.
module.exports = {
  plugins: {
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
