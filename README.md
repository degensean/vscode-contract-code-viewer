# Contract code viewer: Fastest way to download contract code

Contract Code Viewer is a VS Code extension that allows you to download contract codes from various blockchain explorers and view them locally. This is useful for developers who want to inspect the source code of smart contracts deployed on different blockchains.

## Features

![Feature](images/feature1.gif)

Contract Code Viewer supports downloading contract codes from the following blockchain explorers (as of 2023-03-03):

| Blockchain Explorer                                        | Availability |
|------------------------------------------------------------|:------------:|
| [https://etherscan.io](https://etherscan.io)               |       ✔️      |
| [https://polygonscan.com](https://polygonscan.com)         |       ✔️      |
| [https://bscscan.com](https://bscscan.com)                 |       ✔️      |
| [https://ftmscan.com](https://ftmscan.com)                 |       ✔️      |
| [https://snowtrace.io](https://snowtrace.io)               |       ✔️      |
| [arbiscan.io](https://arbiscan.io)                         |       ✔️      |
| [optimistic.etherscan.io](https://optimistic.etherscan.io) |       ✔️      |

Some features that make Contract Code Viewer stand out are:

- It automatically detects the blockchain explorer based on the URL entered by the user
- It saves the contract files in a folder named after the contract address
- It can download single-file or multiple-files contract codes

## Usage

To use Contract Code Viewer, follow these steps:

1. Use the command `Contract Code Viewer: Enter URL to the contract on explorer`
2. Input a valid URL to a contract on any supported blockchain explorer
3. Select a folder where you want to save the contract files
4. Click on “Open folder” to view the contract codes

## Release Notes

### [1.1.7] - 2023-03-03
#### Fixed
- An issue with bscscan.

### [1.1.6] - 2023-03-03
#### New Features
- The extension can now download contract code from [arbiscan.io](https://arbiscan.io) and [optimistic.etherscan.io](https://optimistic.etherscan.io).
#### Fixed
- Fixed problem of contract downloading from [etherscan.io](https://etherscan.io).

## Acknowledgement

@DocRace for the logo.

## Feedback

If you have any feedback, please feel free to contact me. You are also welcome to chat about Crypto with me on Twitter.

[![Twitter URL](https://img.shields.io/twitter/url/https/twitter.com/ksdrian.svg?style=social&label=Follow%20%40ksdrian)](https://twitter.com/ksdrian) <a href="https://github.com/username"><img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width="20" height="20"></a>
