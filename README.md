# reason-refmt

_Use [refmt] to format your Reason code in Atom._

[refmt]: https://facebook.github.io/reason/tools.html#refmt


## Features

* Format on save
* Report formatting errors on the fly with [linter]
* Convert between Reason and Ocaml code

[linter]: https://atom.io/packages/linter


## Usage

No default keybindings are provided, but they can be configured in your keymap.

| Command                          | Description                            |
| -------------------------------- | -------------------------------------- |
| `reason-refmt:format`            | Format the active file                 |
| `reason-refmt:convert-to-reason` | Convert an OCaml file to a Reason file |
| `reason-refmt:convert-to-ocaml`  | Convert a Reason file to an OCaml file |


## Installation

This package requires [language-reason] and [refmt]. For autocompletion, linting and other features, [ocaml-merlin] is recommended.

```sh
apm install language-reason reason-refmt ocaml-merlin linter
opam install reason merlin
```

[language-reason]: https://atom.io/packages/language-reason
[refmt]: https://facebook.github.io/reason/tools.html#refmt
[ocaml-merlin]: https://atom.io/packages/ocaml-merlin
