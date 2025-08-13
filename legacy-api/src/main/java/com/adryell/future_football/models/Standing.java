package com.adryell.future_football.models;

public class Standing {
    private int teamId;
    private String teamName;
    private int points;
    private int gamesPlayed;
    private int wins;
    private int draws;
    private int losses;
    private int goalsFor;
    private int goalsAgainst;

    public Standing(){}

    public int getGoalDifference() {
        return goalsFor - goalsAgainst;
    }

    public double getWinPercentage() {
        return gamesPlayed == 0 ? 0 : (wins * 100.0) / gamesPlayed;
    }

    public int getDraws() {
        return draws;
    }

    public int getGamesPlayed() {
        return gamesPlayed;
    }

    public int getLosses() {
        return losses;
    }

    public int getGoalsAgainst() {
        return goalsAgainst;
    }

    public int getGoalsFor() {
        return goalsFor;
    }

    public int getPoints() {
        return points;
    }

    public int getTeamId() {
        return teamId;
    }

    public int getWins() {
        return wins;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setDraws(int draws) {
        this.draws = draws;
    }

    public void setGamesPlayed(int gamesPlayed) {
        this.gamesPlayed = gamesPlayed;
    }

    public void setGoalsAgainst(int goalsAgainst) {
        this.goalsAgainst = goalsAgainst;
    }

    public void setGoalsFor(int goalsFor) {
        this.goalsFor = goalsFor;
    }

    public void setLosses(int losses) {
        this.losses = losses;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public void setTeamId(int teamId) {
        this.teamId = teamId;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public void setWins(int wins) {
        this.wins = wins;
    }
}
