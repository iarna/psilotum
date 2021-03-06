'use strict'
var fs = require('fs')
var path = require('path')
var Readable = require('stream').Readable
var inherits = require('util').inherits

module.exports = Psilotum

module.exports.File = File

var Skip = module.exports.Skip = 0
var Recurse = module.exports.Recurse = 1
var Include = module.exports.Include = 2
var Required = module.exports.Required = 4

function File (filename, stat, err) {
  if (this == null) return new File(filename, stat)
  this.path = filename
  this.basename = path.basename(filename)
  this.dirname = path.dirname(filename)
  this.stat = stat
  this.error = err
}

function Psilotum (dir, opts) {
  if (this == null) return new Psilotum(dir, opts)
  Readable.call(this, {objectMode: true})
  this.Psilotum = {}
  this.Psilotum.filter = opts && opts.filter || Psilotum.defaultFilter
  this.Psilotum.fileClass = (opts && opts.fileClass) || File
  this.Psilotum.queue = [{action: this.readDir, args: [new this.Psilotum.fileClass(dir), Recurse | Required]}]
  this.Psilotum.paused = true
}
inherits(Psilotum, Readable)

Psilotum.defaultFilter = function (file, parent, cb) { cb(null, true) }

Psilotum.prototype._read = function () {
  if (!this.Psilotum.paused) return
  this.Psilotum.paused = false
  return this._dequeueNext()
}

Psilotum.prototype._dequeueNext = function () {
  var self = this
  var todo = self.Psilotum.queue[0]
  return todo.action.apply(self, todo.args.concat(function (err, keepProcessing) {
    if (err) {
      self.emit('error', err)
      return
    }
    self.Psilotum.queue.shift()
    if (!self.Psilotum.queue.length) return self.push(null)
    if (keepProcessing != null && !keepProcessing) {
      self.Psilotum.paused = true
      return
    }
    self._dequeueNext()
  }))
}

Psilotum.prototype.readDir = function (file, filterAction, cb) {
  var self = this
  fs.readdir(file.path, function (err, files) {
    if (files) {
      files.forEach(function (filename) {
        self.Psilotum.queue.push({action: self.statFile, args: [file, path.join(file.path, filename)]})
      })
    }
    file.error = err
    var fatal = filterAction & Required && err
    return cb(fatal, !fatal && filterAction & Include ? self.push(file) : true)
  })
}


Psilotum.prototype.statFile = function (parent, filename, cb) {
  var self = this
  fs.lstat(filename, function (statErr, statInfo) {
    var file = new self.Psilotum.fileClass(filename, statInfo, statErr)
    self.Psilotum.filter.call(self, file, parent, function (filterErr, action) {
      if (filterErr && !statErr) file.error = filterErr
      self.queueEntry(file, action, cb)
    })
  })
}

Psilotum.prototype.queueEntry = function (file, action, cb) {
  if (action === true) action = Recurse | Include
  var fatal = action & Required && file.error
  if (fatal) return cb(fatal)

  if (action & Recurse && file.stat && file.stat.isDirectory()) {
    this.recurseInto(file, action)
    cb()
  } else if (action & Include) {
    cb(null, this.push(file))
  } else {
    cb()
  }
}

Psilotum.prototype.recurseInto = function (file, action) {
  this.Psilotum.queue.push({action: this.readDir, args: [file, action]})
}

Psilotum.prototype.queue = function (filename, action, cb) {
  var self = this
  return fs.lstat(filename, function (statErr, statInfo) {
    var file = new self.Psilotum.fileClass(filename, statInfo, statErr)
    self.queueEntry(file, action, cb)
  })
}
