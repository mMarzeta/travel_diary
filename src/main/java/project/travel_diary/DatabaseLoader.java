package project.travel_diary;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Created by maciejmarzeta on 17.05.2018.
 */

@Component
public class DatabaseLoader implements CommandLineRunner{
    private final PlaceRepository repository;

    @Autowired
    public DatabaseLoader(PlaceRepository repository){
        this.repository = repository;
    }

    @Override
    public void run(String... strings) throws Exception{
        Place place1 = new Place(1.2, 2.4, "opis1", new Date(), new Date());
        Place place2 = new Place(1.3, 2.4, "opis2", new Date(), new Date());
        Place place3 = new Place(1.4, 2.4, "opis3", new Date(), new Date());

        this.repository.save(place1);
        this.repository.save(place2);
        this.repository.save(place3);

    }
}
