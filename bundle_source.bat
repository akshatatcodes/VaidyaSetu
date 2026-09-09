<# :
@echo off
title VaidyaSetu Source Code Bundler
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression (Get-Content '%~f0' -Raw)"
pause
exit /b %ERRORLEVEL%
#>

$rootDir = Get-Location
$outputFile = Join-Path $rootDir "full_source_code.txt"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "         VaidyaSetu Source Code Bundler           " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Target output file: $outputFile`n" -ForegroundColor Yellow

if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
}

# Directories to exclude (dependencies, git, build, cache, generated datasets)
$excludedDirs = @(
    'node_modules',
    '.git',
    '.qoder',
    'dist',
    'build',
    'uploads',
    '.vscode',
    '.idea',
    'tmp',
    'temp',
    'coverage',
    'scratch',
    'chunks',
    'embeddings',
    'processed-text',
    'pubmed'
)

# Extensions to exclude (images, binaries, archives, office docs, lock files)
$excludedExts = @(
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff', '.tif',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.7z', '.zip', '.tar', '.gz', '.rar',
    '.glb', '.gltf', '.mp3', '.mp4', '.avi', '.mov',
    '.lock', '.bin', '.exe', '.dll', '.pyc', '.so', '.dylib', '.db', '.sqlite'
)

# Specific filenames to exclude
$excludedFiles = @(
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bundle_source.bat',
    'full_source_code.txt',
    'vaidyasetu_all_files.bat',
    '.gitignore',
    '.gitattributes',
    '.__deleteprobe'
)

Write-Host "Scanning project directory for user-created source files..." -ForegroundColor Yellow

function Get-UserFiles($dir) {
    $results = @()
    $items = Get-ChildItem -Path $dir -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        # Skip excluded directory names
        if ($item.PSIsContainer) {
            if ($excludedDirs -contains $item.Name.ToLower()) { continue }
            $results += Get-UserFiles $item.FullName
        } else {
            # Skip excluded filenames
            if ($excludedFiles -contains $item.Name.ToLower()) { continue }
            # Skip excluded extensions
            if ($excludedExts -contains $item.Extension.ToLower()) { continue }
            $results += $item
        }
    }
    return $results
}

$selectedFiles = Get-UserFiles $rootDir

Write-Host "Found $($selectedFiles.Count) custom source code files to bundle.`n" -ForegroundColor Green

$count = 0
$streamWriter = [System.IO.StreamWriter]::new($outputFile, $false, [System.Text.Encoding]::UTF8)

try {
    # Write summary header at top of full_source_code.txt
    $topHeader = @"
================================================================================
VAIDYASETU PROJECT SOURCE CODE BUNDLE
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Total Files Included: $($selectedFiles.Count)
Note: Excluded node_modules, .git, build artifacts, binaries, and lock files.
================================================================================

TABLE OF CONTENTS:
"@
    $streamWriter.WriteLine($topHeader)

    foreach ($file in $selectedFiles) {
        $relPath = $file.FullName.Substring($rootDir.Path.Length + 1)
        $streamWriter.WriteLine("  - $relPath")
    }

    $streamWriter.WriteLine()
    $streamWriter.WriteLine("================================================================================")
    $streamWriter.WriteLine("FILE CONTENTS")
    $streamWriter.WriteLine("================================================================================")
    $streamWriter.WriteLine()

    foreach ($file in $selectedFiles) {
        $relPath = $file.FullName.Substring($rootDir.Path.Length + 1)
        
        $header = @"
================================================================================
FILE: $relPath
SIZE: $($file.Length) bytes
================================================================================
"@
        $streamWriter.WriteLine($header)
        
        try {
            $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
            $streamWriter.WriteLine($content)
        } catch {
            $streamWriter.WriteLine("[Error reading file content: $_]")
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
Write-Host " Output file: full_source_code.txt" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
