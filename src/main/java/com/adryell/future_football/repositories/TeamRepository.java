package com.adryell.future_football.repositories;

import com.adryell.future_football.models.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Integer> {
    Optional<Team> findByNameIgnoreCase(String name);
}
