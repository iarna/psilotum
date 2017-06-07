'use strict'
module.exports = PsilotumWithSymlinks
var Psilotum = require('./index.js')

function PsilotumWithSymlinks (dir, opts) {
  if (!opts) opts = {}
  var userFilter = opts.filter || Psilotum.defaultFilter
  opts.filter = function (file, parent, cb) {
    var self = this
    userFilter.call(self, file, parent, function (err, action) {
      if (err) return cb(err)
      if (action & Psilotum.Recurse && file.stat && file.stat.isSymbolicLink()) {
        // stat info above is for the symlink, but we need to know if the
        // destination is a directory before we can continue.
        return fs.stat(file.path, function (err, statInfo) {
          if (err) return cb(err)
          if (statInfo.isDirectory()) {
            self.recurseInto(file, action)
            return cb()
          } else {
            return cb(null, action)
          }
        })
      } else {
        return cb(null, action)
      }
    })
  }
  return new Psilotum(dir, opts)
}