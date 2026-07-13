@echo off
title Sistema POS - Pastelería
echo ========================================
echo  🍰 PASTELERÍA DONDE FER - SISTEMA POS
echo ========================================
echo.
echo Iniciando servidor...

REM Verificar si PHP está instalado
php -v >nul 2>&1
if errorlevel 1 (
    echo ❌ PHP no encontrado. Abriendo en modo local...
    start index.html
    exit
)

REM Iniciar servidor PHP
start /B php -S localhost:8000

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Abrir navegador
start http://localhost:8000

echo.
echo ✅ Servidor iniciado en: http://localhost:8000
echo 📌 Presiona Ctrl+C para detener el servidor
echo.

pause