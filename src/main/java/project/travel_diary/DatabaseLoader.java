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
        Place place = new Place(1.2, 2.4, "opis", new Date(), new Date());
        this.repository.save(place);
    }
}
