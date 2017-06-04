'use babel'

import {CompositeDisposable, BufferedProcess, Point} from 'atom'
import {diffWordsWithSpace} from 'diff'

let disposables = null

export function activate () {
  disposables = new CompositeDisposable()

  disposables.add(atom.commands.add(
    'atom-text-editor[data-grammar="source reason"]', {
      'reason-refmt:format': () => format(),
      'reason-refmt:convert-to-ocaml': () => convertToOCaml()
    }
  ))

  disposables.add(atom.commands.add(
    'atom-text-editor[data-grammar="source ocaml"]', {
      'reason-refmt:convert-to-reason': () => convertToReason()
    }
  ))

  disposables.add(atom.workspace.observeTextEditors((editor) => {
    let onSaveDisposable = null
    disposables.add(editor.observeGrammar((grammar) => {
      if (grammar.scopeName === 'source.reason') {
        atom.config.observe('reason-refmt.formatOnSave', (onSave) => {
          if (onSaveDisposable) onSaveDisposable.dispose()
          if (onSave) {
            onSaveDisposable = editor.onDidSave(() => format(editor))
            disposables.add(onSaveDisposable)
          }
        })
      } else if (onSaveDisposable) onSaveDisposable.dispose()
    }))
  }))
}

export function deactivate () {
  disposables.dispose()
}

function refmt (editor, parse = 're', format = 're') {
  const command = atom.config.get('reason-refmt.refmtPath')
  const rei = (editor.getPath() && editor.getPath().endsWith('.rei')) ? 'true' : 'false'
  const width = atom.config.get('reason-refmt.printWidth')
  const args = [`--interface=${rei}`, `--print=${format}`, `--parse=${parse}`, `--print-width=${width}`]
  return new Promise((resolve, reject) => {
    const out = []
    const err = []
    const stdout = (content) => out.push(content)
    const stderr = (content) => err.push(content)
    function exit (code) {
      if (code) {
        reject(err.join(''))
      } else {
        resolve(out.join(''))
      }
    }
    const bp = new BufferedProcess({command, args, stdout, stderr, exit})
    bp.process.stdin.write(editor.getText())
    bp.process.stdin.end()
  })
}

async function format (editor) {
  editor = editor || atom.workspace.getActiveTextEditor()
  try {
    const text = await refmt(editor)
    setText(editor, text)
  } catch (err) {
    const parsedError = parseRefmtError(err)
    if (!parsedError) {
      throw err
    }
  }
}

async function convertToReason () {
  let editor = atom.workspace.getActiveTextEditor()
  try {
    const text = await refmt(editor, 'ml', 're')
    const uri = editor.getPath() && editor.getPath().replace(/\.ml(i?)$/, '.re$1')
    editor = await atom.workspace.open(uri)
    editor.setText(text)
  } catch (err) {
    const parsedError = parseRefmtError(err)
    if (!parsedError) {
      throw err
    }
  }
}

async function convertToOCaml () {
  let editor = atom.workspace.getActiveTextEditor()
  try {
    const text = await refmt(editor, 're', 'ml')
  } catch (err) {
    const parsedError = parseRefmtError(err)
    if (!parsedError) {
      throw err
    }
  }
  const uri = editor.getPath() && editor.getPath().replace(/\.re(i?)$/, '.ml$1')
  editor = await atom.workspace.open(uri)
  editor.setText(text)
}

function diff (original, text, edit) {
  let pos = new Point(0, 0)
  for (let {value, added, removed} of diffWordsWithSpace(original, text)) {
    const m = value.match(/\r\n|\n|\r/g)
    const row = m ? m.length : 0

    const newlineIndex = Math.max(value.lastIndexOf('\n'), value.lastIndexOf('\r'))
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
  editor.transact(() => diff(editor.getText(), text, (range, text) => {
    editor.setTextInBufferRange(range, text, {normalizeLineEndings: false})
  }))
}

function parseRefmtError(error) {
  if (typeof error !== 'string') {
    return null
  }
  const match = error.match(/^File ".*?", line (\d+), characters (\d+)-(\d+):\n([\s\S]*)/)
  if (match) {
    const range = [
      [parseInt(match[1]) - 1, parseInt(match[2])],
      [parseInt(match[1]) - 1, parseInt(match[3])],
    ]
    return {
      text: match[4].trim(),
      range,
    };
  }
  return null
}

export function provideLinter () {
  return {
    name: 'refmt',
    scope: 'file',
    lintOnFly: true,
    grammarScopes: ['source.reason'],
    async lint (editor) {
      const messages = []
      if (atom.config.get('reason-refmt.useLinter')) {
        try {
          const text = await refmt(editor)
          diff(editor.getText(), text, (range) => {
            if (range[0] !== range[1]) {
              messages.push({
                type: 'Warning',
                text: 'Wrong formatting',
                range,
                filePath: editor.getPath()
              })
            }
          })
        } catch (err) {
          const parsedError = parseRefmtError(err)
          if (parsedError) {
            messages.push({
              type: 'Error',
              text: parsedError.text,
              range: parsedError.range,
              filePath: editor.getPath(),
            })
          } else {
            throw err
          }
        }
      }
      return messages
    }
  }
}
