const fs = require('fs');
const path = require('path');
DirectoryTree = require("./DirectoryTree");
ProgressGuard = require("./ProgressGuard");

const progressGuard = new ProgressGuard();
const startDate = new Date();
const directories = process.argv.slice(2).map((path) => {
	return new DirectoryTree(path, startDate);
})

if (directories.length > 1) {
	directories.forEach(dir1 => {
		directories.forEach(dir2 => {
			if (dir1 != dir2) {
				dir1.compareTo(dir2, progressGuard);
			}
		})
	})
	progressGuard.printProgress();
	directories.forEach(dir1 => {
		directories.forEach(dir2 => {
			if (dir1 != dir2) {
				//console.log("BEFORE", dir2.toString());
				dir1.copyTo(dir2, progressGuard);
				//console.log("AFTER", dir2.toString());
			}
		})
	})
	progressGuard.printErrors();
}
else if (directories.length == 1) {
	console.warn("Just one directory specified");
	console.log(directories[0].toString());
}
else {
	console.error("No directories specified");
}

