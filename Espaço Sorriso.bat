@echo off
setlocal

:: Defina o caminho do projeto aqui (se vazio, usa a pasta do script)
set "PROJECT_PATH="

if defined PROJECT_PATH (
    echo Usando projeto em: %PROJECT_PATH%
    cd /d "%PROJECT_PATH%"
) else (
    echo Usando pasta do script: %~dp0
    cd /d "%~dp0"
)

:: Abre o navegador no localhost:3000
start http://localhost:3000

:: Inicia o projeto
npm run start