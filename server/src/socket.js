// Shared Socket.io instance — avoids circular dependency with index.js
let _io = null;

module.exports = {
  setIO: (instance) => { _io = instance; },
  getIO: () => _io,
};
