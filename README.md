# reason-refmt

_Use [refmt] to format your Reason code in Atom._

[refmt]: https://facebook.github.io/reason/tools.html#refmt


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
[refmt]: https://facebook.github.io/reason/tools.html#refmt
[ocaml-merlin]: https://atom.io/packages/ocaml-merlin
