package com.adryell.future_football.dto;

public class CreateTeamRequestDTO {
    static String name;

    public CreateTeamRequestDTO() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        CreateTeamRequestDTO.name = name;
    }
}
