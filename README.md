psilotum
--------

Recursively walk a file tree emitting results as an object stream.

```js
var Psilotum = require('psilotum')

// list all the files in the current directory (equivalent of the Unix
// command `find .`)
var find = new Psilotum('.')
find.on('data', function (file) {
  console.log(file.path)
})

// find all the files starting with the word "read" (equivalent of the
// Unix command `find . -iname read*
var find = new Psilotum('.', function (file, cb) {
cb(null, /^read/.test(file.basename) )
})
find.on('data', function (file) {
  if (/^read/.test(file.basename)) console.log(file.path)
})
```
