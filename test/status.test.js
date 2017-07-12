var status = require('../')
var dedent = require('dedent-js')
var fs = require('fs')

var util = require('util')

var assert = require("nodeunit").assert

function nlToNul (str) {
  let out = str.replace(/\n/g, '\0')
  if (!out.endsWith('\0')) {
    out += '\0'
  }
  return out
}

function asyncTest(fn) {
  return async function(test) {
    try {
      await fn(test)
      test.done()
    } catch (err) {
      test.done(err)
    }
  }
}

exports.testSimpleStatus = asyncTest(async function(test) {
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

  const output = await status.parse(str)
  assert.deepEqual(output, {
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
      {
        filePath: 'c.txt',
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
        headSha: '76018072e09c5d31c8c6e3113b8aa0fe625195ca',
        indexSha: '76018072e09c5d31c8c6e3113b8aa0fe625195ca',
      },
      {
        filePath: 'e.txt',
        stagedStatus: 'A',
        unstagedStatus: 'M',
        submodule: {
          isSubmodule: false
        },
        fileModes: {
          head: '000000',
          index: '100644',
          worktree: '100644',
        },
        headSha: '0000000000000000000000000000000000000000',
        indexSha: '78df5b06bd324da777762461e147ff3e4c72fb1d',
      },
    ],
    untrackedEntries: [{filePath: 'd.txt'}],
    renamedEntries: [],
    unmergedEntries: [],
    ignoredEntries: [],
  })
})

exports.testUnmergedStatus = asyncTest(async function(test) {
  var str = nlToNul(dedent`
    # branch.oid 221202fafbed8259265ebca0fe0adc60c1cf650f
    # branch.head master
    # branch.upstream origin/master
    # branch.ab +0 -0
    u AA N... 000000 100644 100644 100644 0000000000000000000000000000000000000000 7b33a4a1507489727dbec491aad42d9429bff31c 257cc5642cb1a054f08cc83f2d943e56fd3ebe99 added-to-both.txt
    u UU N... 100644 100644 100644 100644 8e27be7d6154a1f68ea9160ef0e18691d20560dc 5b7855cabb3beb7216dd49e054b7fd7977720958 1353022d067e040a9105b87df71fc0dcf1317f7d modified-on-both-ours.txt
    u UU N... 100644 100644 100644 100644 8e27be7d6154a1f68ea9160ef0e18691d20560dc 5b7855cabb3beb7216dd49e054b7fd7977720958 1353022d067e040a9105b87df71fc0dcf1317f7d modified-on-both-theirs.txt
    u UD N... 100644 100644 000000 100644 8e27be7d6154a1f68ea9160ef0e18691d20560dc 257cc5642cb1a054f08cc83f2d943e56fd3ebe99 0000000000000000000000000000000000000000 removed-on-branch.txt
    u DU N... 100644 000000 100644 100644 8e27be7d6154a1f68ea9160ef0e18691d20560dc 0000000000000000000000000000000000000000 5716ca5987cbf97d6bb54920bea6adde242d87e6 removed-on-master.txt
  `)

  const output = await status.parse(str)
  assert.deepEqual(output, {
    branch: {
      oid: '221202fafbed8259265ebca0fe0adc60c1cf650f',
      head: 'master',
      upstream: 'origin/master',
      aheadBehind: { ahead: 0, behind: 0 }
    },
    changedEntries: [],
    untrackedEntries: [],
    renamedEntries: [],
    unmergedEntries: [
      {
        filePath: 'added-to-both.txt',
        stagedStatus: 'A',
        unstagedStatus: 'A',
        submodule: { isSubmodule: false },
        fileModes: {
          stage1: '000000',
          stage2: '100644',
          stage3: '100644',
          worktree: '100644',
        },
        stage1Sha: '0000000000000000000000000000000000000000',
        stage2Sha: '7b33a4a1507489727dbec491aad42d9429bff31c',
        stage3Sha: '257cc5642cb1a054f08cc83f2d943e56fd3ebe99'
      },
      {
        filePath: 'modified-on-both-ours.txt',
        stagedStatus: 'U',
        unstagedStatus: 'U',
        submodule: { isSubmodule: false },
        fileModes: {
          stage1: '100644',
          stage2: '100644',
          stage3: '100644',
          worktree: '100644',
        },
        stage1Sha: '8e27be7d6154a1f68ea9160ef0e18691d20560dc',
        stage2Sha: '5b7855cabb3beb7216dd49e054b7fd7977720958',
        stage3Sha: '1353022d067e040a9105b87df71fc0dcf1317f7d'
      },
      {
        filePath: 'modified-on-both-theirs.txt',
        stagedStatus: 'U',
        unstagedStatus: 'U',
        submodule: { isSubmodule: false },
        fileModes: {
          stage1: '100644',
          stage2: '100644',
          stage3: '100644',
          worktree: '100644',
        },
        stage1Sha: '8e27be7d6154a1f68ea9160ef0e18691d20560dc',
        stage2Sha: '5b7855cabb3beb7216dd49e054b7fd7977720958',
        stage3Sha: '1353022d067e040a9105b87df71fc0dcf1317f7d'
      },
      {
        filePath: 'removed-on-branch.txt',
        stagedStatus: 'U',
        unstagedStatus: 'D',
        submodule: { isSubmodule: false },
        fileModes: {
          stage1: '100644',
          stage2: '100644',
          stage3: '000000',
          worktree: '100644',
        },
        stage1Sha: '8e27be7d6154a1f68ea9160ef0e18691d20560dc',
        stage2Sha: '257cc5642cb1a054f08cc83f2d943e56fd3ebe99',
        stage3Sha: '0000000000000000000000000000000000000000'
      },
      {
        filePath: 'removed-on-master.txt',
        stagedStatus: 'D',
        unstagedStatus: 'U',
        submodule: { isSubmodule: false },
        fileModes: {
          stage1: '100644',
          stage2: '000000',
          stage3: '100644',
          worktree: '100644',
        },
        stage1Sha: '8e27be7d6154a1f68ea9160ef0e18691d20560dc',
        stage2Sha: '0000000000000000000000000000000000000000',
        stage3Sha: '5716ca5987cbf97d6bb54920bea6adde242d87e6'
      }
    ],
    ignoredEntries: []
  })
})

