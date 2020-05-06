module.exports = ({ title, version, url }) =>
  console.log('version', version) || {
    openapi: '3.0.0',
    info: {
      title: title || `project-${Date.now()}`,
      version: version || '1.0',
    },
    servers: [
      {
        url: url || 'http://localhost:3001',
      },
    ],
    paths: {},
    components: {
      schemas: {},
    },
  };
