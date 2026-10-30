@echo off
chcp 65001 >nul
title Portal del Curso: Dropshipping High-Ticket Bilingue (EE. UU.)
echo =====================================================================
echo   INICIANDO PORTAL DEL CURSO HIGH-TICKET DROPSHIPPING (EE. UU.)
echo =====================================================================
echo.
echo Abriendo tu navegador en: http://localhost:8080
echo (Manten esta ventana abierta mientras estudias; cierrala al terminar)
echo.
start "" "http://localhost:8080"
python -m http.server 8080 || py -m http.server 8080
pause
