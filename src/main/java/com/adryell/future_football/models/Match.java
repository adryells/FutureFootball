package com.adryell.future_football.models;

public class Match {
    private int id;
    private int homeTeamId;
    private int awayTeamId;
    private int homeScore;
    private int awayScore;

    public int getId() {
        return id;
    }

    public int getAwayScore() {
        return awayScore;
    }

    public int getAwayTeamId() {
        return awayTeamId;
    }

    public int getHomeScore() {
        return homeScore;
    }

    public int getHomeTeamId() {
        return homeTeamId;
    }

    public void setId(int id) {
        this.id = id;
    }

    public void setAwayTeamId(int awayTeamId) {
        this.awayTeamId = awayTeamId;
    }

    public void setAwayScore(int awayScore) {
        this.awayScore = awayScore;
    }

    public void setHomeTeamId(int homeTeamId) {
        this.homeTeamId = homeTeamId;
    }

    public void setHomeScore(int homeScore) {
        this.homeScore = homeScore;
    }
}
