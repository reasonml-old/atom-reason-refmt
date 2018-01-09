# reason-refmt

_Use [refmt] to format your Reason code in Atom._

[refmt]: https://reasonml.github.io/guide/editor-tools/global-installation/#recommended-through-npmyarn


## Features

* Format on save
* Report formatting and syntax errors on the fly with [linter]
* Convert between Reason and Ocaml code

[linter]: https://atom.io/packages/linter


## Usage

No default keybindings are provided, but they can be configured in your keymap.

| Command                          | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `reason-refmt:format`            | Format the active Reason file                      |
| `reason-refmt:convert-file`      | Convert a file from Reason to OCaml and vice versa |
| `reason-refmt:convert-to-reason` | Convert the selection from OCaml to Reason         |
| `reason-refmt:convert-to-ocaml`  | Convert the selection from Reason to OCaml         |


## Installation

This package requires [language-reason] and [refmt]. For autocompletion, linting and other features, [ocaml-merlin] is recommended.

```sh
apm install language-reason reason-refmt ocaml-merlin linter
```

[language-reason]: https://atom.io/packages/language-reason
[refmt]: https://reasonml.github.io/guide/editor-tools/global-installation/#recommended-through-npmyarn
[ocaml-merlin]: https://atom.io/packages/ocaml-merlin

## Development

To start hacking on this package, run:

```
$ apm dev reason-refmt
```

This clones the git repo into `~/.atom/dev/packages/reason-refmt`, and installs it as as packge into Atom as a Development Package. To begin development, start editing the package code:

```
$ atom ~/.atom/dev/packages/reason-refmt
```

When you make changes, be sure to call up the Command Palette and reload the editor to see your changes with `Window: Reload`.
