# Complete Rename: dominos -> MaSoVa
# This script renames:
# 1. Folder names
# 2. File names
# 3. Content inside files

$projectRoot = "D:\projects\dominos-management-system"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Complete Rename: dominos -> MaSoVa" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Directories to exclude
$excludeDirs = @("node_modules", ".git", "target", "build", "dist", ".idea")

# STEP 1: Rename content inside files
Write-Host "STEP 1: Updating file contents..." -ForegroundColor Yellow

$extensions = @("*.java", "*.yml", "*.yaml", "*.xml", "*.properties", "*.md", "*.ts", "*.tsx", "*.json", "*.js", "*.sql", "*.txt")

$files = Get-ChildItem -Path $projectRoot -Recurse -Include $extensions | Where-Object {
    $path = $_.FullName
    $shouldExclude = $false
    foreach ($dir in $excludeDirs) {
        if ($path -like "*\$dir\*") {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
}

$changedFiles = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $content) { continue }

    $originalContent = $content

    # Replace all variations with exactly "MaSoVa"
    $content = $content -ireplace 'dominos', 'MaSoVa'
    $content = $content -ireplace "Domino's", 'MaSoVa'
    $content = $content -ireplace 'domino', 'MaSoVa'

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $changedFiles++
        Write-Host "  Updated content: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n  Files content updated: $changedFiles`n" -ForegroundColor Green

# STEP 2: Rename files (bottom-up to avoid path issues)
Write-Host "STEP 2: Renaming files..." -ForegroundColor Yellow

$filesToRename = Get-ChildItem -Path $projectRoot -Recurse -File | Where-Object {
    $path = $_.FullName
    $name = $_.Name
    $shouldExclude = $false
    foreach ($dir in $excludeDirs) {
        if ($path -like "*\$dir\*") {
            $shouldExclude = $true
            break
        }
    }
    (-not $shouldExclude) -and ($name -imatch 'domino')
}

$renamedFiles = 0
foreach ($file in $filesToRename) {
    $newName = $file.Name -ireplace 'dominos', 'MaSoVa' -ireplace 'domino', 'MaSoVa'
    if ($newName -ne $file.Name) {
        $newPath = Join-Path $file.DirectoryName $newName
        Rename-Item -Path $file.FullName -NewName $newName -Force
        $renamedFiles++
        Write-Host "  Renamed file: $($file.Name) -> $newName" -ForegroundColor Green
    }
}

Write-Host "`n  Files renamed: $renamedFiles`n" -ForegroundColor Green

# STEP 3: Rename folders (bottom-up, deepest first)
Write-Host "STEP 3: Renaming folders..." -ForegroundColor Yellow

$foldersToRename = Get-ChildItem -Path $projectRoot -Recurse -Directory | Where-Object {
    $path = $_.FullName
    $name = $_.Name
    $shouldExclude = $false
    foreach ($dir in $excludeDirs) {
        if ($name -eq $dir -or $path -like "*\$dir\*") {
            $shouldExclude = $true
            break
        }
    }
    (-not $shouldExclude) -and ($name -imatch 'domino')
} | Sort-Object -Property FullName -Descending

$renamedFolders = 0
foreach ($folder in $foldersToRename) {
    $newName = $folder.Name -ireplace 'dominos', 'MaSoVa' -ireplace 'domino', 'MaSoVa'
    if ($newName -ne $folder.Name) {
        $newPath = Join-Path $folder.Parent.FullName $newName
        Rename-Item -Path $folder.FullName -NewName $newName -Force
        $renamedFolders++
        Write-Host "  Renamed folder: $($folder.Name) -> $newName" -ForegroundColor Green
    }
}

Write-Host "`n  Folders renamed: $renamedFolders`n" -ForegroundColor Green

# STEP 4: Rename project root folder (optional - ask user)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  File contents updated: $changedFiles" -ForegroundColor White
Write-Host "  Files renamed: $renamedFiles" -ForegroundColor White
Write-Host "  Folders renamed: $renamedFolders" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "NOTE: The project root folder 'dominos-management-system'" -ForegroundColor Yellow
Write-Host "      should be manually renamed to 'masova-management-system'" -ForegroundColor Yellow
Write-Host "      after closing all editors and terminals.`n" -ForegroundColor Yellow

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close all terminals and IDEs" -ForegroundColor White
Write-Host "2. Manually rename project folder" -ForegroundColor White
Write-Host "3. Restart MongoDB/Redis with new names" -ForegroundColor White
Write-Host "4. Rebuild Java projects (mvn clean install)" -ForegroundColor White
Write-Host "5. Restart all services`n" -ForegroundColor White
