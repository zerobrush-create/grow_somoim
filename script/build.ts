import { execSync } from 'node:child_process';

const run = (command: string) => {
  execSync(command, { stdio: 'inherit' });
};

run('npm --workspace shared run build');
run('npm --workspace client run build');
run('npm --workspace server run build');
