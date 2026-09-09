<# :
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression (Get-Content '%~f0' -Raw)"
pause
exit /b %ERRORLEVEL%
#>

$rootDir = Get-Location
$outputFile = Join-Path $rootDir "full_source_code.txt"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " VaidyaSetu Source Code Bundler" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Target output file: $outputFile`n" -ForegroundColor Yellow

if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
}

# Directories to exclude
$excludedDirs = @(
    'node_modules',
    '.git',
    'dist',
    'build',
    'uploads',
    '.vscode',
    '.idea',
    'tmp',
    'coverage'
)

# Extensions to exclude (images, pdf, md, docx, binaries, archives, lock files)
$excludedExts = @(
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff', '.tif',
    '.pdf',
    '.md',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.7z', '.zip', '.tar', '.gz', '.rar',
    '.glb', '.gltf', '.mp3', '.mp4', '.avi', '.mov',
    '.lock', '.bin', '.exe', '.dll', '.pyc', '.so', '.dylib', '.db', '.sqlite'
)

# Exact filenames to exclude
$excludedFiles = @(
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bundle_source.bat',
    'full_source_code.txt',
    '.gitignore',
    '.gitattributes'
)

Write-Host "Scanning project directory..." -ForegroundColor Yellow

$allFiles = Get-ChildItem -Path $rootDir -Recurse -File

$selectedFiles = @()

foreach ($file in $allFiles) {
    $relPath = $file.FullName.Substring($rootDir.Path.Length + 1)
    
    # Check if file is inside an excluded directory
    $inExcludedDir = $false
    foreach ($dir in $excludedDirs) {
        if ($relPath.StartsWith("$dir\") -or $relPath.Contains("\$dir\")) {
            $inExcludedDir = $true
            break
        }
    }
    if ($inExcludedDir) { continue }
    
    # Check if file extension is excluded
    if ($excludedExts -contains $file.Extension.ToLower()) {
        continue
    }
    
    # Check if filename is excluded
    if ($excludedFiles -contains $file.Name.ToLower()) {
        continue
    }
    
    $selectedFiles += $file
}

Write-Host "Found $($selectedFiles.Count) custom source code files to bundle.`n" -ForegroundColor Green

$count = 0
$streamWriter = [System.IO.StreamWriter]::new($outputFile, $false, [System.Text.Encoding]::UTF8)

try {
    foreach ($file in $selectedFiles) {
        $relPath = $file.FullName.Substring($rootDir.Path.Length + 1)
        
        $header = @"
================================================================================
FILE: $relPath
================================================================================
"@
        $streamWriter.WriteLine($header)
        
        try {
            $content = [System.IO.File]::ReadAllText($file.FullName)
            $streamWriter.WriteLine($content)
        } catch {
            $streamWriter.WriteLine("[Error reading file: $_]")
        }
        
        $streamWriter.WriteLine()
        $streamWriter.WriteLine()
        
        $count++
        Write-Host "[$count/$($selectedFiles.Count)] Bundled: $relPath" -ForegroundColor Gray
    }
} finally {
    $streamWriter.Close()
    $streamWriter.Dispose()
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " Bundling Complete!" -ForegroundColor Green
Write-Host " Total source files combined: $count" -ForegroundColor Green
Write-Host " Output written to: full_source_code.txt" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
