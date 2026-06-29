/**
 * Node 24 on Windows throws EISDIR from fs.readlink on regular (non-symlink)
 * files where older Node threw EINVAL. Next 14's bundled webpack/enhanced-resolve
 * treats EINVAL as "not a symlink" but propagates EISDIR, crashing the build
 * (FlightClientEntryPlugin.createActionAssets). This preload normalises the
 * error code so resolution works. Load via:  node -r ./scripts/patch-readlink.cjs
 * It is a no-op on Node versions that already behave correctly.
 */
const fs = require('fs');

function toEinval(err) {
  if (err && err.code === 'EISDIR') {
    const e = new Error('EINVAL: invalid argument, readlink');
    e.code = 'EINVAL';
    e.errno = -22;
    e.syscall = 'readlink';
    return e;
  }
  return err;
}

const readlinkSync = fs.readlinkSync;
fs.readlinkSync = function (...args) {
  try {
    return readlinkSync.apply(fs, args);
  } catch (err) {
    throw toEinval(err);
  }
};

const readlink = fs.readlink;
fs.readlink = function (path, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? undefined : options;
  return readlink.call(fs, path, opts, (err, result) => cb(toEinval(err), result));
};

if (fs.promises && fs.promises.readlink) {
  const p = fs.promises.readlink.bind(fs.promises);
  fs.promises.readlink = async (...args) => {
    try {
      return await p(...args);
    } catch (err) {
      throw toEinval(err);
    }
  };
}
