# JavaScript Status Parser

Parse output of `git status --porcelain=v2 --branch` with JavaScript

## Installation

what-the-status is available via npm

    npm install what-the-status


## Usage

```javascript
let parse = require('what-the-status')

var str = `# branch.oid 66d11860af6d28eb38349ef83de475597cb0e8b4
# branch.head master
# branch.upstream origin/master
# branch.ab +3 -2
1 MM N... 100644 100644 100644 257cc5642cb1a054f08cc83f2d943e56fd3ebe99 c9f54222977c93ea17ba4a5a53c611fa7f1aaf56 a.txt
1 .D N... 100644 100644 000000 5716ca5987cbf97d6bb54920bea6adde242d87e6 5716ca5987cbf97d6bb54920bea6adde242d87e6 b.txt
? d.txt
`

parse(str)

// returns
  {
    branch: {
      oid: '66d11860af6d28eb38349ef83de475597cb0e8b4',
      head: 'master',
      upstream: 'origin/master',
      aheadBehind: {
        ahead: 3,
        behind: 2,
      }
    },
    changedEntries: [
      {
        filePath: 'a.txt',
        stagedStatus: 'M',
        unstagedStatus: 'M',
        submodule: {
          isSubmodule: false
        },
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
        stagedStatus: null,
        unstagedStatus: 'D',
        submodule: {
          isSubmodule: false
        },
        fileModes: {
          head: '100644',
          index: '100644',
          worktree: '000000',
        },
        headSha: '5716ca5987cbf97d6bb54920bea6adde242d87e6',
        indexSha: '5716ca5987cbf97d6bb54920bea6adde242d87e6',
      },
    ],
    untrackedEntries: [{filePath: 'd.txt'}],
    renamedEntries: [],
    unmergedEntries: [],
    ignoredEntries: [],
  }
```
