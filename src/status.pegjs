{
  function processChangedEntry(entry) {
    return {
      filePath: entry.path,
      stagedStatus: entry.xy.staged,
      unstagedStatus: entry.xy.unstaged,
      submodule: entry.sub,
      fileModes: {
        head: entry.head_mode,
        index: entry.index_mode,
        worktree: entry.worktree_mode,
      },
      headSha: entry.head_sha,
      indexSha: entry.index_sha,
    }
  }

  function postProcess(parts) {
    const branch = {}
    const changedEntries = []
    const untrackedEntries = []

    parts.forEach(part => {
      switch (part.type) {
      case 'branch_header':
        Object.assign(branch, part.data)
        break;
      case 'changed':
        processChangedEntry(part.data) // TOOD
        break;
      }



      // { xy: { staged: 'M', unstaged: 'M' },
      //  sub: { isSubmodule: false },
      //  head_mode: '100644',
      //  index_mode: '100644',
      //  worktree_mode: '100644',
      //  head_sha: '257cc5642cb1a054f08cc83f2d943e56fd3ebe99',
      //  index_sha: 'c9f54222977c93ea17ba4a5a53c611fa7f1aaf56',
      //  path: 'a.txt' },
      // const type = parts.type;
      // if (type === 'header') {
      //
      // } else if (type === 'changed') {
      //
      // } else if (type === 'untracked') {
      //
      // }
    })

    return {
      branch: branch,
      changedEntries: changedEntries,
      untrackedEntries: untrackedEntries
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
  = '# branch.ab +' ahead:NUMBER ' -' behind:NUMBER { return { ahead_behind: { ahead: ahead, behind: behind } } }
  / '# branch.' key:TEXT_NO_SPACES ' ' value:TEXT {
    var o = {}
    o[key] = value
    return o
  }

generic_header
  = '# ' content:TEXT { return { text: text } }

changed_entry
  = '1 ' xy:xy ' ' sub:submodule ' ' head_mode:mode ' ' index_mode:mode ' ' worktree_mode:mode ' '
         head_sha:sha ' ' index_sha:sha ' ' path:TEXT {
    return { xy, sub, head_mode, index_mode, worktree_mode, head_sha, index_sha, path }
  }

renamed_or_copied_entry
  = '2 ' xy:xy ' ' sub:submodule ' ' head_mode:mode ' ' index_mode:mode ' ' worktree_mode:mode ' '
         head_sha:sha ' ' index_sha:sha ' ' rename_or_copy_score:($ [RC] NUMBER) ' '
         path:TEXT NULL origPath:TEXT {
    return { xy, sub, head_mode, index_mode, worktree_mode, head_sha, index_sha, rename_or_copy_score, path, origPath }
  }

unmerged_entry
  = 'u ' xy:xy ' ' sub:submodule ' ' stage1_mode:mode ' ' stage2_mode:mode ' ' stage3_mode:mode ' '
         worktree_mode:mode ' ' stage1_sha:sha ' ' stage2_sha:sha ' ' stage3_sha:sha ' ' path:TEXT {
    return { xy, sub, stage1_mode, stage2_mode, stage3_mode, worktree_mode, stage1_sha, stage2_sha, stage3_sha, path }
  }

untracked_entry
  = '? ' path:TEXT { return { path } }

ignored_entry
  = '! ' path:TEXT { return { path } }

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
