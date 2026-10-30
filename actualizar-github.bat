@echo off
chcp 65001 >nul
title Actualizar Curso en GitHub y GitHub Pages
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%LOCALAPPDATA%\Programs\gh\bin;%PATH%"
echo =====================================================================
echo   SUBIENDO CAMBIOS Y NUEVAS LECCIONES A TU CUENTA DE GITHUB
echo =====================================================================
echo.
gh auth setup-git
git add -A
git commit -m "Actualizacion de lecciones y contenido del curso"
git push origin main
echo.
echo =====================================================================
echo   LISTO! En 1 minuto se actualizara tu portal en:
echo   https://cjavier1980-ux.github.io/curso-dropshipping-highticket/
echo =====================================================================
pause
