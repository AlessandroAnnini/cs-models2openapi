const fs = require('fs');
const path = require('path');

const qoa = require('qoa');
const { createBase, createPath } = require('./openapi');

String.prototype.uncapitalize = function () {
  return this.charAt(0).toLowerCase() + this.slice(1);
};

const ps = [
  {
    type: 'input',
    query: 'project title: (default: project-<unix epoch>)',
    handle: 'title',
  },
  {
    type: 'input',
    query: 'version: (default 1.0)',
    handle: 'version',
  },
  {
    type: 'input',
    query: 'server url: (default: http://localhost:3001)',
    handle: 'url',
  },
  {
    type: 'input',
    query: 'models root path: (required)',
    handle: 'rootPath',
  },
];

const typesMap = {
  string: 'string',
  int: 'integer',
  double: 'number',
  bool: 'boolean',
  DateTime: 'string',
};

const regdef = /\<.*?\>/g;

const parseLine = (line) => {
  if (!line.endsWith('; }')) return null;

  const words = line
    .replace(/[^a-zA-Z ]/g, ' ')
    .replace(/ +(?= )/g, '')
    .trim()
    .split(' ');

  if (words[1] === 'virtual') {
    if (words[2] === 'IEnumerable' || words[2] === 'ICollection') {
      return {
        name: words[4].uncapitalize(),
        data: {
          type: 'array',
          items: { $ref: `#/components/schemas/${words[3].uncapitalize()}` },
        },
      };
    }
    return {
      name: words[3].uncapitalize(),
      data: { $ref: `#/components/schemas/${words[2]}.uncapitalize()` },
    };
  }

  const type = typesMap[words[1]];
  return type
    ? {
        name: words[2].uncapitalize(),
        data: { type: type.uncapitalize() },
      }
    : null;
};

const extractLines = (filePath) =>
  fs.readFileSync(filePath).toString().split('\n');

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, '/', file));
    }
  });

  return arrayOfFiles;
};

const convert = (rootPath) => {
  const pathArray = getAllFiles(rootPath);
  return pathArray.map((filePath) => {
    const lines = extractLines(filePath);
    const properties = lines.reduce((res, curr) => {
      const parsed = parseLine(curr);
      if (!parsed) return res;
      const { name, data } = parsed;
      return { ...res, [name]: data };
    }, {});
    const name = path.basename(filePath).split('.').slice(0, -1).join('.');
    console.log(name);
    return Object.keys(properties).length
      ? {
          [name]: {
            title: name,
            type: 'object',
            properties,
          },
        }
      : null;
  });
};

const main = (config) => {
  if (!config.rootPath) {
    console.log(
      `\nI'm sorry you need to specify the path where to find c# classes`
    );
    return;
  }

  const openapi = createBase(config);

  const models = convert(config.rootPath);

  models
    .filter((model) => !!model)
    .forEach(
      (model) =>
        (openapi.components.schemas = {
          ...openapi.components.schemas,
          ...model,
        })
    );

  models
    .filter((model) => !!model)
    .forEach(
      (model) =>
        (openapi.paths = {
          ...openapi.paths,
          ...createPath(model),
        })
    );

  fs.writeFileSync('result.json', JSON.stringify(openapi, null, 2));
  console.log('\ndone!');
};

qoa.config({ prefix: '>' });
qoa.prompt(ps).then(main);
