import fs from 'fs';

module.exports = function(src, dest) {
  try {
    fs.lstatSync(dest);
  } catch(e) {
    fs.symlinkSync(src,dest);
  }
};
