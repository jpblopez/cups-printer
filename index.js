const { exec } = require('child_process');
const { getCompletedQueue, getNotCompletedQueue, cancelJob, cancelAllJobs, printFile } = require('node-cups');

export class Printer {
  url;
  os;
  registered = false;
  name;

  static hardwareStatus = {
    OK: 0,
    JAMMED: 1,
    LOW_INK: 2,
  };

  constructor(url, name, os = 'windows') {
    this.url = url;
    this.os = os;
    this.name = name;
  }

  _generateOSCommand(command) {
    const isWindows = os === 'windows';

    if (isWindows) return `wsl ${command}`;

    return command;
  }

  // returns false if printer is unreachable on the network, printer is on the network but is down
  // returns true otherwise
  getOnlineStatus() {
    return new Promise((resolve, reject) => {
      if (!this.registered) return reject(false);

      const { url } = this;

      const command = `ipptool ${url} get-jobs.test`;
      const osCommand = this._generateOSCommand(command);

      exec(osCommand, error => {
        if (error) {
          return resolve(false);
        }

        resolve(true);
      });
    });
  }

  async getJobs() {
    const completed = await getCompletedQueue();
    const notCompleted = await getNotCompletedQueue();

    return [...completed, ...notCompleted];
  }

  printFile(filePath) {
    const params = {
      printer: this.name,
    };

    return printFile(filePath, params);
  }

  cancelCurrentJob() {
    return new Promise((resolve, reject) => {
      if (!this.registered) return reject(false);

      const command = `lprm -p ${this.name}`;
      const osCommand = this._generateOSCommand(command);

      exec(osCommand, error => {
        if (error) {
          return reject(false);
        }

        resolve(true);
      });
    });
  }

  cancelOneJob(jobId) {
    return cancelJob(jobId);
  }

  cancelAllJobs() {
    return cancelAllJobs(this.name);
  }
}
