package com.adryell.future_football.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

@Entity
@Table(name = "league_participants")
public class LeagueParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "league_id")
    @JsonBackReference
    private League league;

    @ManyToOne
    @JoinColumn(name = "team_id")
    @JsonManagedReference
    private Team team;

    public LeagueParticipant() {}

    public LeagueParticipant(League league, Team team) {
        this.league = league;
        this.team = team;
    }

    public int getId() { return id; }
    public League getLeague() { return league; }
    public Team getTeam() { return team; }

    public void setId(int id) { this.id = id; }
    public void setLeague(League league) { this.league = league; }
    public void setTeam(Team team) { this.team = team; }
}
