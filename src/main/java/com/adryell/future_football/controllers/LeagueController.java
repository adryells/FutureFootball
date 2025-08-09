package com.adryell.future_football.controllers;

import com.adryell.future_football.dto.ScoreUpdateDTO;
import com.adryell.future_football.models.League;
import com.adryell.future_football.models.LeagueParticipant;
import com.adryell.future_football.models.Round;
import com.adryell.future_football.models.Standing;
import com.adryell.future_football.services.LeagueParticipantService;
import com.adryell.future_football.services.LeagueService;
import com.adryell.future_football.services.RoundService;
import com.adryell.future_football.services.StandingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leagues")
public class LeagueController {

    private final LeagueService leagueService;
    private final LeagueParticipantService participantService;
    private final RoundService roundService;
    private final StandingService standingsService;

    public LeagueController(
            LeagueService leagueService,
            LeagueParticipantService participantService,
            RoundService roundService,
            StandingService standingsService
    ) {
        this.leagueService = leagueService;
        this.participantService = participantService;
        this.roundService = roundService;
        this.standingsService = standingsService;
    }

    @GetMapping
    public ResponseEntity<List<League>> getAllLeagues() {
        List<League> leagues = leagueService.findAll();
        return ResponseEntity.ok(leagues);
    }

    @GetMapping("/{leagueId}")
    public ResponseEntity<League> getLeagueById(@PathVariable int leagueId) {
        League league = leagueService.findById(leagueId);
        if (league == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(league);
    }

    @GetMapping("/{leagueId}/rounds")
    public ResponseEntity<List<Round>> getRoundsByLeague(@PathVariable int leagueId) {
        List<Round> rounds = roundService.findByLeagueId(leagueId);
        if (rounds.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rounds);
    }

    @GetMapping("/{leagueId}/teams")
    public ResponseEntity<List<LeagueParticipant>> getTeamsByLeague(@PathVariable int leagueId) {
        List<LeagueParticipant> participants = participantService.findByLeagueId(leagueId);
        if (participants.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(participants);
    }

    @PostMapping("/{leagueId}/rounds/{roundNumber}/scores")
    public ResponseEntity<String> postScores(
            @PathVariable int leagueId,
            @PathVariable int roundNumber,
            @RequestBody List<ScoreUpdateDTO> scores
    ) {
        boolean updated = roundService.updateScores(leagueId, roundNumber, scores);
        if (updated) {
            return ResponseEntity.ok("Scores updated successfully");
        } else {
            return ResponseEntity.badRequest().body("Round not found or update failed");
        }
    }

    @GetMapping("/{leagueId}/standings")
    public ResponseEntity<List<Standing>> getStandings(@PathVariable int leagueId) {
        List<LeagueParticipant> participants = participantService.findByLeagueId(leagueId);
        List<Round> rounds = roundService.findByLeagueId(leagueId);

        if (participants.isEmpty() || rounds.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Standing> standings = standingsService.calculateStandings(rounds, participants);
        return ResponseEntity.ok(standings);
    }
}
