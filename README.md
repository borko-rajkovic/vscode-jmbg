# JMBG Extension for Visual Studio Code

![Visual Studio Marketplace Installs - Azure DevOps Extension](https://img.shields.io/visual-studio-marketplace/azure-devops/installs/total/borko-rajkovic.vscode-jmbg)

A wrapper around [ts-jmbg](https://github.com/borko-rajkovic/ts-jmbg) for Visual Studio Code.
Quickly check of string is valid JMBG and generate random JMBG in multi-cursor selections.

## Features

### Sidebar - Validation

In sidebar there will be JMBG item that allows validation and decode of selected string from editor. It will run validation on selected text, or on word that is underneath the cursor if no selection is made.

![JMBG Sidebar Validation](https://raw.githubusercontent.com/borko-rajkovic/vscode-jmbg/main/images/sidebar-validate.gif)

If only one word is selected, the `vscode-jmbg.validate` will validate string. If there is no selection, `vscode-jmbg.validate` will take current cursor word and validate string:

### Command - Validation

![JMBG Validation](https://raw.githubusercontent.com/borko-rajkovic/vscode-jmbg/main/images/validate.gif)

For each multi-cursor selection `vscode-jmbg.generate-random` will insert new random generated JMBG:

### Command - Generate random JMBG

![Generate Random JMBG](https://raw.githubusercontent.com/borko-rajkovic/vscode-jmbg/main/images/generate-random.gif)

_Note:_ Please read the [documentation](https://code.visualstudio.com/Docs/editor/editingevolved) on how to use multiple cursors in Visual Studio Code.

## Install

Launch VS Code Quick Open (Ctrl/Cmd+P), paste the following command, and press enter.

```sh
ext install jmbg
```

## Commands

- `vscode-jmbg.validate`: Validate JMBG: Checks if selection is valid JMBG
- `vscode-jmbg.generate-random`: Generate random: Inserts random generated JMBG on each selection (multiple cursors can be used)

<table>
  <tr>
    <th colspan="2">Highlight Word Settings</th>
  </tr>

  <tr align="left">
    <th>Name</th>
    <th>Description</th>
  </tr>

  <tr>
    <td><code>vscode-jmbg.borderColor</code></td>
    <td>Specifies the border color used & is changable to any valid CSS color value. For example here are a list of valid values: `'red'`, `'#FFF'` `'#FFFFFFF'`, `'RGB(255,255,255)'`, `'RGB(255, 255, 255. 0.5)'`</td>
  </tr>
  <tr>
    <td><code>vscode-jmbg.borderWidth</code></td>
    <td>Specifies the width of the border in pixels For example: `'2px'`</></td>
  </tr>
  <tr>
    <td><code>vscode-jmbg.borderStyle</code></td>
    <td>Specifies the border style of the line. For example, here a a list of valid values: `solid`, `dashed`, `inset`, `double`, `groove`, `outset`, `ridge`</td>
  </tr>
  </table>

## Thank You

> Thanks checking out my extension! Check out my other projects on [github](https://github.com/borko-rajkovic) or [create an issue](https://github.com/borko-rajkovic/vscode-jmbg/issues)!
