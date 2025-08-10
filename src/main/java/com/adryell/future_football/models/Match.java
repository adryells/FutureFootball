package com.adryell.future_football.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int homeScore;
    private int awayScore;

    @Column(name = "played")
    private boolean played = false;

    @ManyToOne
    @JoinColumn(name = "home_team_id")
    @JsonManagedReference(value = "team-homeMatches")
    private Team homeTeam;

    @ManyToOne
    @JoinColumn(name = "away_team_id")
    @JsonManagedReference(value = "team-awayMatches")
    private Team awayTeam;

    @ManyToOne
    @JoinColumn(name = "round_id")
    @JsonBackReference(value = "round-matches")
    private Round round;


    public Match() {}

    public Match(Team homeTeam, Team awayTeam, int homeScore, int awayScore, Round round) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.round = round;
    }

    public int getId() { return id; }
    public int getHomeScore() { return homeScore; }
    public int getAwayScore() { return awayScore; }
    public Team getHomeTeam() { return homeTeam; }
    public Team getAwayTeam() { return awayTeam; }
    public Round getRound() { return round; }

    public boolean isPlayed() {
        return played;
    }

    public void setId(int id) { this.id = id; }
    public void setHomeScore(int homeScore) { this.homeScore = homeScore; }
    public void setAwayScore(int awayScore) { this.awayScore = awayScore; }
    public void setHomeTeam(Team homeTeam) { this.homeTeam = homeTeam; }
    public void setAwayTeam(Team awayTeam) { this.awayTeam = awayTeam; }
    public void setRound(Round round) { this.round = round; }

    public void setPlayed(boolean played) {
        this.played = played;
    }
}
