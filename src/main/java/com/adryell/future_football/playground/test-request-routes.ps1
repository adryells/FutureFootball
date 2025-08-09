# Script PowerShell para testar rotas da API Future Football

$baseUrl = "http://localhost:8080"

Write-Host "Testando GET /leagues/100/standings"
Invoke-RestMethod -Uri "$baseUrl/leagues/100/standings" -Method GET | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "`nTestando GET /leagues/100"
Invoke-RestMethod -Uri "$baseUrl/leagues/100" -Method GET | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "`nTestando GET /leagues"
Invoke-RestMethod -Uri "$baseUrl/leagues" -Method GET | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "`nTestando GET /leagues/100/rounds"
Invoke-RestMethod -Uri "$baseUrl/leagues/100/rounds" -Method GET | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "`nTestando GET /leagues/100/teams"
Invoke-RestMethod -Uri "$baseUrl/leagues/100/teams" -Method GET | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "`nTestando GET /teams/1"
Invoke-RestMethod -Uri "$baseUrl/teams/1" -Method GET | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "`nTestando POST /leagues/100/rounds/1/scores"
$body = @'
[
  {"matchId":101,"homeScore":2,"awayScore":1},
  {"matchId":102,"homeScore":0,"awayScore":0}
]
'@

Invoke-RestMethod -Uri "$baseUrl/leagues/100/rounds/1/scores" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body $body | Write-Host
