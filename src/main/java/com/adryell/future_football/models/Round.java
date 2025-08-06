package com.adryell.future_football.models;

import java.util.List;

public class Round {
    private int id;
    private int leagueId;
    private int roundNumber;
    private List<Match> matches;

    public int getId() {
        return id;
    }

    public int getLeagueId() {
        return leagueId;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public List<Match> getMatches() {
        return matches;
    }

    public void setId(int id) {
        this.id = id;
    }

    public void setLeagueId(int leagueId) {
        this.leagueId = leagueId;
    }

    public void setMatches(List<Match> matches) {
        this.matches = matches;
    }

    public void setRoundNumber(int roundNumber) {
        this.roundNumber = roundNumber;
    }
}
