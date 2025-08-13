package com.adryell.future_football.models;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "leagues")
public class League {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;
    private int year;

    @OneToMany(mappedBy = "league", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<LeagueParticipant> participants;

    @OneToMany(mappedBy = "league", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference(value = "league-rounds")
    private List<Round> rounds;

    public League() {}

    public League(String name, int year) {
        this.name = name;
        this.year = year;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public int getYear() { return year; }
    public List<LeagueParticipant> getParticipants() { return participants; }
    public List<Round> getRounds() { return rounds; }

    public void setId(int id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setYear(int year) { this.year = year; }
    public void setParticipants(List<LeagueParticipant> participants) { this.participants = participants; }
    public void setRounds(List<Round> rounds) { this.rounds = rounds; }
}
