'use babel'
/* global atom */

import { CompositeDisposable, BufferedProcess, Point } from 'atom'
import { diffWordsWithSpace } from 'diff'

let disposables = null

export function activate () {
  disposables = new CompositeDisposable()

  const reasonTarget = 'atom-text-editor[data-grammar="source reason"]'
  const ocamlTarget = 'atom-text-editor[data-grammar="source ocaml"]'

  disposables.add(
    atom.commands.add(reasonTarget, {
      'reason-refmt:format': () => format()
    })
  )

  disposables.add(
    atom.commands.add(`${reasonTarget}, ${ocamlTarget}`, {
      'reason-refmt:convert-file': () => convertFile(),
      'reason-refmt:convert-to-reason': () => convertSelection('ml', 're'),
      'reason-refmt:convert-to-ocaml': () => convertSelection('re', 'ml')
    })
  )

  disposables.add(
    atom.workspace.observeTextEditors(editor => {
      let onSaveDisposable = null
      disposables.add(
        editor.observeGrammar(grammar => {
          if (grammar.scopeName === 'source.reason') {
            atom.config.observe('reason-refmt.formatOnSave', onSave => {
              if (onSaveDisposable) onSaveDisposable.dispose()
              if (onSave) {
                onSaveDisposable = editor.getBuffer().onWillSave(() => format(editor))
                disposables.add(onSaveDisposable)
              }
            })
          } else if (onSaveDisposable) onSaveDisposable.dispose()
        })
      )
    })
  )
}

export function deactivate () {
  disposables.dispose()
}

function refmt (editor, text, parse = 're', format = 're', silent = false) {
  const command = atom.config.get('reason-refmt.refmtPath')
  const width = atom.config.get('editor.preferredLineLength')
  const isInterface =
    editor.getPath() && editor.getPath().match(/\.(re|ml)i$/) != null
  const args = [
    `--interface=${isInterface}`,
    `--print=${format}`,
    `--parse=${parse}`,
    `--print-width=${width}`
  ]
  return new Promise((resolve, reject) => {
    const out = []
    const err = []
    const stdout = content => out.push(content)
    const stderr = content => err.push(content)
    function exit (code) {
      if (code) {
        if (silent) {
          reject(err.join(''))
        } else {
          atom.notifications.addWarning(err.join(''))
        }
      } else {
        resolve(out.join(''))
      }
    }
    const bp = new BufferedProcess({ command, args, stdout, stderr, exit })
    bp.process.stdin.write(text)
    bp.process.stdin.end()
  })
}

async function format (editor) {
  editor = editor || atom.workspace.getActiveTextEditor()
  const text = await refmt(editor, editor.getText())
  setText(editor, text)
}

async function convertFile () {
  let editor = atom.workspace.getActiveTextEditor()
  const m = editor.getPath() && editor.getPath().match(/^(.*)\.(ml|re)(i?)$/)
  if (m) {
    const parse = m[2]
    const print = parse === 'ml' ? 're' : 'ml'
    const text = await refmt(editor, editor.getText(), parse, print)
    editor = await atom.workspace.open(`${m[1]}.${print}${m[3]}`)
    editor.setText(text)
  } else {
    atom.notifications.addError('Unrecognized extension')
  }
}

function convertSelection (parse, print) {
  let editor = atom.workspace.getActiveTextEditor()
  editor.mutateSelectedText(async selection => {
    const text = await refmt(editor, selection.getText(), parse, print)
    selection.insertText(text, { autoscroll: false, select: true })
  })
}

function diff (original, text, edit) {
  let pos = new Point(0, 0)
  for (let { value, added, removed } of diffWordsWithSpace(original, text)) {
    const m = value.match(/\r\n|\n|\r/g)
    const row = m ? m.length : 0

    const newlineIndex = Math.max(
      value.lastIndexOf('\n'),
      value.lastIndexOf('\r')
    )
    const col = value.length - newlineIndex - 1

    const endPos = pos.traverse([row, col])

    if (added) {
      edit([pos, pos], value)
      pos = endPos
    } else if (removed) {
      edit([pos, endPos], '')
    } else {
      pos = endPos
    }
  }
}

function setText (editor, text) {
  editor.transact(() =>
    diff(editor.getText(), text, (range, text) => {
      editor.setTextInBufferRange(range, text, { normalizeLineEndings: false })
    })
  )
}

export function provideLinter () {
  return {
    name: 'Reason Refmt',
    scope: 'file',
    lintsOnChange: true,
    grammarScopes: ['source.reason'],
    async lint (editor) {
      const messages = []
      if (atom.config.get('reason-refmt.useLinter')) {
        try {
          const text = await refmt(editor, editor.getText(), 're', 're', true)
          diff(editor.getText(), text, range => {
            if (range[0] !== range[1]) {
              messages.push({
                location: {
                  file: editor.getPath(),
                  position: range
                },
                excerpt: 'Wrong formatting',
                severity: 'info'
              })
            }
          })
        } catch (message) {
          const m = message.match(
            /^File ".*?", line (\d+), characters (\d+)-(\d+):\r?\nError: (\d+): ([\s\S]+)$/
          )
          if (m) {
            messages.push({
              location: {
                file: editor.getPath(),
                position: [
                  [parseInt(m[1] - 1), parseInt(m[2])],
                  [parseInt(m[1] - 1), parseInt(m[3])]
                ]
              },
              excerpt: `Error ${m[4]}`,
              severity: 'error',
              description: m[5]
            })
          }
        }
      }
      return messages
    }
  }
}
