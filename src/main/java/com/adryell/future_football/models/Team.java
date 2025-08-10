package com.adryell.future_football.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference
    private List<LeagueParticipant> participations;

    public Team() {}

    public Team(String name) {
        this.name = name;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public List<LeagueParticipant> getParticipations() { return participations; }

    public void setId(int id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setParticipations(List<LeagueParticipant> participations) { this.participations = participations; }
}
