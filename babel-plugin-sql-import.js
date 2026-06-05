// babel-plugin-sql-import.js
// Babel plugin que intercepta imports de ficheiros .sql e os inline como
// strings. Necessário porque o aggregator de migrations do Drizzle
// (src/db/migrations/migrations.ts) importa o SQL directamente:
//   import m0000 from '../0000_abnormal_morlocks.sql';
//
// O plugin corre no babel (que está a ser invocado) e substitui o import
// por `const m0000 = '...sql content...';`

const fs = require('fs');
const path = require('path');

module.exports = function sqlImportPlugin() {
  return {
    name: 'sql-import',
    visitor: {
      ImportDeclaration(p, state) {
        const source = p.node.source.value;
        if (!source.endsWith('.sql')) return;

        const filename = state.filename;
        if (!filename) return;

        const resolved = path.resolve(path.dirname(filename), source);
        if (!fs.existsSync(resolved)) return;

        const content = fs.readFileSync(resolved, 'utf8');
        const specifier = p.node.specifiers[0];
        if (specifier && specifier.type === 'ImportDefaultSpecifier') {
          const name = specifier.local.name;
          p.replaceWith({
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name },
                init: { type: 'StringLiteral', value: content },
              },
            ],
          });
        }
      },
    },
  };
};
