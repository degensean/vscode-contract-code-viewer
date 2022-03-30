// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import { parse } from "node-html-parser";
import * as path from 'path';
import * as fs from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
			const urlRegPattern = /^(https:\/\/(etherscan\.io|polygonscan.com)\/address\/(0x[a-zA-Z0-9]{40}))(#[a-zA-Z]*)?/gs;
			const urlMatches = urlRegPattern.exec(url);
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
	
	const addressUrl = urlMatches[1];
	const domainName = urlMatches[2];
	const contractAddr = urlMatches[3];

	const axiosInstance = axios.create();
	const reqUrl = `${addressUrl}#code`;
	axiosInstance.get(reqUrl).then((res) => {
		const root = parse(res.data);
		const contractNameNode = root.querySelector("div.row.mx-gutters-lg-1.mb-5");
		if (contractNameNode === null) {
            vscode.window.showErrorMessage('Error: Contract is not verified.');
            return;
        } 
		const dividcode = root.getElementById("dividcode");
		const fileTitles = dividcode.querySelectorAll(".text-secondary");
		const contractNameList = contractNameNode!.childNodes[1].childNodes[1].text.split('\n').filter(element => {
			return element !== '';
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
			const regexPattern = /File \d+ of \d+ : \w+.sol/gs;
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

		let network: string = "Unknown";
		if (domainName === 'etherscan.io') {
			network = "Ethereum Main";
		} 
		else if (domainName === 'polygonscan.com') {
			network = "Polygon Main";
		}
		const contractInfo = {
			"contractAddress": contractAddr,
			"network": network,
			"explorerURL": addressUrl
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
	.catch( err => {
		vscode.window.showErrorMessage(err);
		return;
	});
}


// this method is called when your extension is deactivated
export function deactivate() {}
