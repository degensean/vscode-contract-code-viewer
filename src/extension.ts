// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import { parse } from "node-html-parser";
import * as path from 'path';
import * as fs from 'fs';

const domainToChain: {[key: string]: string} = require('../domainToChain.json');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {

	let getContractCodes = vscode.commands.registerCommand('contractCodeViewer.inputExplorerUrl', () => {
		const inputBoxOptions1 = {
			'ignoreFocusOut': true,
			'prompt': 'Enter URL to the contract on explorer (e.g., etherscan.io, polygonscan.com)',
		};
		const openDialogOptions = {
			"canSelectFiles": false,
			"canSelectFolders": true,
			"canSelectMany": false,
			"title": "Select a folder to save contract files"
		};

		vscode.window.showInputBox(inputBoxOptions1).then(url => {
			if (typeof url === 'undefined') {
				return;
			}
			let domainNames = Object.keys(domainToChain);
			const domainNameRegP = domainNames.join('|').replace('.', '\\.'); // etherscan\\.io|polygonscan\\.com
			const urlRegPattern = new RegExp(`^((https?:\\/\\/)?(${domainNameRegP})\\/(address|token)\\/(0x[a-zA-Z0-9]{40}))(#[a-zA-Z]*)?`, 'g');
			const urlMatches = urlRegPattern.exec(url);
			// For example, if `url` is https://bscscan.com/address/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d#code,
			// console.log(urlMatches) will print:
			// 0:'https://bscscan.com/address/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d#code'
			// 1:'https://bscscan.com/address/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
			// 2:'https://'
			// 3:'bscscan.com'
			// 4:'address'
			// 5:'0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
			// 6:'#code'
			if (urlMatches === null) {
				vscode.window.showErrorMessage('Error: Input URL is invalid.');
				return;
			}

			vscode.window.showOpenDialog(openDialogOptions).then(folderUri => {
				if (folderUri && folderUri[0]) {
					const selectedFolder = folderUri[0].fsPath;
					if (!fs.existsSync(selectedFolder)) {
						vscode.window.showErrorMessage(`Error: Directory ${selectedFolder} does not exist.`);
						return;
					}
					else {
						downloadCode(urlMatches, selectedFolder);
					}
				}
			});
		});
	});

	context.subscriptions.push(getContractCodes);
}


export function downloadCode(urlMatches: Array<string>, selectedFolder: string) {
	const domainName : string = urlMatches[3];
	const contractAddr = urlMatches[5];
	const axiosInstance = axios.create();
	const addressUrl = `https://${domainName}/address/${contractAddr}`;
	const reqUrl = `${addressUrl}/#code`;
	axiosInstance.get(reqUrl).then((res) => {
		const root = parse(res.data);
		const contractNameNode = root.querySelector("div.row.mx-gutters-lg-1.mb-5");
		if (contractNameNode === null) {
			vscode.window.showErrorMessage('Error: Contract is not verified.');
            return;
        }
		const fileTitlesSelector = domainName === 'etherscan.io' ? '.text-muted' : '.text-secondary';
		const dividcodeElem = root.getElementById("dividcode") ?? root.getElementById("code");
		const fileTitles = dividcodeElem.querySelectorAll(fileTitlesSelector);
		fileTitles.forEach(fileTitle => {
			console.log(fileTitle);
		});
		const contractNameList = contractNameNode!.childNodes[1].childNodes[1].text.split('\n').map(x => {
			return x.trim();
		}).filter(y => {
			return y !== '';
		});
		const contractName = contractNameList[contractNameList.length - 1];
		const dir = path.join(selectedFolder, contractName);
		if (fileTitles.length === 0) {
			const contractCode = root.getElementById(`editor`);
			if (contractCode) {
				if (!fs.existsSync(dir)){
					fs.mkdirSync(dir);
				}
				fs.writeFile(path.join(dir, `${contractName}.sol`), contractCode.text, err => {
					if (err) {
						console.error(err);
						return;
					}
				});
			}
			else {
				vscode.window.showErrorMessage('Error: Address is not a contract address');
				return;
			}
		}
		else {
			const regexPattern = /File \d+ of \d+ : \w+\.sol/;
			if (!fs.existsSync(dir)){
				fs.mkdirSync(dir);
			}
			var i = 0;
			fileTitles.forEach(fileTitle => {
				if (regexPattern.test(fileTitle.text)) {
					i += 1;
					const splitWords = fileTitle.text.split(' ');
					const filename = splitWords[splitWords.length - 1];
					const contractCode = root.getElementById(`editor${i}`).text;
					fs.writeFile(path.join(dir, filename), contractCode, err => {
						if (err) {
							console.error(err);
							return;
						}
					});
				}
			});
		}
		let blockchain = domainToChain[domainName];
		const contractInfo = {
			"contractAddress": contractAddr,
			"blockchain": blockchain,
			"explorerUrl": addressUrl
		};
		fs.writeFile(path.join(dir, 'contractInfo.json'), JSON.stringify(contractInfo, null, 4), err => {
			if (err) {
				console.error(err);
				return;
			}
		});

		const openFolder = "Open folder";
		vscode.window.showInformationMessage(`Contract files have been downloaded in ${dir}`, openFolder).then(selection => {
			if (selection === openFolder) {
				vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(dir));
			}
		});
	})
	.catch( error => {
		if (error.response) {
			// The request was made and the server responded with a status code
			// that falls out of the range of 2xx
			console.log(error.response.data);
			console.log('[Error] Response status', error.response.status);
			console.log(error.response.headers);
			vscode.window.showErrorMessage(`[Error] Response status code: ${error.response.status}`);
		  } else if (error.request) {
			// The request was made but no response was received
			// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
			// http.ClientRequest in node.js
			console.log(error.request);
			vscode.window.showErrorMessage(`[Error] No response was received`);
		} else {
			// Something happened in setting up the request that triggered an Error
			console.log('Error', error.message);
			vscode.window.showErrorMessage(`[Error] ${error.message}`);
		  }
		  console.log(error.config);
		return;
	});
}


// this method is called when your extension is deactivated
export function deactivate() {}
