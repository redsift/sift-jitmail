/**
 * Main scripts for the Sift to be bundled
 */
var mainJS = [
  {
    name: 'summary', // prefix for output file
    indexFile: './src/scripts/summary.js' // the index file
  },
  {
    name: 'email-thread',
    indexFile: './src/scripts/email-thread.js'
  },
  {
    name: 'email-compose',
    indexFile: './src/scripts/email-compose.js'
  },
  {
    name: 'controller',
    indexFile: './src/scripts/controller.js'
  },
  {
    name: 'email-client-controller',
    indexFile: './src/scripts/email-client-controller.js'
  }
];

/**
 * Main styles for the Sift to be bundled
 */
var styles = [
  {
    name: 'summary',
    indexFile: './src/styles/summary.styl'
  },
  {
    name: 'email',
    indexFile: './src/styles/email.styl'
  }
];

/**
 * Default configurations
 */
var defaults = {
  formats: ['es', 'umd'],
  outputFolder: './public/dist',
  moduleNameJS: 'SiftJITMail',
  mapsDest: '.',
  externalMappings: {},
  useNormalizeCSS: false
};

function bundles(type) {
  var l, v, r =[];
  switch(type) {
    case 'css':
      l = styles;
      v = 'styles';
      break;
    case 'js':
      l = mainJS;
      v = 'mainJS';
      break;
    default:
      console.error('Unsupported bundle type: ', type);
      return;
  }
  l.forEach(function (o) {
    var oo = {};
    oo[v] = o;
    r.push(Object.assign(oo, defaults));
  });
  return r;
}

module.exports = bundles;
