{
  function processChangedEntry(entry) {
    return {
      filePath: entry.filePath,
      stagedStatus: entry.xy.staged === '.' ? null : entry.xy.staged,
      unstagedStatus: entry.xy.unstaged === '.' ? null : entry.xy.unstaged,
      submodule: entry.submodule,
      fileModes: {
        head: entry.headMode,
        index: entry.indexMode,
        worktree: entry.worktreeMode,
      },
      headSha: entry.headSha,
      indexSha: entry.indexSha,
    }
  }

  function processUnmergedEntry(entry) {
    return {
      filePath: entry.filePath,
      stagedStatus: entry.xy.staged,
      unstagedStatus: entry.xy.unstaged,
      submodule: entry.submodule,
      fileModes: {
        stage1: entry.stage1Mode,
        stage2: entry.stage2Mode,
        stage3: entry.stage3Mode,
        worktree: entry.worktreeMode,
      },
      stage1Sha: entry.stage1Sha,
      stage2Sha: entry.stage2Sha,
      stage3Sha: entry.stage3Sha,
    }
  }

  function processRenamedOrCopiedEntry(entry) {
    return {
      filePath: entry.filePath,
      origFilePath: entry.origFilePath,
      stagedStatus: entry.xy.staged === '.' ? null : entry.xy.staged,
      unstagedStatus: entry.xy.unstaged === '.' ? null : entry.xy.unstaged,
      submodule: entry.submodule,
      fileModes: {
        head: entry.headMode,
        index: entry.indexMode,
        worktree: entry.worktreeMode,
      },
      headSha: entry.headSha,
      indexSha: entry.indexSha,
      similarity: {
        type: entry.renameOrCopyScore[0],
        score: entry.renameOrCopyScore[1]
      }
    }
  }

  function postProcess(parts) {
    const branch = {}
    const changedEntries = []
    const untrackedEntries = []
    const renamedEntries = []
    const unmergedEntries = []
    const ignoredEntries = []

    parts.forEach(part => {
      switch (part.type) {
        case 'branch_header':
          Object.assign(branch, part.data)
          break;
        case 'changed':
          changedEntries.push(processChangedEntry(part.data)) // TOOD
          break;
        case 'untracked':
          untrackedEntries.push(part.data)
          break;
        case 'unmerged':
          unmergedEntries.push(processUnmergedEntry(part.data))
          break;
        case 'rename_or_copy':
          renamedEntries.push(processRenamedOrCopiedEntry(part.data))
          break;
        case 'ignored':
          ignoredEntries.push(part.data)
          break;
        default:
          throw new Error(`Invalid status entry type: ${part.type}`)
      }
    })

    return {
      branch: branch,
      changedEntries: changedEntries,
      untrackedEntries: untrackedEntries,
      renamedEntries: renamedEntries,
      unmergedEntries: unmergedEntries,
      ignoredEntries: ignoredEntries,
    }
  }
}

status
  = parts:(part:part NULL { return part})* EOF { return postProcess(parts) }

part
  = header:branch_header          { return { type: 'branch_header', data: header } }
  / header:generic_header         { return { type: 'generic_header', data: header } }
  / entry:changed_entry           { return { type: 'changed', data: entry } }
  / entry:renamed_or_copied_entry { return { type: 'rename_or_copy', data: entry } }
  / entry:unmerged_entry          { return { type: 'unmerged', data: entry } }
  / entry:untracked_entry         { return { type: 'untracked', data: entry } }
  / entry:ignored_entry           { return { type: 'ignored', data: entry } }

branch_header
  = '# branch.ab +' ahead:NUMBER ' -' behind:NUMBER { return { aheadBehind: { ahead: ahead, behind: behind } } }
  / '# branch.' key:TEXT_NO_SPACES ' ' value:TEXT {
    var o = {}
    o[key] = value
    return o
  }

generic_header
  = '# ' content:TEXT { return { text: text } }

changed_entry
  = '1 ' xy:xy ' ' submodule:submodule ' ' headMode:mode ' ' indexMode:mode ' ' worktreeMode:mode ' '
         headSha:sha ' ' indexSha:sha ' ' filePath:TEXT {
    return { xy, submodule, headMode, indexMode, worktreeMode, headSha, indexSha, filePath }
  }

renamed_or_copied_entry
  = '2 ' xy:xy ' ' submodule:submodule ' ' headMode:mode ' ' indexMode:mode ' ' worktreeMode:mode ' '
         headSha:sha ' ' indexSha:sha ' ' renameOrCopyScore:($ [RC] NUMBER) ' '
         filePath:TEXT NULL origFilePath:TEXT {
    return { xy, submodule, headMode, indexMode, worktreeMode, headSha, indexSha, renameOrCopyScore, filePath, origFilePath }
  }

unmerged_entry
  = 'u ' xy:xy ' ' submodule:submodule ' ' stage1Mode:mode ' ' stage2Mode:mode ' ' stage3Mode:mode ' '
         worktreeMode:mode ' ' stage1Sha:sha ' ' stage2Sha:sha ' ' stage3Sha:sha ' ' filePath:TEXT {
    return { xy, submodule, stage1Mode, stage2Mode, stage3Mode, worktreeMode, stage1Sha, stage2Sha, stage3Sha, filePath }
  }

untracked_entry
  = '? ' filePath:TEXT { return { filePath } }

ignored_entry
  = '! ' filePath:TEXT { return { filePath } }

xy
  = [.MADRCU]+ { return { staged: text()[0], unstaged: text()[1] } }

submodule
  = 'N...' { return { isSubmodule: false } }
  / 'S' [.C] [.M] [.U] {
    return {
      isSubmodule: true,
      commitChanged: text()[1] !== '.',
      trackedChnages: text()[2] !== '.',
      untrackedChanges: text()[3] !== '.'
    }
  }

mode = $ OCTAL+
sha = $ HEX+

EOF = !.
NULL = '\0'
TEXT = $ [^\0]+
TEXT_NO_SPACES = $ [^ \0]+
HEX = [0-9a-f]i
OCTAL = [0-7]
NUMBER = [0-9]+ { return parseInt(text(), 10) }
