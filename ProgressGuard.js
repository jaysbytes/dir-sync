class ProgressGuard {
	constructor() {
		this.totalBytes = 0;
		this.totalFiles = 0;
		this.completedBytes = 0;
		this.completedFiles = 0;
		this.failedToCopy = [];
	}
	addFile(bytes) {
		this.totalBytes+= bytes;
		this.totalFiles++;
	}
	addFiles(filesInfo) {
		this.totalBytes+= filesInfo.weight;
		this.totalFiles+= filesInfo.count;
	}
	setFileComplete(bytes) {
		this.completedBytes+= bytes;
		this.completedFiles++;
		this.printProgress();
	}
	addCopyFailure(error) {
		this.failedToCopy.push(error);
	}
	printErrors() {
		console.log("\nErrors: ", this.failedToCopy);
	}
	printProgress() {
		process.stdout.cursorTo(0, -1);
		process.stdout.clearScreenDown()
		
		const columns = process.stdout.columns;
		let progress = this.completedBytes/this.totalBytes;
		process.stdout.write(~~(progress*100) + "%" + "(" + this.completedFiles + ")" + " of " + this.totalFiles + '\n');
		progress = ~~(progress * columns);

		while(progress--) {
			process.stdout.write("#");
		}
	}
}

module.exports = ProgressGuard;