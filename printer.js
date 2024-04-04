import { exec } from 'child_process';
import { getCompletedQueue, getNotCompletedQueue, cancelJob, cancelAllJobs, printFile } from 'node-cups';

class Printer {
  url;
  os;
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
    const isWindows = this.os === 'windows';
    if (isWindows) return `wsl ${command}`;
    return command;
  }

  getOnlineStatus() {
    return new Promise((resolve, reject) => {
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

  cancelOneJob(jobId) {
    return cancelJob(jobId);
  }

  cancelAllJobs() {
    return cancelAllJobs(this.name);
  }
}

export const getPrinter = (name, os = 'linux') => {
  const isWindows = os === 'windows';

  return new Promise((resolve, reject) => {
    const command = `lpstat -p ${name}`;
    const osCommand = isWindows ? `wsl ${command}` : command;

    exec(osCommand, existError => {
      if (existError) {
        return reject('printer must be registered by the admin');
      }

      const options = `lpoptions -p ${name}`;
      const osOptions = isWindows ? `wsl ${options}` : options;

      exec(osOptions, (err, stdout) => {
        if (err) {
          return reject('printer must be registered by the admin');
        }

        try {
          const optionText = stdout.split(' ');
          const deviceUri = optionText[1].split('=')[1];

          const printer = new Printer(deviceUri, name, os);

          resolve(printer);
        } catch (error) {
          reject('error getting printer');
        }
      });
    });
  });
};
