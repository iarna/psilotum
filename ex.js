var Psilotum = require('.')
var find = new Psilotum('.', {
  filter: function (file, parent, cb) {
    if (/^read/i.test(file.basename)) {
      cb(null, true)
    } else if (file.stat.isDirectory()) {
      cb(null, Psilotum.Recurse)
    } else {
      cb(null, false)
    }
  }
})
find.on('data', function (file) {
  console.log(file.path)
})
