package com.adryell.future_football.repositories;

import com.adryell.future_football.models.Match;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<Match, Integer> {
}
