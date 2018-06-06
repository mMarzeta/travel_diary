package project.travel_diary;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;

/**
 * Created by maciejmarzeta on 17.05.2018.
 */
public interface PlaceRepository extends
        CrudRepository<Place, Long>,
        PagingAndSortingRepository<Place, Long>{
}
