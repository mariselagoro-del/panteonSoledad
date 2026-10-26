@echo off
title Panteon La Soledad
cls
echo ============================================================
echo      SISTEMA DE GESTION CATASTRAL - PANTEON LA SOLEDAD
echo ============================================================
echo Iniciando el sistema en su ventana de escritorio...
echo.

if exist "%~dp0PanteonLaSoledad.exe" (
    start "" "%~dp0PanteonLaSoledad.exe"
    exit
)

if exist "PanteonLaSoledad.exe" (
    start "" "PanteonLaSoledad.exe"
    exit
)

echo ERROR: No se encontro PanteonLaSoledad.exe en este directorio.
pause