exports.testSubmoduleStatus = asyncTest(async function(test) {
  var str = nlToNul(dedent`
    # branch.oid 732682dccb2aacef477696f495afd0d03aa1e4d2
    # branch.head master
    # branch.upstream origin/master
    # branch.ab +2 -0
    1 .M SC.. 160000 160000 160000 50e370a322c9b4a22c6eb38be2f8320e31e084f7 50e370a322c9b4a22c6eb38be2f8320e31e084f7 check-yoself
    1 .M S.M. 160000 160000 160000 cb60ac4f2a3c5bc345d9770dc05d621ff0cf6ec7 cb60ac4f2a3c5bc345d9770dc05d621ff0cf6ec7 what-the-diff
  `)

  const output = await status.parse(str)
  assert.deepEqual(output, {
    branch: {
      oid: '732682dccb2aacef477696f495afd0d03aa1e4d2',
      head: 'master',
      upstream: 'origin/master',
      aheadBehind: { ahead: 2, behind: 0 }
    },
    changedEntries: [
      {
        filePath: 'check-yoself',
        stagedStatus: null,
        unstagedStatus: 'M',
        submodule: {
          isSubmodule: true,
          commitChanged: true,
          trackedChanges: false,
          untrackedChanges: false
        },
        fileModes: { head: '160000', index: '160000', worktree: '160000' },
        headSha: '50e370a322c9b4a22c6eb38be2f8320e31e084f7',
        indexSha: '50e370a322c9b4a22c6eb38be2f8320e31e084f7'
      },
      {
        filePath: 'what-the-diff',
        stagedStatus: null,
        unstagedStatus: 'M',
        submodule: {
          isSubmodule: true,
          commitChanged: false,
          trackedChanges: true,
          untrackedChanges: false
        },
        fileModes: { head: '160000', index: '160000', worktree: '160000' },
        headSha: 'cb60ac4f2a3c5bc345d9770dc05d621ff0cf6ec7',
        indexSha: 'cb60ac4f2a3c5bc345d9770dc05d621ff0cf6ec7'
      }
    ],
    untrackedEntries: [],
    renamedEntries: [],
    unmergedEntries: [],
    ignoredEntries: []
  });
})

exports.testRenameOrCopyStatus = asyncTest(async function(test) {
  var str = nlToNul(dedent`
    # branch.oid 9b48b861ea745c83e4b3895298f6b5a0c869e43a
    # branch.head master
    # branch.upstream origin/master
    # branch.ab +4 -15
    2 C. N... 000000 100644 100644 0000000000000000000000000000000000000000 954cae3b40d4e4c24733b6b593783c3280d73933 C100 a.txt\0copied-file.txt
    2 R. N... 100644 100644 100644 9591561840608d8af4384d52d4b915d0a52f357b 9591561840608d8af4384d52d4b915d0a52f357b R100 b.txt\0renamed-file.txt
  `)

  const output = await status.parse(str)
  assert.deepEqual(output, {
    branch: {
      oid: '9b48b861ea745c83e4b3895298f6b5a0c869e43a',
      head: 'master',
      upstream: 'origin/master',
      aheadBehind: { ahead: 4, behind: 15 }
    },
    changedEntries: [],
    untrackedEntries: [],
    renamedEntries: [
      {
        filePath: 'a.txt',
        origFilePath: 'copied-file.txt',
        stagedStatus: 'C',
        unstagedStatus: null,
        submodule: { isSubmodule: false },
        fileModes: { head: '000000', index: '100644', worktree: '100644' },
        headSha: '0000000000000000000000000000000000000000',
        indexSha: '954cae3b40d4e4c24733b6b593783c3280d73933',
        similarity: { type: 'C', score: 100 }
      },
      {
        filePath: 'b.txt',
        origFilePath: 'renamed-file.txt',
        stagedStatus: 'R',
        unstagedStatus: null,
        submodule: { isSubmodule: false },
        fileModes: { head: '100644', index: '100644', worktree: '100644' },
        headSha: '9591561840608d8af4384d52d4b915d0a52f357b',
        indexSha: '9591561840608d8af4384d52d4b915d0a52f357b',
        similarity: { type: 'R', score: 100 }
      }
    ],
    unmergedEntries: [],
    ignoredEntries: []
  })
})
