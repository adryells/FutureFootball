package com.adryell.future_football.models;

public class LeagueParticipant {
    private int teamId;
    private int leagueId;
    private String teamName;

    public int getLeagueId() {
        return leagueId;
    }

    public String getTeamName() {
        return teamName;
    }

    public int getTeamId() {
        return teamId;
    }

    public void setLeagueId(int leagueId) {
        this.leagueId = leagueId;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public void setTeamId(int teamId) {
        this.teamId = teamId;
    }
}
