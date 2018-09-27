const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os')
class DirectoryTree {
	constructor(pathName, startDate) {
		this.startDate = startDate;
		const filesList = fs.readdirSync(pathName);
		this.pathName = pathName;
		const splitSign = os.type() == 'Linux' ? '/' : '\\'
		const pathSplitted = pathName.split(splitSign)
		this.dirName = pathSplitted[pathSplitted.length-1];
		this.fileNames = [];
		this.directories = [];
		filesList.forEach((name) => {
			const stats = fs.statSync(path.join(pathName,name));
			if (stats.isFile()) {
				this.fileNames.push(name);
				//console.log(stats);
			}
			else if (stats.isDirectory()) {
				this.directories.push(new DirectoryTree(path.join(pathName,name), startDate));
			}
		}); 
	}
	hasDirectory(dirName) {
		return this.directories.some((directory) => {
			return directory.dirName == dirName;
		})
	}
	getDirectory(dirName) {
		if (this.hasDirectory(dirName)) {
			let directory = null;
			let i = this.directories.length;
			while(!directory && i--) {
				if (this.directories[i].dirName == dirName) {
					directory = this.directories[i];
				}
			}
			return directory;
		}
		else {
			throw new Error(`Directory ${dirName} not extist in ${this.pathName}`);
		}
	}
	addDirectory(dirName) {
		this.directories.push(new DirectoryTree(path.join(this.pathName, dirName), this.startDate))
	}
	hasFile(fileName) {
		return this.fileNames.some((_fileName) => {
			return fileName == _fileName;
		})
	}
	addFile(fileName) {
		this.fileNames.push(fileName);
	}
	countFiles() {
		const result = {
			count: 0,
			weight: 0,
		}
		this.fileNames.forEach(fileName => {
			const info = fs.statSync(path.join(this.pathName, fileName));
			result.count++;
			result.weight+= info.size;
		})
		this.directories.forEach(directoryTree => {
			const subResult = directoryTree.countFiles();
			result.count += subResult.count;
			result.weight += subResult.weight;
		})
		return result;
	}
	compareTo(directoryTree, progressGuard) {
		this.directories.forEach(directory => {
			const dirName = directory.dirName;

			if (directoryTree.hasDirectory(dirName)) {
				directory.compareTo(directoryTree.getDirectory(dirName), progressGuard);
			}
			else {
				progressGuard.addFiles(directory.countFiles())
			}
			
		})
		this.fileNames.forEach(fileName => {
			if (!directoryTree.hasFile(fileName)) {
				const fileStats = fs.statSync(path.join(this.pathName, fileName));
				progressGuard.addFile(fileStats.size);
			}
			else {
				const fileStats = fs.statSync(path.join(this.pathName, fileName));
				const targetFileStats = fs.statSync(path.join(directoryTree.pathName, fileName));
				if ((new Date(fileStats.mtime)) < this.startDate && (new Date(targetFileStats.mtime) - new Date(fileStats.mtime))/1000 < -1) {
					progressGuard.addFile(fileStats.size);	
				}
			}
		})
	}
	copyTo(directoryTree, progressGuard) {
		this.directories.forEach(directory => {
			const dirName = directory.dirName;
			console.log(dirName, directoryTree.pathName)
			if (!directoryTree.hasDirectory(dirName)) {
				fs.mkdirSync(path.join(directoryTree.pathName, dirName));
				directoryTree.addDirectory(dirName);
			}
			directory.copyTo(directoryTree.getDirectory(dirName), progressGuard);
		})
		this.fileNames.forEach(fileName => {
			if (!directoryTree.hasFile(fileName)) {
				this.copyFile(fileName, directoryTree, progressGuard);
				directoryTree.addFile(fileName);
			}
			else {
				const fileStats = fs.statSync(path.join(this.pathName, fileName));
				const targetFileStats = fs.statSync(path.join(directoryTree.pathName, fileName));
				
				if ((new Date(fileStats.mtime)) < this.startDate && (new Date(targetFileStats.mtime) - new Date(fileStats.mtime))/1000 < -1) {
					this.copyFile(fileName, directoryTree, progressGuard);
					// console.log("from " + this.dirName + " to " + directoryTree.dirName);
					// console.log("  " + (new Date(targetFileStats.mtime) - new Date(fileStats.mtime)));
					// console.log("  " + (new Date(targetFileStats.mtime) + " " + new Date(fileStats.mtime)));
				
				}
			}
		})
	}
	copyFile(fileName, directoryTree, progressGuard) {
		try {
			const fileStats = fs.statSync(path.join(this.pathName, fileName));
			// can take a while ...
			const newFile = fs.readFileSync(path.join(this.pathName, fileName));
			fs.writeFileSync(path.join(directoryTree.pathName, fileName), newFile);
			

			fs.utimesSync(path.join(this.pathName, fileName), (new Date(fileStats.atime)).getTime()/1000, Date.now()/1000) // chagne modify time
			progressGuard.setFileComplete(fileStats.size);
		}
		catch(error) {
			progressGuard.addCopyFailure({
				filePath: {
					from : path.join(this.pathName, fileName),
					to : path.join(directoryTree.pathName, fileName),
				},
				reason: error.toString()
			})
		}
	}
	toString(tabs) {
		if (tabs == undefined) {
			tabs = 0;
		}
		let tabsString = '';
		let i = 0;
		while(i++ < tabs) {
			tabsString += ' ';
		}
		let string = `${tabsString}->/${this.dirName}:\n`;
		if (this.fileNames.length) {
			this.fileNames.forEach(fileName => {
				string += `${tabsString} - ${fileName}, \n`; 
			})
		}
		else {
			string += `${tabsString} - [EMPTY]\n`; 
		}
		this.directories.forEach(directory => {
			string += `${directory.toString(tabs+1)}`; 
		})
		return !tabs ? "###################\n" + string + "###################\n" : string;
	}
}

module.exports = DirectoryTree;