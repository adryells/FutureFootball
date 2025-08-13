package com.adryell.future_football.dto;

public class ScoreUpdateDTO {
    private int matchId;
    private int homeScore;
    private int awayScore;

    public ScoreUpdateDTO() {
    }

    public ScoreUpdateDTO(int matchId, int homeScore, int awayScore) {
        this.matchId = matchId;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
    }

    public int getMatchId() {
        return matchId;
    }

    public void setMatchId(int matchId) {
        this.matchId = matchId;
    }

    public int getHomeScore() {
        return homeScore;
    }

    public void setHomeScore(int homeScore) {
        this.homeScore = homeScore;
    }

    public int getAwayScore() {
        return awayScore;
    }

    public void setAwayScore(int awayScore) {
        this.awayScore = awayScore;
    }
}
