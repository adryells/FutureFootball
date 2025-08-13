package com.adryell.future_football.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "rounds")
public class Round {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int roundNumber;

    @ManyToOne
    @JoinColumn(name = "league_id")
    @JsonBackReference(value = "league-rounds")
    private League league;

    @OneToMany(mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference(value = "round-matches")
    private List<Match> matches;

    public Round() {}

    public Round(int roundNumber, League league) {
        this.roundNumber = roundNumber;
        this.league = league;
    }

    public int getId() { return id; }
    public int getRoundNumber() { return roundNumber; }
    public League getLeague() { return league; }
    public List<Match> getMatches() { return matches; }

    public void setId(int id) { this.id = id; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public void setLeague(League league) { this.league = league; }
    public void setMatches(List<Match> matches) { this.matches = matches; }
}
