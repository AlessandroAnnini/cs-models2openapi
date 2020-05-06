const createBase = ({ title, version, url }) =>
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

const createPath = (model) => {
  const name = Object.keys(model)[0];
  return {
    [`/${name}/{id}`]: {
      parameters: [
        {
          schema: {
            type: 'string',
          },
          name: 'id',
          in: 'path',
          required: true,
        },
      ],
      get: {
        summary: 'Your GET endpoint',
        tags: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: model[name].properties,
                },
              },
            },
          },
        },
        operationId: `get-${name}-id`,
        description: `Returns ${name} object`,
      },
    },
  };
};

module.exports = {
  createBase,
  createPath,
};
