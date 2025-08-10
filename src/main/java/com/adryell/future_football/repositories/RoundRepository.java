package com.adryell.future_football.repositories;

import com.adryell.future_football.models.Round;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundRepository extends JpaRepository<Round, Integer> {
    List<Round> findByLeagueIdOrderByRoundNumberAsc(int leagueId);
    Round findByLeagueIdAndRoundNumber(int leagueId, int roundNumber);
}
