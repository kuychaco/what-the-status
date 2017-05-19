var status = require('../')
var dedent = require('dedent-js')
var fs = require('fs')

var assert = require("nodeunit").assert

function nlToNul (str) {
  console.log(str)
  let out = str.replace(/\n/g, '\0')
  if (!out.endsWith('\0')) {
    out += '\0'
  }
  return out
}

exports.testSimpleStatus = function(test) {
  var str = nlToNul(dedent`
    # branch.oid 66d11860af6d28eb38349ef83de475597cb0e8b4
    # branch.head master
    # branch.upstream origin/master
    # branch.ab +3 -2
    1 MM N... 100644 100644 100644 257cc5642cb1a054f08cc83f2d943e56fd3ebe99 c9f54222977c93ea17ba4a5a53c611fa7f1aaf56 a.txt
    1 .D N... 100644 100644 000000 5716ca5987cbf97d6bb54920bea6adde242d87e6 5716ca5987cbf97d6bb54920bea6adde242d87e6 b.txt
    1 .D N... 100644 100644 000000 76018072e09c5d31c8c6e3113b8aa0fe625195ca 76018072e09c5d31c8c6e3113b8aa0fe625195ca c.txt
    1 AM N... 000000 100644 100644 0000000000000000000000000000000000000000 78df5b06bd324da777762461e147ff3e4c72fb1d e.txt
    ? d.txt
  `)

  const output = status.parse(str)
  assert.deepEqual(output, {
    branch: {
      oid: '66d11860af6d28eb38349ef83de475597cb0e8b4',
      head: 'master',
      upstream: 'origin/master',
      ahead_behind: {
        ahead: 3,
        behind: 2,
      }
    },
    changedEntries: [
      {
        filePath: 'a.txt',
        stagedStatus: 'modified',
        unstagedStatus: 'modified',
        submodule: false,
        fileModes: {
          head: '100644',
          index: '100644',
          worktree: '100644',
        },
        headSha: '257cc5642cb1a054f08cc83f2d943e56fd3ebe99',
        indexSha: 'c9f54222977c93ea17ba4a5a53c611fa7f1aaf56',
      },
      {
        filePath: 'b.txt',
        stagedStatus: 'deleted',
        unstagedStatus: null,
        submodule: false,
        fileModes: {
          head: '100644',
          index: '100644',
          worktree: '000000',
        },
        headSha: '5716ca5987cbf97d6bb54920bea6adde242d87e6',
        indexSha: '5716ca5987cbf97d6bb54920bea6adde242d87e6',
      },
      {
        filePath: 'c.txt',
        stagedStatus: 'deleted',
        unstagedStatus: null,
        submodule: false,
        fileModes: {
          head: '100644',
          index: '100644',
          worktree: '000000',
        },
        headSha: '76018072e09c5d31c8c6e3113b8aa0fe625195ca',
        indexSha: '76018072e09c5d31c8c6e3113b8aa0fe625195ca',
      },
      {
        filePath: 'e.txt',
        stagedStatus: 'added',
        unstagedStatus: 'modified',
        submodule: false,
        fileModes: {
          head: '000000',
          index: '100644',
          worktree: '100644',
        },
        headSha: '0000000000000000000000000000000000000000',
        indexSha: '78df5b06bd324da777762461e147ff3e4c72fb1d',
      },
    ],
    renamedEntries: [],
    unmergedEntries: [],
    untrackedEntries: [{filePath: 'd.txt'}],
    ignoredEntries: [],
  })
  test.done()
}
