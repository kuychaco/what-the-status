var Readable = require('stream').Readable
var split = require('split')

var BRANCH_HEADER_REGEX  = /^branch\.(oid|head|upstream|ab) (.*)$/
var AHEAD_BEHIND_REGEX   = /^\+(\d+) -(\d+)$/
var CHANGED_REGEX        = /^([.MADRCU]{2}) ([NS][.C][.M][.U]) (\d+) (\d+) (\d+) ([0-9a-f]{40}) ([0-9a-f]{40}) (.*)$/
var RENAMED_COPIED_REGEX = /^([.MADRCU]{2}) ([NS][.C][.M][.U]) (\d+) (\d+) (\d+) ([0-9a-f]{40}) ([0-9a-f]{40}) ([RC]\d+) (.*)$/
var UNMERGED_REGEX       = /^([.MADRCU]{2}) ([NS][.C][.M][.U]) (\d+) (\d+) (\d+) (\d+) ([0-9a-f]{40}) ([0-9a-f]{40}) ([0-9a-f]{40}) (.*)$/

function parse(str, limit) {
  return new Promise(function (resolve, reject) {
    var count = 0
    var result = {
      branch: {
        aheadBehind: { ahead: null, behind: null }
      },
      changedEntries: [],
      untrackedEntries: [],
      renamedEntries: [],
      unmergedEntries: [],
      ignoredEntries: [],
    }
    var context = {
      inProgressRenameOrCopy: null,
    }

    var s = new Readable
    s.push(str)
    s.push(null)

    var resolved = false
    s.pipe(split('\000'))
      .on('data', function (line) {
        if (resolved || (limit && count > limit)) return
        try {
          var addedNewEntry = parseLine(line, result, context)
          if (addedNewEntry) count++
        } catch (err) {
          resolved || reject(err)
          resolved = true
        }
      })
      .on('error', function (err) {
        resolved || reject(err)
        resolved = true
      })
      .on('end', function() {
        resolved || resolve(result)
        resolved = true
      })
  })
}

function parseLine(line, result, context) {
  if (!line.length) return
  var first = line[0];
  var rest = line.substr(2)

  switch (first) {
    case '#':
      parseHeader(rest, result)
      return false
    case '1':
      parseChangedEntry(rest, result)
      return true
    case '2':
      var entry = parseRenamedOrCopiedEntry(rest, result)
      context.inProgressRenameOrCopy = {
        entry: entry
      }
      return false
    case 'u':
      parseUnmergedEntry(rest, result)
      return true
    case '?':
      parseUntrackedEntry(rest, result)
      return true
    case '!':
      parseIgnoredEntry(rest, result)
      return true
    default:
      if (context.inProgressRenameOrCopy) {
        context.inProgressRenameOrCopy.entry.origFilePath = line
        context.inProgressRenameOrCopy = null
        return true
      } else {
        throw new Error('Bad entry: ' + line)
      }
  }
}

function parseHeader(line, result) {
  var match = line.match(BRANCH_HEADER_REGEX)
  if (match) {
    var field = match[1]
    var data = match[2]
    if (field === 'ab') {
      field = 'aheadBehind'
      data = parseAheadBehind(data)
    }
    result.branch[field] = data
  } else {
    // unknown header; ignore
  }
}

function parseAheadBehind(ab) {
  var match = ab.match(AHEAD_BEHIND_REGEX)
  if (match) {
    return {
      ahead: parseInt(match[1], 10),
      behind: parseInt(match[2], 10)
    }
  } else {
    throw new Error('Invalid ahead/behind string: ' + ab)
  }
}

function parseChangedEntry(line, result) {
  var match = line.match(CHANGED_REGEX)

  var entry = {
    filePath: match[8],
    stagedStatus: match[1][0] === '.' ? null : match[1][0],
    unstagedStatus: match[1][1] === '.' ? null : match[1][1],
    submodule: {
      isSubmodule: match[2][0] === 'S'
    },
    fileModes: {
      head: match[3],
      index: match[4],
      worktree: match[5],
    },
    headSha: match[6],
    indexSha: match[7],
  }

  if (entry.submodule.isSubmodule) {
    Object.assign(entry.submodule, {
      commitChanged: match[2][1] !== '.',
      trackedChanges: match[2][2] !== '.',
      untrackedChanges: match[2][3] !== '.',
    })
  }

  result.changedEntries.push(entry)
  return entry
}

function parseRenamedOrCopiedEntry(line, result) {
  var match = line.match(RENAMED_COPIED_REGEX)

  var entry = {
    filePath: match[9],
    origFilePath: null,
    stagedStatus: match[1][0] === '.' ? null : match[1][0],
    unstagedStatus: match[1][1] === '.' ? null : match[1][1],
    submodule: {
      isSubmodule: match[2][0] === 'S'
    },
    fileModes: {
      head: match[3],
      index: match[4],
      worktree: match[5],
    },
    headSha: match[6],
    indexSha: match[7],
    similarity: {
      type: match[8][0],
      score: parseInt(match[8].substr(1), 10),
    },
  }

  if (entry.submodule.isSubmodule) {
    Object.assign(entry.submodule, {
      commitChanged: match[2][1] !== '.',
      trackedChanges: match[2][2] !== '.',
      untrackedChanges: match[2][3] !== '.',
    })
  }

  result.renamedEntries.push(entry)
  return entry
}

function parseUnmergedEntry(line, result) {
  var match = line.match(UNMERGED_REGEX)

  var entry = {
    filePath: match[10],
    stagedStatus: match[1][0] === '.' ? null : match[1][0],
    unstagedStatus: match[1][1] === '.' ? null : match[1][1],
    submodule: {
      isSubmodule: match[2][0] === 'S'
    },
    fileModes: {
      stage1: match[3],
      stage2: match[4],
      stage3: match[5],
      worktree: match[6],
    },
    stage1Sha: match[7],
    stage2Sha: match[8],
    stage3Sha: match[9],
  }

  if (entry.submodule.isSubmodule) {
    Object.assign(entry.submodule, {
      commitChanged: match[2][1] !== '.',
      trackedChanges: match[2][2] !== '.',
      untrackedChanges: match[2][3] !== '.',
    })
  }

  result.unmergedEntries.push(entry)
  return entry
}

function parseUntrackedEntry(line, result) {
  var entry = {
    filePath: line,
  }
  result.untrackedEntries.push(entry)
  return entry
}

function parseIgnoredEntry(line, result) {
  var entry = {
    filePath: line,
  }
  result.ignoredEntries.push(entry)
  return entry
}

module.exports = {
  parse: parse
}
