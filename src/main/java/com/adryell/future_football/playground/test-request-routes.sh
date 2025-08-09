#!/bin/bash

BASE_URL="http://localhost:8080"

echo "Testando GET /leagues/100/standings"
curl -s "$BASE_URL/leagues/100/standings" | jq .

echo -e "\nTestando GET /leagues/100"
curl -s "$BASE_URL/leagues/100" | jq .

echo -e "\nTestando GET /leagues"
curl -s "$BASE_URL/leagues" | jq .

echo -e "\nTestando GET /leagues/100/rounds"
curl -s "$BASE_URL/leagues/100/rounds" | jq .

echo -e "\nTestando GET /leagues/100/teams"
curl -s "$BASE_URL/leagues/100/teams" | jq .

echo -e "\nTestando GET /teams/1"
curl -s "$BASE_URL/teams/1" | jq .

echo -e "\nTestando POST /leagues/100/rounds/1/scores"
curl -s -X POST "$BASE_URL/leagues/100/rounds/1/scores" \
  -H "Content-Type: application/json" \
  -d '[{"matchId":101,"homeScore":2,"awayScore":1},{"matchId":102,"homeScore":0,"awayScore":0}]' | jq .
