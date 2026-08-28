@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\.bin\prisma.cmd" (
  echo Backend dependencies are missing. Run npm install first.
  exit /b 1
)

call "node_modules\.bin\prisma.cmd" dev --name workroom --detach || exit /b 1
call "node_modules\.bin\prisma.cmd" generate || exit /b 1
call "node_modules\.bin\prisma.cmd" db push --skip-generate || exit /b 1
call "node_modules\.bin\tsc.cmd" prisma\seed.ts --outDir dist-seed --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop --skipLibCheck || exit /b 1
node "dist-seed\seed.js" || exit /b 1
call "node_modules\.bin\tsc.cmd" || exit /b 1

echo WorkRoom Backend is starting at http://localhost:4000
node "dist\server.js"
