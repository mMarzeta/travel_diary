package project.travel_diary;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Created by maciejmarzeta on 17.05.2018.
 */

@Component
public class DatabaseLoader implements CommandLineRunner{
    private final PlaceRepository places;
    private final ManagerRepository managers;

    @Autowired
    public DatabaseLoader(PlaceRepository placeRepository, ManagerRepository managerRepository){
        this.places = placeRepository;
        this.managers = managerRepository;
    }

    @Override
    public void run(String... strings) throws Exception{
        Manager maciek1 = this.managers.save(new Manager("Maciek1", "Nazwisko1", "ROLE_MANAGER"));
        Manager maciek2 = this.managers.save(new Manager("Maciek2", "Nazwisko2", "ROLE_MANAGER"));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("Maciek1", "haslo123",
                        AuthorityUtils.createAuthorityList("ROLE_MANAGER"))
        );
//
//        Place place1 = new Place(1.2, 2.4, "opis211", new Date(100), new Date(210000), maciek1);
//        Place place2 = new Place(1.3, 2.4, "opis2", new Date(), new Date(), maciek1);
//        Place place3 = new Place(1.4, 2.4, "opis3", new Date(), new Date(), maciek1);
//
//        this.places.save(place1);
//        this.places.save(place2);
//        this.places.save(place3);


        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("Maciek2", "haslo123",
                        AuthorityUtils.createAuthorityList("ROLE_MANAGER"))
        );

        Place place4 = new Place(1.2, 2.4, "hiszpania", new Date(100), new Date(210000), maciek2);
        Place place5 = new Place(1.3, 2.4, "polska", new Date(), new Date(), maciek2);
        Place place6 = new Place(1.4, 2.4, "francja", new Date(), new Date(), maciek2);

        this.places.save(place4);
        this.places.save(place5);
        this.places.save(place6);

        SecurityContextHolder.clearContext();
    }
}
