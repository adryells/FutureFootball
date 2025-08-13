package com.adryell.future_football.repositories;

import com.adryell.future_football.models.League;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeagueRepository extends JpaRepository<League, Integer> {
    Optional<League> findById(int Id);
    Optional<League> findByNameIgnoreCaseAndYear(String name, int year);
}
