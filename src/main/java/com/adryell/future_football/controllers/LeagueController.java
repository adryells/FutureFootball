package com.adryell.future_football.controllers;

import com.adryell.future_football.models.LeagueParticipant;
import com.adryell.future_football.models.Round;
import com.adryell.future_football.models.Standing;
import com.adryell.future_football.services.LeagueParticipantService;
import com.adryell.future_football.services.RoundService;
import com.adryell.future_football.services.StandingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ligas")
public class LeagueController {

    private final LeagueParticipantService participantService;
    private final RoundService roundService;
    private final StandingService standingsService;

    public LeagueController(LeagueParticipantService participantService, RoundService roundService, StandingService standingsService) {
        this.participantService = participantService;
        this.roundService = roundService;
        this.standingsService = standingsService;
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
