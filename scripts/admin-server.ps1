$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 4174)
$utf8 = [Text.UTF8Encoding]::new($false)
$maxUploadBytes = 500MB

function Send-Response($stream, [int]$status, [string]$reason, [string]$contentType, [byte[]]$body) {
  $header = "HTTP/1.1 $status $reason`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`nX-Content-Type-Options: nosniff`r`nCache-Control: no-store`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
}

function Send-File($stream, [string]$path, [string]$contentType, [bool]$headOnly) {
  $length = (Get-Item -LiteralPath $path).Length
  $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $length`r`nConnection: close`r`nX-Content-Type-Options: nosniff`r`nCache-Control: no-store`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $headOnly) {
    $file = [IO.File]::OpenRead($path)
    try { $file.CopyTo($stream, 65536) } finally { $file.Dispose() }
  }
}

function Send-Json($stream, [int]$status, $value) {
  $json = ConvertTo-Json -InputObject $value -Depth 40
  Send-Response $stream $status 'OK' 'application/json; charset=utf-8' $utf8.GetBytes($json)
}

function Read-Request($stream) {
  $headerBytes = [Collections.Generic.List[byte]]::new()
  $marker = [byte[]](13, 10, 13, 10)
  while ($headerBytes.Count -lt 65536) {
    $next = $stream.ReadByte()
    if ($next -lt 0) { throw 'Connection closed before request headers were complete.' }
    $headerBytes.Add([byte]$next)
    $n = $headerBytes.Count
    if ($n -ge 4 -and $headerBytes[$n - 4] -eq 13 -and $headerBytes[$n - 3] -eq 10 -and $headerBytes[$n - 2] -eq 13 -and $headerBytes[$n - 1] -eq 10) { break }
  }
  if ($headerBytes.Count -ge 65536) { throw 'Request headers are too large.' }
  $headerText = [Text.Encoding]::ASCII.GetString($headerBytes.ToArray())
  $lines = $headerText -split "`r`n"
  $requestParts = $lines[0].Split(' ', 3)
  if ($requestParts.Count -lt 2) { throw 'Malformed request line.' }
  $headers = @{}
  foreach ($line in $lines | Select-Object -Skip 1) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $colon = $line.IndexOf(':')
    if ($colon -gt 0) { $headers[$line.Substring(0, $colon).Trim().ToLowerInvariant()] = $line.Substring($colon + 1).Trim() }
  }
  $length = 0L
  if ($headers.ContainsKey('content-length')) { $length = [long]$headers['content-length'] }
  return @{ Method = $requestParts[0].ToUpperInvariant(); Target = $requestParts[1]; Headers = $headers; Length = $length }
}

function Read-BodyBytes($stream, [long]$length) {
  if ($length -gt 10MB) { throw 'Request body is too large.' }
  $body = [byte[]]::new([int]$length)
  $offset = 0
  while ($offset -lt $body.Length) {
    $read = $stream.Read($body, $offset, $body.Length - $offset)
    if ($read -le 0) { throw 'Request body ended early.' }
    $offset += $read
  }
  return ,$body
}

function Save-RequestBody($stream, [long]$length, [string]$path) {
  if ($length -gt $maxUploadBytes) { throw 'ZIP is larger than the 500 MB local upload limit.' }
  $file = [IO.File]::Open($path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
  try {
    $buffer = [byte[]]::new(65536)
    $remaining = $length
    while ($remaining -gt 0) {
      $wanted = [int][Math]::Min($buffer.Length, $remaining)
      $read = $stream.Read($buffer, 0, $wanted)
      if ($read -le 0) { throw 'ZIP upload ended early.' }
      $file.Write($buffer, 0, $read)
      $remaining -= $read
    }
  } finally { $file.Dispose() }
}

function Write-JsonFile([string]$path, $value) {
  $json = ConvertTo-Json -InputObject $value -Depth 40
  [IO.File]::WriteAllText($path, $json + [Environment]::NewLine, $utf8)
}

function Write-ProjectFile([string]$path, $projects) {
  $json = ConvertTo-Json -InputObject ([object[]]$projects) -Depth 40
  [IO.File]::WriteAllText($path, $json + [Environment]::NewLine, $utf8)
}

function Handle-Upload($stream, $request, [string]$query) {
  if ($request.Method -ne 'PUT') { Send-Json $stream 405 @{ error = 'Use PUT to upload a ZIP.' }; return }
  if ($request.Length -le 0) { Send-Json $stream 400 @{ error = 'The ZIP file is empty.' }; return }
  if ($request.Length -gt $maxUploadBytes) { Send-Json $stream 413 @{ error = 'ZIP is larger than the 500 MB local upload limit.' }; return }
  $params = [Web.HttpUtility]::ParseQueryString($query)
  $slug = $params['slug']
  if ([string]::IsNullOrWhiteSpace($slug) -or $slug -notmatch '^[a-z0-9-]{1,64}$') { Send-Json $stream 400 @{ error = 'Invalid project ID.' }; return }
  $projectsPath = Join-Path $root 'data/projects.json'
  $projects = @(Get-Content -LiteralPath $projectsPath -Raw -Encoding UTF8 | ConvertFrom-Json)
  if (-not ($projects | Where-Object { $_.id -eq $slug })) { Send-Json $stream 404 @{ error = 'Save this project before uploading its game.' }; return }

  $stagingRoot = Join-Path $root '.upload-staging'
  [IO.Directory]::CreateDirectory($stagingRoot) | Out-Null
  $stage = Join-Path $stagingRoot ([Guid]::NewGuid().ToString('N'))
  [IO.Directory]::CreateDirectory($stage) | Out-Null
  $zipPath = Join-Path $stage 'upload.zip'
  $extractPath = Join-Path $stage 'extracted'
  [IO.Directory]::CreateDirectory($extractPath) | Out-Null
  try {
    Save-RequestBody $stream $request.Length $zipPath
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
      $hasIndex = $false
      $unpacked = 0L
      foreach ($entry in $archive.Entries) {
        $name = $entry.FullName.Replace('\', '/')
        if ($name.StartsWith('/') -or $name -match '(^|/)\.\.(/|$)' -or $name -match '^[A-Za-z]:') { throw 'The ZIP contains an unsafe file path.' }
        if ($name -eq 'index.html') { $hasIndex = $true }
        $unpacked += $entry.Length
        if ($unpacked -gt 2GB) { throw 'The uncompressed game exceeds the 2 GB extraction limit.' }
        $destination = [IO.Path]::GetFullPath((Join-Path $extractPath ($name.Replace('/', [IO.Path]::DirectorySeparatorChar))))
        $prefix = [IO.Path]::GetFullPath($extractPath) + [IO.Path]::DirectorySeparatorChar
        if (-not $destination.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'The ZIP contains an unsafe file path.' }
        if ($name.EndsWith('/')) { [IO.Directory]::CreateDirectory($destination) | Out-Null; continue }
        [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
        [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $true)
      }
      if (-not $hasIndex) { throw 'ZIP must contain index.html at its top level.' }
    } finally { $archive.Dispose() }

    $gameRoot = Join-Path $root 'games'
    [IO.Directory]::CreateDirectory($gameRoot) | Out-Null
    $destinationRoot = Join-Path $gameRoot $slug
    $newRoot = Join-Path $gameRoot ($slug + '.uploading')
    $backupRoot = Join-Path $gameRoot ($slug + '.previous')
    if (Test-Path -LiteralPath $newRoot) { Remove-Item -LiteralPath $newRoot -Recurse -Force }
    if (Test-Path -LiteralPath $backupRoot) { Remove-Item -LiteralPath $backupRoot -Recurse -Force }
    Move-Item -LiteralPath $extractPath -Destination $newRoot
    if (Test-Path -LiteralPath $destinationRoot) { Move-Item -LiteralPath $destinationRoot -Destination $backupRoot }
    try { Move-Item -LiteralPath $newRoot -Destination $destinationRoot }
    catch { if (Test-Path -LiteralPath $backupRoot) { Move-Item -LiteralPath $backupRoot -Destination $destinationRoot }; throw }
    if (Test-Path -LiteralPath $backupRoot) { Remove-Item -LiteralPath $backupRoot -Recurse -Force }
    foreach ($project in $projects) { if ($project.id -eq $slug) { $project | Add-Member -NotePropertyName gamePath -NotePropertyValue "games/$slug/index.html" -Force } }
    Write-ProjectFile $projectsPath $projects
    Send-Json $stream 200 @{ ok = $true; gamePath = "games/$slug/index.html" }
  } finally {
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue }
  }
}

function Handle-Client($client) {
  $stream = $client.GetStream()
  try {
    $request = Read-Request $stream
    $target = [Uri]::new('http://127.0.0.1' + $request.Target)
    if ($request.Headers.ContainsKey('host') -and $request.Headers['host'] -notmatch '^127\.0\.0\.1:4174$|^localhost:4174$') { Send-Json $stream 403 @{ error = 'Local editor only.' }; return }
    if ($target.AbsolutePath -eq '/api/projects' -or $target.AbsolutePath -eq '/api/site') {
      $file = if ($target.AbsolutePath -eq '/api/projects') { Join-Path $root 'data/projects.json' } else { Join-Path $root 'data/site.json' }
      if ($request.Method -eq 'GET') { Send-Response $stream 200 'OK' 'application/json; charset=utf-8' ([IO.File]::ReadAllBytes($file)); return }
      if ($request.Method -ne 'PUT') { Send-Json $stream 405 @{ error = 'Use GET or PUT.' }; return }
      $body = Read-BodyBytes $stream $request.Length
      $bodyText = [Text.Encoding]::UTF8.GetString($body)
      $value = $bodyText | ConvertFrom-Json
      if ($target.AbsolutePath -eq '/api/projects') {
        if (-not $bodyText.TrimStart().StartsWith('[')) { throw 'Projects must be a JSON array.' }
        [IO.File]::WriteAllText($file, $bodyText.Trim() + [Environment]::NewLine, $utf8)
      } else {
        Write-JsonFile $file $value
      }
      Send-Json $stream 200 @{ ok = $true }
      return
    }
    if ($target.AbsolutePath -eq '/api/upload-game') { Handle-Upload $stream $request $target.Query.TrimStart('?'); return }
    if ($request.Method -ne 'GET' -and $request.Method -ne 'HEAD') { Send-Json $stream 405 @{ error = 'Method not allowed.' }; return }
    $relative = [Uri]::UnescapeDataString($target.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrEmpty($relative)) { $relative = 'index.html' }
    if ($relative.Contains('..') -or $relative.Contains('\') -or $relative.StartsWith('.')) { Send-Json $stream 404 @{ error = 'Not found.' }; return }
    $filePath = [IO.Path]::GetFullPath((Join-Path $root $relative))
    if (-not $filePath.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) { Send-Json $stream 404 @{ error = 'Not found.' }; return }
    $extension = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
    $mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.webp'='image/webp'; '.wasm'='application/wasm'; '.data'='application/octet-stream'; '.unityweb'='application/octet-stream'; '.asset'='application/octet-stream'; '.bin'='application/octet-stream'; '.mp3'='audio/mpeg'; '.ogg'='audio/ogg'; '.wav'='audio/wav'; '.mp4'='video/mp4'; '.woff2'='font/woff2'; '.pdf'='application/pdf' }
    $contentType = if ($mime.ContainsKey($extension)) { $mime[$extension] } else { 'application/octet-stream' }
    Send-File $stream $filePath $contentType ($request.Method -eq 'HEAD')
  } catch {
    try { Send-Json $stream 500 @{ error = $_.Exception.Message } } catch {}
  } finally { $stream.Dispose(); $client.Dispose() }
}

try {
  $listener.Start()
  Write-Host 'Portfolio editor is running at http://127.0.0.1:4174/admin.html'
  Write-Host 'Keep this window open while editing. Press Ctrl+C to stop.'
  Start-Process 'http://127.0.0.1:4174/admin.html'
  while ($true) {
    $client = $listener.AcceptTcpClient()
    Handle-Client $client
  }
} finally { $listener.Stop() }
