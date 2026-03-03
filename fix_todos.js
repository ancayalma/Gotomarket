const fs = require('fs');
const glob = require('glob'); // use standard fs approach as glob might not be installed, wait, let's use child_process for grep
const { execSync } = require('child_process');

try {
  const result = execSync("grep -rn 'TODO: fix' app/ | grep -v 'node_modules'", { encoding: 'utf8' });
  const lines = result.split('\n').filter(l => l.trim().length > 0);
  lines.forEach(line => {
    console.log(line);
  });
} catch (e) {
  console.log('Error or no matches', e.message);
}
