import { getPrinter } from './printer.js';

const init = async () => {
  const p = await getPrinter('printer1');
  
  const o = await p.getOnlineStatus();
  console.log('o', o);

  const q = await p.getJobs();
  console.log('q', q);

  const x = await p.cancelAllJobs();
  console.log('x', x);
};

init();
