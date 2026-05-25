<#
Safe revert script for changes made by the assistant.
Run this in the repository root (D:\TMDT-team\watch-ecommerce). This will:
 - restore modified files to HEAD (no commits created)
 - remove untracked files added by the assistant

IMPORTANT: This script uses git. It does not commit. It will modify your working tree.
#>

param(
    [switch]$Preview
)

Write-Host "Checking git status..."
git --no-pager status --porcelain

if ($Preview) {
    Write-Host "Preview mode: no changes will be made. Use without -Preview to apply." -ForegroundColor Yellow
}

$filesToRestore = @(
    'backend/package.json',
    'frontend/src/components/admin/StoreSettingsTab.jsx',
    'frontend/src/components/BestSellerSection.jsx',
    'frontend/src/components/FlashSaleSection.jsx',
    'frontend/src/components/FeaturedProducts.jsx',
    'frontend/src/pages/CatalogPage.jsx',
    'frontend/src/components/FilterSidebar.jsx'
)

Write-Host "Files to restore to HEAD:
" + ($filesToRestore -join "`n")

if (-not $Preview) {
    foreach ($f in $filesToRestore) {
        if (Test-Path $f) {
            Write-Host "Restoring $f to HEAD..."
            git restore --source=HEAD --staged --worktree -- $f
        } else {
            Write-Host "$f not present in working tree; skipping." -ForegroundColor DarkYellow
        }
    }

    Write-Host "Removing assistant-added files if present..."
    $added = @(
        'backend/scripts/remove-dbg-entities.mjs',
        'backend/scripts/check-dbg.mjs'
    )
    foreach ($af in $added) {
        if (Test-Path $af) {
            Write-Host "Removing $af"
            Remove-Item $af -Force
        }
    }

    Write-Host "Cleaning untracked files (git clean -fd)"
    git clean -fd

    Write-Host "Final git status:"; git --no-pager status --porcelain
    Write-Host "Done."
} else {
    Write-Host "Preview complete. Run without -Preview to apply changes." -ForegroundColor Green
}
