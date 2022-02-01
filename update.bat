@echo off
echo Updating...
git stash
git pull
git stash pop
echo Installing...
npm install
echo Done!
pause