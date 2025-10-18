@echo off
echo Updating VU Clone repository...
echo.

echo Adding all changes...
git add .

echo.
set /p commit_message="Enter commit message: "
if "%commit_message%"=="" set commit_message="Update: Latest changes"

echo.
echo Committing changes...
git commit -m "%commit_message%"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo Repository updated successfully!
pause