@echo off
setlocal

echo Executando build...
npm run build
if %errorlevel% neq 0 (
    echo Erro no npm run build.
    pause
    exit /b 1
)

echo Build concluida com sucesso.
pause
endlocal