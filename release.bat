@echo off
setlocal

:: Read version from package.json
for /f "tokens=2 delims=:," %%a in ('findstr "version" package.json ^| findstr /v "electron\|vite\|node\|react\|typescript\|tailwind\|remark\|discord\|lucide\|@"') do (
    set RAW=%%a
)

:: Clean whitespace/quotes
set VERSION=%RAW: =%
set VERSION=%VERSION:"=%
set VERSION=%VERSION:,=%

echo Version found: %VERSION%
set TAG=v%VERSION%
echo Creating tag: %TAG%

git add .
git commit -m "chore: release %TAG%"
git tag %TAG%
git push
git push origin %TAG%

echo.
echo ==========================================
echo  Tag %TAG% pushed to GitHub!
echo  GitHub Actions will now automatically:
echo   1. Build the Windows installer
echo   2. Create a public Release at:
echo      https://github.com/NyxDevidk/LowWrite/releases
echo ==========================================
pause
