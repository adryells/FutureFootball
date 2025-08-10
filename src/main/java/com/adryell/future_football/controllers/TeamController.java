package com.adryell.future_football.controllers;

import com.adryell.future_football.dto.CreateTeamRequestDTO;
import com.adryell.future_football.models.Team;
import com.adryell.future_football.services.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.findAll());
    }

    @PostMapping
    public ResponseEntity<String> createTeam(@RequestBody CreateTeamRequestDTO teamData) {
        if (teamData.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Team name is required.");
        }
        boolean created = teamService.saveTeam(teamData);
        if (!created) {
            return ResponseEntity.badRequest().body("Error on save.");
        }
        return ResponseEntity.ok("Team successfully created.");
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<Team> getTeamById(@PathVariable int teamId) {
        Team team = teamService.findById(teamId);
        if (team == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(team);
    }
}
