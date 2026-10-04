type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string, ...args: any[]): string {
  const ts = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') : '';
  return `[${ts}] [${level.toUpperCase()}]: ${message}${formattedArgs}`;
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(formatMessage('info', message, ...args));
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(formatMessage('warn', message, ...args));
  },
  error: (message: string, ...args: any[]) => {
    console.error(formatMessage('error', message, ...args));
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage('debug', message, ...args));
    }
  },
};