# Global Find and Replace: dominos -> masova throughout the entire project
# This script handles all variations while preserving case sensitivity

$projectRoot = "D:\projects\dominos-management-system"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Renaming 'dominos' to 'masova' globally" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Define file extensions to process
$extensions = @("*.java", "*.yml", "*.yaml", "*.xml", "*.properties", "*.md", "*.ts", "*.tsx", "*.json", "*.js", "*.sql")

# Directories to exclude
$excludeDirs = @("node_modules", ".git", "target", "build", "dist", ".idea", "backups")

# Get all files matching criteria
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

Write-Host "Found $($files.Count) files to process`n" -ForegroundColor Yellow

$changedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue

    if ($null -eq $content) {
        continue
    }

    $originalContent = $content

    # Replace all variations to exactly "MaSoVa" (case-insensitive search)
    $content = $content -creplace 'dominos', 'masova'
    $content = $content -creplace 'Dominos', 'MaSoVa'
    $content = $content -creplace 'DOMINOS', 'MASOVA'
    $content = $content -creplace "Domino's", 'MaSoVa'
    $content = $content -creplace 'domino', 'masova'
    $content = $content -creplace 'Domino', 'MaSoVa'

    # Check if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $changedFiles++
        $relativePath = $file.FullName.Replace($projectRoot, "")
        Write-Host "  Updated: $relativePath" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Replacement Complete!" -ForegroundColor Cyan
Write-Host "Files changed: $changedFiles / $($files.Count)" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your backend services" -ForegroundColor White
Write-Host "2. The database name is now 'masova'" -ForegroundColor White
Write-Host "3. Container names are now 'masova-mongodb' and 'masova-redis'" -ForegroundColor White
Write-Host "4. Java packages are now 'com.masova.*'" -ForegroundColor White
